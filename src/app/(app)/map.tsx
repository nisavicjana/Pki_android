import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { getBikes, getParkingSpots, type Bike, type ParkingSpot } from '@/data/storage';

function buildHtml(bikes: Bike[], parkingSpots: ParkingSpot[]) {
  const bikesJson = JSON.stringify(bikes);
  const parkingJson = JSON.stringify(parkingSpots);
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
      .pin {
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pin span {
        transform: rotate(45deg);
        color: #fff;
        font-size: 14px;
        font-weight: bold;
      }
      .bike-pin { background: #7aa6c6; }
      .parking-pin { background: #e08a2b; }
      .parking-pin span { font-size: 15px; }
      .user-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #1a73e8;
        border: 3px solid #fff;
        box-shadow: 0 0 0 4px rgba(26,115,232,0.25);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map', { zoomControl: true }).setView([44.7667, 20.4167], 15);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      var bikeIcon = L.divIcon({
        className: '',
        html: '<div class="pin bike-pin"><span>&#128692;</span></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      var parkingIcon = L.divIcon({
        className: '',
        html: '<div class="pin parking-pin"><span>P</span></div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      var userIcon = L.divIcon({
        className: '',
        html: '<div class="user-dot"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      var userMarker = null;
      var hasCenteredOnUser = false;
      window.updateUserLocation = function (lat, lng, follow) {
        if (userMarker) {
          userMarker.setLatLng([lat, lng]);
        } else {
          userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
          userMarker.bindPopup('Vaša lokacija');
        }
        if (follow || !hasCenteredOnUser) {
          map.setView([lat, lng], Math.max(map.getZoom(), 16));
          hasCenteredOnUser = true;
        }
      };

      var bikes = ${bikesJson};
      bikes.forEach(function (bike) {
        var marker = L.marker([bike.latitude, bike.longitude], { icon: bikeIcon }).addTo(map);
        marker.on('click', function () {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bikeSelected', bike: bike }));
          }
        });
      });

      var parking = ${parkingJson};
      parking.forEach(function (spot) {
        var marker = L.marker([spot.latitude, spot.longitude], { icon: parkingIcon }).addTo(map);
        marker.on('click', function () {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'parkingSelected', parking: spot }));
          }
        });
      });
    </script>
  </body>
