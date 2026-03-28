import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/icons')

// Icon concept:
// - Deep red rounded square background with subtle gradient
// - Bold white speech bubble (chat comment)
// - Three decreasing filter bars inside (funnel/filter symbol)
// Clean, modern, reads well at all sizes.

function makeSvg(size) {
  const s = size           // canvas size
  const r = size * 0.18   // corner radius of background
  const pad = size * 0.12 // padding around content

  // Bubble occupies ~78% of canvas
  const bx = pad
  const by = pad
  const bw = s - pad * 2
  const bh = (s - pad * 2) * 0.76
  const br = bh * 0.16      // bubble corner radius
  const tailW = bw * 0.22
  const tailH = s - pad - by - bh  // tail height fills remaining space
  const tailX = bx + bw * 0.15     // tail starts at 15% from left

  // Filter bars (3) inside bubble
  const barH = bh * 0.13
  const barR = barH / 2
  const barMargin = bh * 0.15  // top margin inside bubble
  const barGap = bh * 0.165    // gap between bars
  const barMaxW = bw * 0.66
  const barX = bx + (bw - barMaxW) / 2
  const bar1Y = by + barMargin
  const bar2Y = bar1Y + barH + barGap
  const bar3Y = bar2Y + barH + barGap

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF2020"/>
      <stop offset="100%" stop-color="#C00000"/>
    </linearGradient>
    <linearGradient id="bar1" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FF6060"/>
      <stop offset="100%" stop-color="#FF9090"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="${s}" height="${s}" rx="${r}" fill="url(#bg)"/>

  <!-- Speech bubble body -->
  <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${br}" fill="white"/>

  <!-- Speech bubble tail (triangle, bottom-left) -->
  <polygon points="${tailX},${by + bh} ${tailX + tailW},${by + bh} ${tailX},${by + bh + tailH}" fill="white"/>

  <!-- Filter bar 1 (widest) -->
  <rect x="${barX}" y="${bar1Y}" width="${barMaxW}" height="${barH}" rx="${barR}" fill="url(#bg)"/>
  <!-- Filter bar 2 (medium) -->
  <rect x="${barX + barMaxW * 0.13}" y="${bar2Y}" width="${barMaxW * 0.74}" height="${barH}" rx="${barR}" fill="#CC1010" opacity="0.85"/>
  <!-- Filter bar 3 (narrowest) -->
  <rect x="${barX + barMaxW * 0.28}" y="${bar3Y}" width="${barMaxW * 0.44}" height="${barH}" rx="${barR}" fill="#BB0E0E" opacity="0.7"/>
</svg>`
}

const sizes = [16, 48, 128]

for (const size of sizes) {
  const svg = makeSvg(size)
  const buf = Buffer.from(svg)
  const out = `${OUT}/icon${size}.png`
  await sharp(buf).png().toFile(out)
  console.log(`✓ icon${size}.png`)
}

console.log('Icons generated.')
