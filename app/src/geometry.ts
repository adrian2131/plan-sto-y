import type { TableShape } from './types'

// Rozmiary funkcjonalne (px) — z README / prototypu.
export const SEAT = 56
export const HALF = 28
export const CHILD = 46
export const HC_BASE = 1000

export interface SeatPos {
  left: number
  top: number
}

export interface TablePlate {
  left: number
  top: number
  width: number
  height: number
  borderRadius: string | number
}

export interface Geometry {
  width: number
  height: number
  table: TablePlate
  seats: SeatPos[]
}

/** seats clampowane do 1..80 przed liczeniem geometrii (ochrona przed uszkodzonym stanem). */
function clampSeats(n: number): number {
  return Math.max(1, Math.min(80, parseInt(String(n), 10) || 1))
}

export function roundGeom(nRaw: number): Geometry {
  const n = clampSeats(nRaw)
  const tableR = Math.max(52, 20 + n * 5)
  const ring = tableR + 42
  const size = (ring + HALF + 6) * 2
  const c = size / 2
  const seats: SeatPos[] = []
  for (let i = 0; i < n; i++) {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180
    seats.push({ left: c + ring * Math.cos(a) - HALF, top: c + ring * Math.sin(a) - HALF })
  }
  return {
    width: size,
    height: size,
    table: { left: c - tableR, top: c - tableR, width: tableR * 2, height: tableR * 2, borderRadius: '50%' },
    seats,
  }
}

export function rectGeom(nRaw: number): Geometry {
  const n = clampSeats(nRaw)
  const slot = 64
  const topN = Math.ceil(n / 2)
  const botN = n - topN
  const cols = Math.max(topN, botN, 1)
  const tableW = cols * slot
  const tableH = 104
  const padY = SEAT + 14
  const width = tableW
  const height = tableH + padY * 2
  const tableTop = padY
  const seats: SeatPos[] = []
  const place = (k: number, rowTop: number) => {
    for (let i = 0; i < k; i++) {
      const cx = (tableW / k) * (i + 0.5)
      seats.push({ left: cx - HALF, top: rowTop })
    }
  }
  place(topN, tableTop - SEAT - 6)
  place(botN, tableTop + tableH + 6)
  return {
    width,
    height,
    table: { left: 0, top: tableTop, width: tableW, height: tableH, borderRadius: 6 },
    seats,
  }
}

export function geomFor(shape: TableShape, seats: number): Geometry {
  return shape === 'round' ? roundGeom(seats) : rectGeom(seats)
}
