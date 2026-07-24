# Planer usadzania gości weselnych

Interaktywny planer sali weselnej — React + TypeScript (Vite). Odwzorowuje projekt
z `design_handoff_wedding_seating/` (design-system „Classical”, fonty Cormorant
Garamond / Lora, ikony `lucide-react`).

## Uruchomienie

```bash
npm install
npm run dev
```

Aplikacja startuje na http://localhost:5173.

```bash
npm run build    # typecheck (tsc -b) + build produkcyjny
npm run preview  # podgląd builda
```

## Funkcje

- **Lista gości** — wklej imiona (dzielenie po nowej linii, przecinku, średniku);
  każdy wpis trafia do „nieusadzonych” jako przeciągalny chip.
- **Stoły** — okrągłe i podłużne z liczbą miejsc 1–40; krzesła rozmieszczane
  automatycznie wokół blatu (okrąg / dwa rzędy).
- **Krzesełka dziecięce** — przycisk `baby` na stole dodaje krzesełko (cieplejszy
  odcień akcentu, mniejsze kółko, ikona `baby`); minus usuwa ostatnie.
- **Drag & drop** — przeciąganie gości na krzesła (natywny HTML5 DnD); upuszczenie
  na zajęte krzesło = zamiana miejscami; klik zajętego krzesła lub upuszczenie na
  listę „nieusadzeni” = zwolnienie miejsca.
- **Układ sali** — przeciąganie stołów po kanwie (uchwyt na pasku stołu), tło z
  siatką kropek, opcjonalne przyciąganie do siatki (26px).
- **Edycja** — nazwa stołu edytowana inline (Enter / blur), usuwanie stołu (goście
  wracają do nieusadzonych), licznik usadzonych/nieusadzonych, „Wyczyść plan”
  z potwierdzeniem.
- **Persistencja** — cały stan zapisywany w `localStorage` pod kluczem
  `wedding-seating-v1`, wczytywany przy starcie.

## Struktura

```
src/
  App.tsx               stan, persistencja, przeciąganie stołów, layout
  types.ts              Table / Guest / PersistedState
  geometry.ts           geometria krzeseł (roundGeom / rectGeom)
  styles.css            tokeny design-systemu „Classical” + style aplikacji
  components/
    Sidebar.tsx         lista gości + strefa „nieusadzeni”
    Toolbar.tsx         dodawanie stołów, snap-to-grid, wyczyść plan
    TableNode.tsx       stół, krzesła i krzesełka dziecięce
```

Model stanu, geometria i tokeny odpowiadają specyfikacji w
`../design_handoff_wedding_seating/README.md`.
