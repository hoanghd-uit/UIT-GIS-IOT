import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, pixelFn) {
  // RGBA buffer with filter byte 0 at start of each scanline
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // Helper to make chunk with CRC32
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // Simple CRC32 implementation
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Precomputed CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

// Icon Drawer Helpers
const S = 64; // 64x64 pixels
const R = 28; // Outer circle radius
const CX = 32;
const CY = 32;

function dist(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy);
}

// Badge outline drawer
function baseBadge(x, y, bgR, bgG, bgB) {
  const d = dist(x, y, CX, CY);
  if (d > R) return [0, 0, 0, 0]; // Transparent outside
  if (d > R - 2) return [255, 255, 255, 255]; // White border
  if (d > R - 3.5) return [30, 41, 59, 255]; // Dark ring accent
  return [bgR, bgG, bgB, 255]; // Background
}

// 1. Water meter (Blue: 37, 99, 235)
function drawWaterMeter(x, y) {
  const [br, bg, bb, ba] = baseBadge(x, y, 37, 99, 235);
  if (ba === 0 || dist(x, y, CX, CY) > R - 3.5) return [br, bg, bb, ba];

  // Meter gauge dial (circle in center)
  const dCenter = dist(x, y, CX, CY);
  if (dCenter < 14 && dCenter > 11) return [255, 255, 255, 255]; // Outer gauge ring
  if (dCenter <= 11 && dCenter >= 8) return [15, 23, 42, 255]; // Dial face
  // Gauge needle pointing up-right
  if (x >= CX - 1 && x <= CX + 7 && y >= CY - 7 && y <= CY + 1 && Math.abs(x - CX - (CY - y)) <= 2) {
    return [239, 68, 68, 255]; // Red needle
  }
  // Droplet above gauge
  const dx = x - CX;
  const dy = y - (CY + 4);
  if (dy > 0 && dy < 10 && Math.abs(dx) <= (10 - dy) * 0.7) return [191, 219, 254, 255];

  return [br, bg, bb, ba];
}

// 2. Temperature & Humidity (Cyan: 6, 182, 212)
function drawTempHumid(x, y) {
  const [br, bg, bb, ba] = baseBadge(x, y, 6, 182, 212);
  if (ba === 0 || dist(x, y, CX, CY) > R - 3.5) return [br, bg, bb, ba];

  // Thermometer body on left (x: 22-26, y: 16-36)
  if (x >= 23 && x <= 26 && y >= 16 && y <= 35) return [255, 255, 255, 255];
  // Thermometer bulb
  if (dist(x, y, 24.5, 38) <= 5.5) return [239, 68, 68, 255];
  // Thermometer red fluid
  if (x >= 24 && x <= 25 && y >= 22 && y <= 38) return [239, 68, 68, 255];

  // Water drop on right (center 40, 30)
  const dDrop = dist(x, y, 40, 34);
  if (dDrop <= 6) return [255, 255, 255, 255];
  if (y >= 22 && y <= 34 && Math.abs(x - 40) <= (34 - y) * 0.55) return [255, 255, 255, 255];

  return [br, bg, bb, ba];
}

// 3. Smart Building (Orange: 249, 115, 22)
function drawSmartBuilding(x, y) {
  const [br, bg, bb, ba] = baseBadge(x, y, 249, 115, 22);
  if (ba === 0 || dist(x, y, CX, CY) > R - 3.5) return [br, bg, bb, ba];

  // Building 1 (left tower x: 18-28, y: 22-44)
  if (x >= 18 && x <= 28 && y >= 24 && y <= 44) {
    if (x === 18 || x === 28 || y === 24 || y === 44) return [255, 255, 255, 255];
    // Windows
    if ((x === 21 || x === 25) && (y === 28 || y === 34 || y === 40)) return [254, 240, 138, 255];
    return [30, 41, 59, 255];
  }

  // Building 2 (center tall tower x: 28-44, y: 16-44)
  if (x >= 28 && x <= 44 && y >= 16 && y <= 44) {
    if (x === 28 || x === 44 || y === 16 || y === 44) return [255, 255, 255, 255];
    // Windows
    if ((x === 32 || x === 36 || x === 40) && (y === 20 || y === 26 || y === 32 || y === 38)) {
      return [254, 240, 138, 255];
    }
    return [15, 23, 42, 255];
  }

  return [br, bg, bb, ba];
}