</html>
`;
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function findNearestParking(bike: Bike, spots: ParkingSpot[]): { spot: ParkingSpot; distanceKm: number } | null {
  if (spots.length === 0) return null;
  let best = { spot: spots[0], distanceKm: distanceKm(bike, spots[0]) };
  for (let i = 1; i < spots.length; i++) {
    const d = distanceKm(bike, spots[i]);
    if (d < best.distanceKm) best = { spot: spots[i], distanceKm: d };
  }
  return best;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CerakBikeApp/1.0 (reverse geocoding for parking pins)',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    const street = a.road ?? a.pedestrian ?? a.footway ?? a.neighbourhood ?? a.suburb;
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county;
    const short = [street, city].filter(Boolean).join(', ');
    return short || data.display_name || null;
  } catch {
    return null;
  }
}

type Selection =
  | { kind: 'bike'; bike: Bike }
  | { kind: 'parking'; parking: ParkingSpot }
  | null;

type Coords = { latitude: number; longitude: number };

export default function MapScreen() {
  const [selected, setSelected] = useState<Selection>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const mapReadyRef = useRef(false);
  const lastLocationRef = useRef<Coords | null>(null);

  useEffect(() => {
    void (async () => {
      const [b, p] = await Promise.all([getBikes(), getParkingSpots()]);
      setBikes(b);
      setParkingSpots(p);
    })();
  }, []);

  const pushLocationToMap = (coords: Coords, follow: boolean) => {
    lastLocationRef.current = coords;
    if (!mapReadyRef.current) return;
    webViewRef.current?.injectJavaScript(
      `window.updateUserLocation && window.updateUserLocation(${coords.latitude}, ${coords.longitude}, ${follow}); true;`,
    );
  };

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (cancelled) return;
      pushLocationToMap(
        { latitude: initial.coords.latitude, longitude: initial.coords.longitude },
        true,
      );
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 3000 },
        (pos) => {
          pushLocationToMap(
            { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
            true,
          );
        },
      );
    })();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  const selectedCoords =
    selected?.kind === 'bike'
      ? { latitude: selected.bike.latitude, longitude: selected.bike.longitude }
      : selected?.kind === 'parking'
      ? { latitude: selected.parking.latitude, longitude: selected.parking.longitude }
      : null;

  useEffect(() => {
    if (!selectedCoords) {
      setResolvedAddress(null);
      return;
    }
    let cancelled = false;
    setResolvedAddress(null);
    void (async () => {
      const address = await reverseGeocode(selectedCoords.latitude, selectedCoords.longitude);
      if (!cancelled) setResolvedAddress(address);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCoords?.latitude, selectedCoords?.longitude]);

  const html = useMemo(() => buildHtml(bikes, parkingSpots), [bikes, parkingSpots]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'bikeSelected') {
        setSelected({ kind: 'bike', bike: payload.bike as Bike });
      } else if (payload.type === 'parkingSelected') {
        setSelected({ kind: 'parking', parking: payload.parking as ParkingSpot });
      }
    } catch {
      // ignore malformed messages
    }
  };

  const close = () => setSelected(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dostupni bicikli</Text>
      <View style={styles.mapCard}>
        <WebView
          ref={webViewRef}
          style={styles.map}
          originWhitelist={['*']}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          onLoadEnd={() => {
            mapReadyRef.current = true;
            if (lastLocationRef.current) {
              pushLocationToMap(lastLocationRef.current, true);
            }
          }}
        />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Kako koristiti mapu</Text>
        <Text style={styles.instructionsItem}>• Prevucite mapu da se krećete po Čeraku.</Text>
        <Text style={styles.instructionsItem}>• Skupite prste ili koristite +/- dugmad za uvećanje i umanjenje.</Text>
        <Text style={styles.instructionsItem}>
          • <Text style={styles.bikeDot}>●</Text> Plavi markeri su dostupni bicikli, dodirnite za detalje.
        </Text>
        <Text style={styles.instructionsItem}>
          • <Text style={styles.parkingDot}>●</Text> Narandžasti markeri su parking mesta, dodirnite da vidite kapacitet.
        </Text>
        <Text style={styles.instructionsItem}>
          • <Text style={styles.userDot}>●</Text> Plava tačka je vaša trenutna lokacija; mapa je prati.
        </Text>
        <Text style={styles.instructionsItem}>• Dodirnite Zatvori da zatvorite prozor sa detaljima.</Text>
      </View>

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {selected?.kind === 'bike' && (() => {
              const bike = selected.bike;
              const nearest = findNearestParking(bike, parkingSpots);
              return (
                <ScrollView contentContainerStyle={styles.cardScroll}>
                  <Text style={styles.cardTitle}>{bike.name}</Text>

                  <Image source={{ uri: bike.imageUrl }} style={styles.bikeImage} resizeMode="cover" />

                  <View style={[styles.statusBadge, bike.available ? styles.badgeAvailable : styles.badgeUnavailable]}>
                    <Text style={styles.statusBadgeText}>
                      {bike.available ? 'Dostupan' : 'Nedostupan'}
                    </Text>
                  </View>

                  <Row label="Adresa" value={resolvedAddress ?? 'Učitavanje adrese…'} />
                  <Row label="Cena" value={`${bike.pricePerHour} RSD / sat`} />
                  <Row
                    label="Najbliži parking"
                    value={
                      nearest
                        ? `${nearest.spot.name} (${nearest.distanceKm.toFixed(2)} km)`
                        : 'Nema dostupnih'
                    }
                  />

                  <View style={styles.actions}>
                    <Pressable
                      onPress={close}
                      style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
                      <Text style={styles.secondaryText}>Zatvori</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              );
            })()}

            {selected?.kind === 'parking' && (() => {
              const parking = selected.parking;
              const occupancy = parking.capacity - parking.available;
              const status =
                parking.available === 0
                  ? { label: 'Popunjeno', style: styles.badgeUnavailable }
                  : parking.available <= parking.capacity * 0.25
                  ? { label: 'Skoro popunjeno', style: styles.badgeWarning }
                  : { label: 'Dostupno', style: styles.badgeAvailable };
              return (
                <ScrollView contentContainerStyle={styles.cardScroll}>
                  <Text style={styles.cardTitle}>{parking.name}</Text>

                  <View style={[styles.statusBadge, status.style]}>
                    <Text style={styles.statusBadgeText}>{status.label}</Text>
                  </View>

                  <Row label="ID " value={parking.id} />
                  <Row label="Adresa " value={resolvedAddress ?? 'Učitavanje adrese…'} />
                  <Row label="Kapacitet " value={String(parking.capacity)} />
                  <Row label="Zauzeto " value={String(occupancy)} />
                  <Row label="Slobodno " value={String(parking.available)} />
                  <Row label="Radno vreme " value={parking.hours} />

                  <View style={styles.actions}>
                    <Pressable
                      onPress={close}
                      style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
                      <Text style={styles.secondaryText}>Zatvori</Text>
                    </Pressable>
                  </View>
                </ScrollView>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  mapCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00000022',
    backgroundColor: '#e5e3df',
  },
  map: { flex: 1 },
  instructions: {
    backgroundColor: '#ffffffcc',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  instructionsItem: {
    fontSize: 14,
    color: '#1f2a1a',
    lineHeight: 20,
  },
  bikeDot: { color: '#7aa6c6', fontWeight: '700' },
  parkingDot: { color: '#e08a2b', fontWeight: '700' },
  userDot: { color: '#1a73e8', fontWeight: '700' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    gap: 10,
    maxHeight: '85%',
  },
  cardScroll: {
    gap: 10,
  },
  bikeImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeAvailable: { backgroundColor: '#2e7d32' },
  badgeUnavailable: { backgroundColor: '#b00020' },
  badgeWarning: { backgroundColor: '#e08a2b' },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: { color: '#4a4a4a', fontSize: 14 },
  rowValue: { color: '#000', fontSize: 14, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#7aa6c6' },
  secondary: { backgroundColor: '#e0e0e0' },
  pressed: { opacity: 0.8 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryText: { color: '#000', fontSize: 15, fontWeight: '600' },
});
