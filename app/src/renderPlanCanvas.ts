import { geomFor, rotateGeom, HALF, CHILD, HC_BASE } from './geometry'
import type { Guest, Table } from './types'

// Kolory z design-systemu „Classical" (patrz styles.css) — na sztywno, bo
// rysujemy na canvasie poza drzewem DOM.
const C = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201f1d',
  divider: 'rgba(32,31,29,0.16)',
  neutral500: '#9b9797',
  neutral600: '#7d7979',
  a100: '#fff3e4',
  a400: '#e1ad66',
  a900: '#3a270d',
  a2100: '#fff3e4',
  a2400: '#dbaf70',
  a2500: '#bc8f4e',
  a2700: '#79561f',
  a2900: '#382810',
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Zawija imię do maks. dwóch linii mieszczących się w danej szerokości. */
function wrapTwoLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text]
  const words = text.split(' ')
  if (words.length === 1) return [text]
  let line1 = ''
  let i = 0
  for (; i < words.length; i++) {
    const test = line1 ? line1 + ' ' + words[i] : words[i]
    if (ctx.measureText(test).width > maxWidth && line1) break
    line1 = test
  }
  const line2 = words.slice(i).join(' ')
  return line2 ? [line1, line2] : [line1]
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], cx: number, cy: number, lh: number) {
  const startY = cy - ((lines.length - 1) * lh) / 2
  lines.forEach((ln, k) => ctx.fillText(ln, cx, startY + k * lh))
}

function drawSeat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  g: Guest | undefined,
  seatLabel: number,
  isChild: boolean,
) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  if (g) {
    ctx.setLineDash([])
    ctx.lineWidth = 1
    ctx.fillStyle = isChild ? C.a2100 : C.a100
    ctx.strokeStyle = isChild ? C.a2500 : C.a400
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = isChild ? C.a2900 : C.a900
    ctx.font = `${isChild ? 9.5 : 10.5}px "Lora", Georgia, serif`
    const lines = wrapTwoLines(ctx, g.name, r * 2 - 8)
    drawLines(ctx, lines, cx, cy, isChild ? 10 : 11)
  } else {
    ctx.setLineDash([4, 3])
    ctx.lineWidth = 1.5
    ctx.fillStyle = isChild ? C.a2100 : C.bg
    ctx.strokeStyle = isChild ? C.a2400 : C.divider
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])
    if (!isChild) {
      ctx.fillStyle = C.neutral500
      ctx.font = '12px "Lora", Georgia, serif'
      ctx.fillText(String(seatLabel + 1), cx, cy)
    } else {
      // Puste krzesełko dziecięce — mała kropka zamiast ikony baby.
      ctx.fillStyle = C.a2700
      ctx.beginPath()
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/**
 * Rysuje cały plan sali na canvasie (blaty, krzesła, krzesełka dziecięce,
 * nazwy i liczniki), przycięty do obrysu stołów. Deterministyczne, bez
 * rasteryzacji DOM — używane do eksportu PDF. Zwraca null gdy brak stołów.
 */
export function renderPlanCanvas(tables: Table[], guests: Guest[], scale = 3): HTMLCanvasElement | null {
  if (!tables.length) return null

  const byKey = new Map<string, Guest>()
  guests.forEach((g) => {
    if (g.tableId != null) byKey.set(g.tableId + ':' + g.seatIndex, g)
  })

  const layouts = tables.map((t) => {
    const geom = rotateGeom(geomFor(t.shape, t.seats), t.rotation ?? 0)
    const hc = t.highChairs || 0
    const hcSeats: { index: number; left: number; top: number }[] = []
    let areaH = geom.height
    if (hc > 0) {
      const rowTop = geom.height + 12
      const totalW = hc * 58
      const startX = geom.width / 2 - totalW / 2 + (58 - CHILD) / 2
      for (let j = 0; j < hc; j++) hcSeats.push({ index: HC_BASE + j, left: startX + j * 58, top: rowTop })
      areaH = rowTop + CHILD + 6
    }
    return { t, geom, hcSeats, areaH }
  })

  const pad = 36
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  layouts.forEach(({ t, geom, areaH }) => {
    minX = Math.min(minX, t.x)
    minY = Math.min(minY, t.y)
    maxX = Math.max(maxX, t.x + geom.width)
    maxY = Math.max(maxY, t.y + areaH)
  })
  const W = maxX - minX + pad * 2
  const H = maxY - minY + pad * 2

  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(W * scale)
  canvas.height = Math.ceil(H * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(scale, scale)
  ctx.translate(pad - minX, pad - minY)
  ctx.fillStyle = C.bg
  ctx.fillRect(minX - pad, minY - pad, W, H)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'

  layouts.forEach(({ t, geom, hcSeats }) => {
    const ox = t.x
    const oy = t.y
    const tb = geom.table

    // Blat
    ctx.setLineDash([])
    ctx.lineWidth = 1
    ctx.fillStyle = C.surface
    ctx.strokeStyle = C.divider
    if (tb.borderRadius === '50%') {
      const r = tb.width / 2
      ctx.beginPath()
      ctx.arc(ox + tb.left + r, oy + tb.top + r, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else {
      roundRect(ctx, ox + tb.left, oy + tb.top, tb.width, tb.height, Number(tb.borderRadius) || 6)
      ctx.fill()
      ctx.stroke()
    }

    // Nazwa + licznik na blacie
    const cx = ox + tb.left + tb.width / 2
    const cy = oy + tb.top + tb.height / 2
    const cnt = guests.filter((g) => g.tableId === t.id).length
    ctx.fillStyle = C.text
    ctx.font = '600 16px "Cormorant Garamond", Georgia, serif'
    ctx.fillText(t.name, cx, cy - 7)
    ctx.fillStyle = C.neutral600
    ctx.font = '11px "Lora", Georgia, serif'
    ctx.fillText(`${cnt} / ${t.seats} miejsc`, cx, cy + 9)

    // Krzesła
    geom.seats.forEach((s, i) => {
      drawSeat(ctx, ox + s.left + HALF, oy + s.top + HALF, HALF, byKey.get(t.id + ':' + i), i, false)
    })
    // Krzesełka dziecięce
    hcSeats.forEach((hs) => {
      drawSeat(ctx, ox + hs.left + CHILD / 2, oy + hs.top + CHILD / 2, CHILD / 2, byKey.get(t.id + ':' + hs.index), hs.index, true)
    })
  })

  return canvas
}