// 4. RF UHF Reader (Green: 34, 197, 94)
function drawRfUhf(x, y) {
  const [br, bg, bb, ba] = baseBadge(x, y, 34, 197, 94);
  if (ba === 0 || dist(x, y, CX, CY) > R - 3.5) return [br, bg, bb, ba];

  // Card shape (x: 20-40, y: 24-42)
  if (x >= 20 && x <= 40 && y >= 24 && y <= 42) {
    if (x === 20 || x === 40 || y === 24 || y === 42) return [255, 255, 255, 255];
    // Card chip
    if (x >= 24 && x <= 29 && y >= 28 && y <= 34) return [250, 204, 21, 255];
    return [15, 23, 42, 255];
  }

  // Radio signal arcs on top-right (center 38, 20)
  const dArc1 = dist(x, y, 30, 24);
  if (dArc1 >= 8 && dArc1 <= 10 && y <= 24 && x >= 30) return [255, 255, 255, 255];
  if (dArc1 >= 13 && dArc1 <= 15 && y <= 24 && x >= 30) return [255, 255, 255, 255];

  return [br, bg, bb, ba];
}

// 5. Camera (Magenta: 217, 70, 239)
function drawCamera(x, y) {
  const [br, bg, bb, ba] = baseBadge(x, y, 217, 70, 239);
  if (ba === 0 || dist(x, y, CX, CY) > R - 3.5) return [br, bg, bb, ba];

  // CCTV body tilted / box (x: 18-38, y: 22-34)
  if (x >= 18 && x <= 38 && y >= 22 && y <= 34) {
    if (x === 18 || x === 38 || y === 22 || y === 34) return [255, 255, 255, 255];
    return [15, 23, 42, 255];
  }
  // Camera lens (trapezoid on right x: 38-46, y: 20-36)
  if (x >= 38 && x <= 46) {
    const halfH = 6 + (x - 38) * 0.8;
    if (Math.abs(y - 28) <= halfH) return [255, 255, 255, 255];
  }
  // Camera mount bracket (x: 24-28, y: 34-44)
  if (x >= 24 && x <= 28 && y >= 34 && y <= 42) return [255, 255, 255, 255];
  if (x >= 20 && x <= 32 && y >= 42 && y <= 44) return [255, 255, 255, 255];

  return [br, bg, bb, ba];
}

// 6. Unknown / Fallback (Slate Grey: 100, 116, 139)
function drawUnknown(x, y) {
  const [br, bg, bb, ba] = baseBadge(x, y, 100, 116, 139);
  if (ba === 0 || dist(x, y, CX, CY) > R - 3.5) return [br, bg, bb, ba];

  // Sensor microchip square (x: 22-42, y: 22-42)
  if (x >= 24 && x <= 40 && y >= 24 && y <= 40) {
    if (x === 24 || x === 40 || y === 24 || y === 40) return [255, 255, 255, 255];
    // Center question mark or circle
    const dC = dist(x, y, CX, CY);
    if (dC <= 4) return [255, 255, 255, 255];
    return [30, 41, 59, 255];
  }
  // Chip pins
  if ((x === 28 || x === 32 || x === 36) && (y >= 20 && y <= 24 || y >= 40 && y <= 44)) return [255, 255, 255, 255];
  if ((y === 28 || y === 32 || y === 36) && (x >= 20 && x <= 24 || x >= 40 && x <= 44)) return [255, 255, 255, 255];

  return [br, bg, bb, ba];
}

