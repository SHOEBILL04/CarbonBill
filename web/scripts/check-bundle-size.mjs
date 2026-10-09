import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const distAssetsDir = path.resolve('dist/assets');
const MAX_FLOOR_CHUNK_GZIP_KB = 200;

console.log('--- Checking CarbonBill Floor Route Bundle Size Budget ---');

if (!fs.existsSync(distAssetsDir)) {
  console.error(`Error: Directory ${distAssetsDir} does not exist. Run "npm run build" first.`);
  process.exit(1);
}

const files = fs.readdirSync(distAssetsDir);
const floorFile = files.find((f) => f.startsWith('floor-') && f.endsWith('.js'));

if (!floorFile) {
  console.error('Error: Could not locate floor route chunk (floor-*.js) in dist/assets.');
  console.log('Available files:', files);
  process.exit(1);
}

const filePath = path.join(distAssetsDir, floorFile);
const rawBuffer = fs.readFileSync(filePath);
const gzippedBuffer = zlib.gzipSync(rawBuffer);

const rawSizeKb = (rawBuffer.length / 1024).toFixed(2);
const gzipSizeKb = (gzippedBuffer.length / 1024).toFixed(2);

console.log(`Floor route file: ${floorFile}`);
console.log(`Raw size:         ${rawSizeKb} KB`);
console.log(`Gzipped size:     ${gzipSizeKb} KB`);
console.log(`Budget limit:     ${MAX_FLOOR_CHUNK_GZIP_KB} KB gzipped`);

if (gzippedBuffer.length / 1024 > MAX_FLOOR_CHUNK_GZIP_KB) {
  console.error(`FAILED: Floor route exceeds ${MAX_FLOOR_CHUNK_GZIP_KB} KB budget!`);
  process.exit(1);
} else {
  console.log(`PASSED: Floor route is well within budget (${gzipSizeKb} KB <= ${MAX_FLOOR_CHUNK_GZIP_KB} KB).`);
  process.exit(0);
}
