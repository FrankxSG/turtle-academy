// Original procedural turtle artwork. No network, external images or student material.
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, bytes) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(bytes.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([name, bytes])))
  return Buffer.concat([length, name, bytes, crc])
}
function icon(size) {
  const pixels = Buffer.alloc(size * (size * 4 + 1))
  const ellipse = (x, y, cx, cy, rx, ry) => ((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size
      let rgb = [245, 213, 140]
      if (ellipse(u,v,.35,.65,.08,.1) || ellipse(u,v,.65,.65,.08,.1) || ellipse(u,v,.5,.27,.13,.13)) rgb = [53,124,90]
      if (ellipse(u,v,.5,.53,.25,.23)) rgb = [23,77,67]
      if (ellipse(u,v,.5,.52,.16,.15)) rgb = [117,163,123]
      if (ellipse(u,v,.455,.25,.015,.015) || ellipse(u,v,.545,.25,.015,.015)) rgb = [250,247,239]
      const offset = y * (size * 4 + 1) + 1 + x * 4
      pixels.set([...rgb, 255], offset)
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4)
  header[8] = 8; header[9] = 6
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',header), chunk('IDAT',deflateSync(pixels)), chunk('IEND',Buffer.alloc(0))])
}
mkdirSync('public/icons', { recursive: true })
for (const size of [192, 512]) writeFileSync('public/icons/icon-' + size + '.png', icon(size))