// 7. Group Cluster Badge (Amber Gold: 245, 158, 11)
function drawGroup(x, y) {
  const [br, bg, bb, ba] = baseBadge(x, y, 245, 158, 11);
  if (ba === 0 || dist(x, y, CX, CY) > R - 3.5) return [br, bg, bb, ba];

  // Multiple layered circles symbol
  const d1 = dist(x, y, 26, 30);
  const d2 = dist(x, y, 38, 30);
  const d3 = dist(x, y, 32, 22);

  if (d1 <= 6 || d2 <= 6 || d3 <= 6) return [255, 255, 255, 255];
  if (d1 <= 8 || d2 <= 8 || d3 <= 8) return [30, 41, 59, 255];

  return [br, bg, bb, ba];
}

const icons = [
  { name: 'icon_water_meter', fn: drawWaterMeter, guid: 'a1000000000000000000000000000001' },
  { name: 'icon_temperature_humidity', fn: drawTempHumid, guid: 'a1000000000000000000000000000002' },
  { name: 'icon_smart_building', fn: drawSmartBuilding, guid: 'a1000000000000000000000000000003' },
  { name: 'icon_rf_uhf_reader', fn: drawRfUhf, guid: 'a1000000000000000000000000000004' },
  { name: 'icon_camera', fn: drawCamera, guid: 'a1000000000000000000000000000005' },
  { name: 'icon_unknown', fn: drawUnknown, guid: 'a1000000000000000000000000000006' },
  { name: 'icon_group', fn: drawGroup, guid: 'a1000000000000000000000000000007' },
];

const unityDest = path.resolve('UnityContent/Assets/Resources/Icons');
const webDest = path.resolve('web/public/icons');

fs.mkdirSync(unityDest, { recursive: true });
fs.mkdirSync(webDest, { recursive: true });

function generateMeta(guid) {
  return `fileFormatVersion: 2
guid: ${guid}
TextureImporter:
  fileIDToRecycleName: {}
  externalObjects: {}
  serializedVersion: 9
  mipmaps:
    enableMipMap: 0
    sRGBTexture: 1
  isReadable: 1
  textureFormat: 1
  maxTextureSize: 256
  spriteMode: 1
  spriteExtrude: 1
  spriteMeshType: 1
  alignment: 0
  spritePivot: {x: 0.5, y: 0.5}
  spritePixelsToUnits: 100
  alphaUsage: 1
  alphaIsTransparency: 1
  textureType: 8
  textureShape: 1
  spriteSheet:
    serializedVersion: 2
    sprites: []
`;
}

for (const icon of icons) {
  const pngBuf = createPng(S, S, icon.fn);

  // Write to Unity Resources
  const unityPngPath = path.join(unityDest, `${icon.name}.png`);
  const unityMetaPath = path.join(unityDest, `${icon.name}.png.meta`);
  fs.writeFileSync(unityPngPath, pngBuf);
  fs.writeFileSync(unityMetaPath, generateMeta(icon.guid));

  // Write to Web public
  const webPngPath = path.join(webDest, `${icon.name}.png`);
  fs.writeFileSync(webPngPath, pngBuf);

  console.log(`Generated: ${icon.name}.png (${pngBuf.length} bytes)`);
}

// Generate Resources directory meta if needed
const resDirMeta = path.resolve('UnityContent/Assets/Resources.meta');
if (!fs.existsSync(resDirMeta)) {
  fs.writeFileSync(resDirMeta, `fileFormatVersion: 2
guid: d2000000000000000000000000000001
folderAsset: yes
DefaultImporter:
  externalObjects: {}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`);
}

const iconsDirMeta = path.resolve('UnityContent/Assets/Resources/Icons.meta');
if (!fs.existsSync(iconsDirMeta)) {
  fs.writeFileSync(iconsDirMeta, `fileFormatVersion: 2
guid: d2000000000000000000000000000002
folderAsset: yes
DefaultImporter:
  externalObjects: {}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
`);
}

console.log('All icons generated successfully!');

