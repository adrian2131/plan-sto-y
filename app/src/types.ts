export type TableShape = 'round' | 'rect'

export interface Table {
  id: string
  name: string
  shape: TableShape
  seats: number
  highChairs: number
  x: number
  y: number
}

export interface Guest {
  id: string
  name: string
  /** null ⇒ nieusadzony */
  tableId: string | null
  /** seatIndex >= 1000 ⇒ krzesełko dziecięce */
  seatIndex: number | null
}

/** Slice zapisywany w localStorage. */
export interface PersistedState {
  tables: Table[]
  guests: Guest[]
  guestText: string
  roundSeats: number
  rectSeats: number
}
