import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Bike = {
  id: string;
  name: string;
  battery: number;
  location: string;
  address: string;
  imageUrl: string;
  pricePerHour: number;
  available: boolean;
  latitude: number;
  longitude: number;
};

type ParkingSpot = {
  id: string;
  name: string;
  address: string;
  capacity: number;
  available: number;
  hours: string;
  latitude: number;
  longitude: number;
};

const BIKE_IMAGE =
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop';

const BIKES: Bike[] = [
  {
    id: 'BK-001',
    name: 'Cerak 1',
    battery: 92,
    location: 'Cerak Vinogradi',
    address: 'Ulica Cerska 12, Cerak Vinogradi',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 150,
    available: true,
    latitude: 44.7681,
    longitude: 20.4149,
  },
  {
    id: 'BK-002',
    name: 'Cerak 2',
    battery: 65,
    location: 'OŠ Vladislav Ribnikar',
    address: 'Trg Slavija bb, Cerak',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 120,
    available: false,
    latitude: 44.7655,
    longitude: 20.4192,
  },
  {
    id: 'BK-003',
    name: 'Cerak 3',
    battery: 80,
    location: 'Cerak Park',
    address: 'Park Cerak, ulaz 2',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 180,
    available: true,
    latitude: 44.7702,
    longitude: 20.4205,
  },
  {
    id: 'BK-004',
    name: 'Cerak 4',
    battery: 45,
    location: 'Ibarska magistrala',
    address: 'Ibarska magistrala 34',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 100,
    available: true,
    latitude: 44.7638,
    longitude: 20.4118,
  },
  {
    id: 'BK-005',
    name: 'Cerak 5',
    battery: 100,
    location: 'Cerak Market',
    address: 'Pijaca Cerak, ulaz A',
    imageUrl: BIKE_IMAGE,
    pricePerHour: 150,
    available: true,
    latitude: 44.7690,
    longitude: 20.4098,
  },
];

const PARKING_SPOTS: ParkingSpot[] = [
  {
    id: 'PK-01',
    name: 'Cerak Vinogradi Parking',
    address: 'Ulica Cerska 20, Cerak Vinogradi',
    capacity: 20,
    available: 7,
    hours: '00:00 – 24:00',
    latitude: 44.7695,
    longitude: 20.4165,
  },
  {
    id: 'PK-02',
    name: 'Cerak Center Parking',
    address: 'Trg Cerak 3',
    capacity: 15,
    available: 3,
    hours: '06:00 – 22:00',
    latitude: 44.7660,
    longitude: 20.4130,
  },
  {
    id: 'PK-03',
    name: 'Cerak Park Parking',
    address: 'Park Cerak, ulaz 1',
    capacity: 10,
    available: 10,
    hours: '00:00 – 24:00',
    latitude: 44.7715,
    longitude: 20.4220,
  },
];

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

function findNearestParking(bike: Bike): { spot: ParkingSpot; distanceKm: number } | null {
  if (PARKING_SPOTS.length === 0) return null;
  let best = { spot: PARKING_SPOTS[0], distanceKm: distanceKm(bike, PARKING_SPOTS[0]) };
  for (let i = 1; i < PARKING_SPOTS.length; i++) {
    const d = distanceKm(bike, PARKING_SPOTS[i]);
    if (d < best.distanceKm) best = { spot: PARKING_SPOTS[i], distanceKm: d };
  }
  return best;
}

type Selection =
  | { kind: 'bike'; bike: Bike }
  | { kind: 'parking'; parking: ParkingSpot }
  | null;

export default function MapScreen() {
  const [selected, setSelected] = useState<Selection>(null);
  const html = useMemo(() => buildHtml(BIKES, PARKING_SPOTS), []);

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
      <Text style={styles.title}>Available bikes</Text>
      <View style={styles.mapCard}>
        <WebView
          style={styles.map}
          originWhitelist={['*']}
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
        />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to use the map</Text>
        <Text style={styles.instructionsItem}>• Drag the map to move around Cerak.</Text>
        <Text style={styles.instructionsItem}>• Pinch or use the +/- buttons to zoom in and out.</Text>
        <Text style={styles.instructionsItem}>
          • <Text style={styles.bikeDot}>●</Text> Blue pins are available bikes — tap for details.
        </Text>
        <Text style={styles.instructionsItem}>
          • <Text style={styles.parkingDot}>●</Text> Orange pins are parking spots — tap to see capacity.
        </Text>
        <Text style={styles.instructionsItem}>• Tap Close to dismiss the details popup.</Text>
      </View>

      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            {selected?.kind === 'bike' && (() => {
              const bike = selected.bike;
              const nearest = findNearestParking(bike);
              return (
                <ScrollView contentContainerStyle={styles.cardScroll}>
                  <Text style={styles.cardTitle}>{bike.name}</Text>

                  <Image source={{ uri: bike.imageUrl }} style={styles.bikeImage} resizeMode="cover" />

                  <View style={[styles.statusBadge, bike.available ? styles.badgeAvailable : styles.badgeUnavailable]}>
                    <Text style={styles.statusBadgeText}>
                      {bike.available ? 'Available' : 'Not available'}
                    </Text>
                  </View>

                  <Row label="Address" value={bike.address} />
                  <Row label="Price" value={`${bike.pricePerHour} RSD / hour`} />
                  <Row
                    label="Nearest parking"
                    value={
                      nearest
                        ? `${nearest.spot.name} (${nearest.distanceKm.toFixed(2)} km)`
                        : 'None available'
                    }
                  />

                  <View style={styles.actions}>
                    <Pressable
                      onPress={close}
                      style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
                      <Text style={styles.secondaryText}>Close</Text>
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
                  ? { label: 'Full', style: styles.badgeUnavailable }
                  : parking.available <= parking.capacity * 0.25
                  ? { label: 'Almost full', style: styles.badgeWarning }
                  : { label: 'Available', style: styles.badgeAvailable };
              return (
                <ScrollView contentContainerStyle={styles.cardScroll}>
                  <Text style={styles.cardTitle}>{parking.name}</Text>

                  <View style={[styles.statusBadge, status.style]}>
                    <Text style={styles.statusBadgeText}>{status.label}</Text>
                  </View>

                  <Row label="ID" value={parking.id} />
                  <Row label="Address" value={parking.address} />
                  <Row label="Capacity" value={String(parking.capacity)} />
                  <Row label="Occupied" value={String(occupancy)} />
                  <Row label="Available" value={String(parking.available)} />
                  <Row label="Hours" value={parking.hours} />

                  <View style={styles.actions}>
                    <Pressable
                      onPress={close}
                      style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
                      <Text style={styles.secondaryText}>Close</Text>
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
    height: 400,
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
