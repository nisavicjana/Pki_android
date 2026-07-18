const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const bikes = [
  { id: 'BK-001', name: 'Cerak 1' },
  { id: 'BK-002', name: 'Cerak 2' },
  { id: 'BK-003', name: 'Cerak 3' },
  { id: 'BK-004', name: 'Cerak 4' },
  { id: 'BK-005', name: 'Cerak 5' },
];

const outDir = path.join(__dirname, '..', 'qr-codes');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const bike of bikes) {
    const file = path.join(outDir, `${bike.id}.png`);
    await QRCode.toFile(file, bike.id, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    console.log(`Generated ${file}  ->  encodes "${bike.id}" (${bike.name})`);
  }
})();
