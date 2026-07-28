/**
 * Turns a product render that sits on a solid black plate into a true alpha
 * cutout, so the hero can composite it normally (no `mix-blend-screen` hack and
 * no rectangular plate edge behind the product).
 *
 * Strategy:
 *  1. Flood fill the near-black background inward from the image border. Only
 *     background connected to the border is removed, so the product's own deep
 *     blacks stay fully opaque.
 *  2. Feather the resulting mask with a small box blur so edges stay soft.
 *
 * Usage: node scripts/make-product-cutout.mjs <input.png> <output.png>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const [input, output] = process.argv.slice(2)
if (!input || !output) {
  console.error('usage: node scripts/make-product-cutout.mjs <input.png> <output.png>')
  process.exit(1)
}

const png = PNG.sync.read(readFileSync(input))
const { width: w, height: h, data } = png
const luma = new Float32Array(w * h)
for (let i = 0; i < w * h; i++) {
  const o = i * 4
  luma[i] = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]
}

/* 1 ── flood fill the plate from every border pixel */
const BG_MAX = 6 // plate luma is ~1; product edges climb well above this
const bg = new Uint8Array(w * h)
const stack = []
const push = (x, y) => {
  if (x < 0 || y < 0 || x >= w || y >= h) return
  const i = y * w + x
  if (bg[i] || luma[i] > BG_MAX) return
  bg[i] = 1
  stack.push(i)
}
for (let x = 0; x < w; x++) {
  push(x, 0)
  push(x, h - 1)
}
for (let y = 0; y < h; y++) {
  push(0, y)
  push(w - 1, y)
}
while (stack.length) {
  const i = stack.pop()
  const x = i % w
  const y = (i - x) / w
  push(x + 1, y)
  push(x - 1, y)
  push(x, y + 1)
  push(x, y - 1)
}

/* 2 ── feather the mask (box blur) so the silhouette edge is not aliased */
const alpha = new Float32Array(w * h)
for (let i = 0; i < w * h; i++) alpha[i] = bg[i] ? 0 : 255
const RADIUS = 2
const blurred = new Float32Array(w * h)
const tmp = new Float32Array(w * h)
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    let sum = 0
    let n = 0
    for (let k = -RADIUS; k <= RADIUS; k++) {
      const xx = x + k
      if (xx < 0 || xx >= w) continue
      sum += alpha[y * w + xx]
      n++
    }
    tmp[y * w + x] = sum / n
  }
}
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    let sum = 0
    let n = 0
    for (let k = -RADIUS; k <= RADIUS; k++) {
      const yy = y + k
      if (yy < 0 || yy >= h) continue
      sum += tmp[yy * w + x]
      n++
    }
    blurred[y * w + x] = sum / n
  }
}

let opaque = 0
for (let i = 0; i < w * h; i++) {
  const a = Math.round(Math.min(255, Math.max(0, blurred[i])))
  data[i * 4 + 3] = a
  if (a > 8) opaque++
}

writeFileSync(output, PNG.sync.write(png))
console.log(
  `[v0] wrote ${output} — ${w}x${h}, ${((opaque / (w * h)) * 100).toFixed(1)}% of pixels kept`,
)
