# Handoff: Planer usadzania gości weselnych

## Overview
Interaktywne narzędzie desktopowe do układania planu sali weselnej. Użytkownik:
- wkleja/wpisuje listę gości,
- dodaje stoły **okrągłe** i **podłużne** z dowolną liczbą miejsc,
- dodaje **krzesełka dziecięce** (do karmienia) do wybranego stołu,
- przeciąga gości z listy „nieusadzonych” na konkretne krzesła (drag & drop),
- rozmieszcza stoły na planie sali (przeciąganie stołu po kanwie),
- nadaje stołom nazwy (np. „Stół Rodzice”).

Cały stan jest zapisywany lokalnie (localStorage), więc plan nie znika po odświeżeniu.

## About the Design Files
Pliki w tym pakiecie to **referencja projektowa wykonana w HTML** — prototyp pokazujący docelowy wygląd i zachowanie, **nie** kod produkcyjny do skopiowania 1:1. `Plan Sali Weselnej.dc.html` jest napisany w wewnętrznym formacie „Design Component” (wymaga własnego runtime, by się uruchomić) — traktuj go jako **czytelny opis UI i logiki**, a nie jako gotowy moduł.

Zadanie: **odtworzyć ten projekt w docelowym środowisku aplikacji** (React / Vue / Svelte itd.) zgodnie z jego istniejącymi wzorcami i bibliotekami. Jeśli projekt startuje od zera — wybierz odpowiedni framework (rekomendacja: **React + TypeScript**, bo logika jest komponentowa i stanowa) i zaimplementuj tam. Drag & drop można zrobić natywnym HTML5 DnD (jak w prototypie) lub biblioteką typu `@dnd-kit/core`.

## Fidelity
**High-fidelity (hifi).** Kolory, typografia, odstępy i interakcje są docelowe — odwzoruj UI wiernie, korzystając z tokenów design-systemu „Classical” (patrz `design-system/styles.css`). Wszystkie wartości poniżej pochodzą z tego systemu.

## Screens / Views
Aplikacja to **jeden ekran** (desktop, jednокolumnowy layout aplikacyjny). Trzy strefy:

### 1. Górny pasek (nav)
- **Layout**: pasek na całą szerokość, `display:flex`, `align-items:center`, padding `var(--space-3) var(--space-4)`, dolna hairline `1px solid var(--color-divider)`.
- **Lewa strona**: tytuł „Plan Sali Weselnej” — font nagłówkowy (Cormorant Garamond), 18px, semibold.
- **Prawa strona**: licznik statystyk 13px, wyszarzony (`--color-text` @ 55%): „Usadzeni: N / M” oraz „Nieusadzeni: K”. Liczby pogrubione, pełny kolor tekstu.

### 2. Panel boczny — lista gości (lewa kolumna)
- **Layout**: szerokość stała **308px**, prawa krawędź `1px solid var(--color-divider)`, padding `var(--space-4)`, `display:flex; flex-direction:column; gap:var(--space-3)`, `overflow:auto`.
- **Sekcja „Lista gości”**: nagłówek h4; pole `<textarea>` (klasa `.input`, `min-height:120px`) z placeholderem „Anna Kowalska / Jan Nowak / …”; pod nim przycisk **„Dodaj gości”** (`.btn .btn-primary .btn-block`).
  - Parsowanie: tekst dzielony po znakach nowej linii, przecinkach i średnikach (`/[\n,;]+/`), `trim()`, puste odrzucone; każdy niepusty wpis → nowy gość „nieusadzony”. Po dodaniu textarea się czyści.
- **Hairline** `.hr`.
- **Sekcja „Nieusadzeni”**: nagłówek h4 + tag z liczbą (`.tag .tag-neutral`). Krótki opis 12px. Poniżej **strefa upuszczania**: `min-height:120px`, `flex-wrap`, `gap:var(--space-2)`, ramka `1.5px dashed var(--color-divider)`, radius `--radius-md`.
  - Każdy nieusadzony gość to **chip**: pill (`border-radius:999px`), `background:var(--color-surface)`, ramka `1px solid var(--color-divider)`, padding `5px 11px`, 13px, ikona „grip” (Lucide `grip-vertical`, 12px, opacity .5) + imię. `draggable`, `cursor:grab`.
  - Upuszczenie gościa na tę strefę = **zwolnienie miejsca** (gość wraca do nieusadzonych).
  - Gdy wszyscy usadzeni: kursywą „Wszyscy goście usadzeni.”

### 3. Obszar planu sali (prawa kolumna)
- **Pasek narzędzi** (górny, `flex-wrap`, `gap:var(--space-4)`, padding `var(--space-3) var(--space-4)`, dolna hairline):
  - Grupa „okrągły”: label „Miejsca” + `<input type=number min=1 max=40>` (`.input`, szer. 70px) + przycisk **„Stół okrągły”** (`.btn .btn-secondary`, ikona Lucide `circle`).
  - Grupa „podłużny”: analogicznie, ikona prostokąt, przycisk **„Stół podłużny”**.
  - Podpowiedź z ikoną `baby` (kolor `--color-accent-2-700`): „krzesełka dziecięce dodajesz przyciskiem na stole”.
  - Po prawej: **„Wyczyść plan”** (`.btn .btn-ghost`) — `confirm()` przed wyczyszczeniem wszystkiego.
- **Kanwa** (`flex:1; position:relative; overflow:auto`): tło z kropkową siatką `radial-gradient(var(--color-divider) 1px, transparent 1px)`, `background-size:26px 26px`. Wewnętrzny obszar `min-width:1400px; min-height:1000px` (przewijalny). Gdy brak stołów — wyśrodkowany komunikat pusty.

#### Stół (element planu)
Pozycjonowany absolutnie na kanwie (`left/top` = zapisane współrzędne stołu).
- **Pasek stołu** (nad blatem, szerokość = szerokość blatu, 11px): po lewej uchwyt „przeciągnij” (ikona `grip-vertical`, `cursor:move`) — **mousedown zaczyna przeciąganie stołu**. Po prawej grupa przycisków ikonowych (26×26): **dodaj krzesełko dziecięce** (ikona `baby`, kolor `--color-accent-2-700`), **usuń ostatnie krzesełko** (ikona minus, widoczny tylko gdy są krzesełka), **usuń stół** (ikona `trash-2`).
- **Blat**: `background:var(--color-surface)`, ramka `1px solid var(--color-divider)`, `box-shadow:var(--shadow-sm)`.
  - Okrągły: koło (`border-radius:50%`), średnica `2 * max(52, 20 + seats*5)` px.
  - Podłużny: prostokąt `border-radius:6px`, wysokość 104px, szerokość `max(topRow,botRow) * 64` px.
  - Na blacie wyśrodkowana nazwa stołu (Cormorant, 16px, semibold) + (opcjonalnie) licznik „N / M miejsc” (11px, tabular-nums). Klik nazwy → edycja inline (`<input>`; Enter lub blur zatwierdza).

#### Krzesła (miejsca)
- Zwykłe krzesło: kółko **56×56px**, pozycjonowane absolutnie wokół blatu.
  - **Puste**: `background:var(--color-bg)`, ramka `1.5px dashed var(--color-divider)`, w środku numer miejsca (12px, tabular-nums), kolor `--color-neutral-500`.
  - **Zajęte**: `background:var(--color-accent-100)`, ramka `1px solid var(--color-accent-400)`, kolor `--color-accent-900`, imię gościa (10.5px, `line-height:1.12`, 2-liniowy clamp), `cursor:grab`, `draggable`.
  - Rozmieszczenie przy stole okrągłym: równomiernie na okręgu o promieniu `promieńBlatu + 42`, start od góry (-90°).
  - Przy stole podłużnym: dwa rzędy (góra/dół), `ceil(n/2)` na górze, reszta na dole, równomiernie na szerokości blatu, `64px` na slot.
- **Krzesełko dziecięce (high-chair)**: kółko **46×46px**, w rzędzie **pod** stołem, wyśrodkowane, `58px` na slot.
  - **Puste**: `background:var(--color-accent-2-100)`, ramka `1.5px dashed var(--color-accent-2-400)`, w środku ikona Lucide `baby` (20px, kolor `--color-accent-2-700`).
  - **Zajęte**: `background:var(--color-accent-2-100)`, ramka `1px solid var(--color-accent-2-500)`, kolor `--color-accent-2-900`, imię (9.5px). Krzesełka odróżnia od zwykłych krzeseł drugi (cieplejszy) odcień akcentu.

## Interactions & Behavior
- **Dodanie stołu**: przycisk czyta liczbę miejsc z pola obok i tworzy stół z tą liczbą krzeseł. Nowe stoły są kładzione po skosie, by się nie nakładały (`x = 40 + (n%5)*90`, `y = 40 + (n%4)*70`).
- **Przeciąganie stołu**: `mousedown` na pasku stołu → zapamiętanie offsetu kursora względem stołu; `mousemove` (na `window`) aktualizuje `x/y` stołu (uwzględniając scroll kanwy); `mouseup` kończy. Współrzędne clampowane do `>=0`. Opcja *snap to grid* zaokrągla do 26px.
- **Przypisanie gościa (drag & drop)**: chip/krzesło ustawia `dataTransfer` = id gościa (`effectAllowed:'move'`). Krzesło jest celem upuszczenia (`onDragOver` → `preventDefault`, `onDrop` → przypisanie).
  - Upuszczenie na **zajęte** krzesło = **zamiana miejscami** (dotychczasowy gość trafia na stare miejsce przeciąganego; jeśli przeciągany był nieusadzony — dotychczasowy wraca do nieusadzonych).
- **Zwolnienie miejsca**: klik zajętego krzesła **lub** upuszczenie gościa na strefę „nieusadzeni”.
- **Krzesełko dziecięce**: przycisk `baby` na stole dodaje jedno krzesełko; przycisk minus usuwa ostatnie (jeśli było zajęte — gość wraca do nieusadzonych). Krzesełka mają indeksy miejsc od 1000 w górę, by nie kolidować ze zwykłymi.
- **Edycja nazwy stołu**: klik nazwy → inline input; Enter/blur zatwierdza.
- **Usunięcie stołu**: goście z tego stołu wracają do nieusadzonych.
- **Wyczyść plan**: `confirm()`, potem reset stołów, gości i pola tekstowego.
- **Stany fokusu/hover**: z design-systemu (outline akcentowy `:focus-visible`, tinty hover z rampy akcentu).

## State Management
Stan komponentu (odpowiednik `useState`/store):
- `tables: { id, name, shape:'round'|'rect', seats:number, highChairs:number, x:number, y:number }[]`
- `guests: { id, name, tableId:string|null, seatIndex:number|null }[]` — `tableId===null` ⇒ nieusadzony; `seatIndex >= 1000` ⇒ krzesełko dziecięce (`index = 1000 + kolejność`).
- `guestText: string` — zawartość textarea.
- `roundSeats: number` / `rectSeats: number` — domyślna liczba miejsc dla nowego stołu (1–40).
- `editingId: string|null` — stół w trybie edycji nazwy.
- Efemeryczne (nie w stanie renderu): `drag` (trwające przeciąganie stołu: `{id,dx,dy}`), `dragGid` (id przeciąganego gościa), `canvasEl` (ref kanwy).

**Persistencja**: cały slice `{tables, guests, guestText, roundSeats, rectSeats}` zapisywany do `localStorage` pod kluczem `wedding-seating-v1` przy każdej zmianie; wczytywany raz przy montowaniu.

**Wyliczane przy renderze**: geometria stołu (pozycje krzeseł) z `shape` i `seats`; mapa `"{tableId}:{seatIndex}" → gość`; liczniki usadzonych/nieusadzonych. `seats` należy clampować do zakresu `1..60` przed liczeniem geometrii (ochrona przed uszkodzonym stanem).

## Design Tokens (system „Classical”)
Pełne w `design-system/styles.css` (`:root`). Najważniejsze:
- **Kolory**: `--color-bg #f3f2f2`, `--color-surface #eae9e9`, `--color-text #201f1d`, akcent `--color-accent #b68235`, dzielnik `--color-divider` (= tekst @ 16%).
- **Rampa akcentu**: `--color-accent-100 #fff3e4` … `-400 #e1ad66`, `-500 #c28d41`, `-900 #3a270d` (zwykłe krzesła używają 100/400/900).
- **Drugi akcent (krzesełka dziecięce)**: `--color-accent-2-100 #fff3e4`, `-400 #dbaf70`, `-500 #bc8f4e`, `-700 #79561f`, `-900 #382810`.
- **Neutralne**: `--color-neutral-100 #f8f4f4` … `-500 #9b9797` … `-900 #2d2b2b`.
- **Typografia**: nagłówki `--font-heading` „Cormorant Garamond” (semibold 600), tekst `--font-body` „Lora”. Rozmiary z systemu (h4 20px, body 15px). Liczby tabularne tam, gdzie są danymi.
- **Odstępy**: `--space-1 4.6px … --space-8 36.8px` (skala 1.15×).
- **Radius**: `--radius-sm 2 / -md 4 / -lg 7 px`. Krzesła i chipy są okrągłe (50% / 999px).
- **Cienie**: `--shadow-sm/md/lg` (delikatne).
- **Rozmiary funkcjonalne**: krzesło 56px, krzesełko dziecięce 46px, panel boczny 308px, siatka kanwy 26px, cel dotknięcia ≥ 44px zachowany.

## Assets
- **Ikony**: Lucide (https://lucide.dev) jako inline SVG na `currentColor` — użyte: `grip-vertical`, `circle`, prostokąt (square), `trash-2`, `baby`, minus. W docelowym kodzie użyj biblioteki ikon Lucide (lub odpowiednika w waszym systemie).
- **Fonty**: Google Fonts — Cormorant Garamond, Lora (import na górze `design-system/styles.css`).
- Brak obrazów rastrowych.

## Files
- `Plan Sali Weselnej.dc.html` — prototyp (referencja UI + logiki). Sekcja szablonu = struktura/markup; klasa `Component` = stan i handlery (`renderVals()` zwraca dane i funkcje dla szablonu).
- `design-system/styles.css` — tokeny i klasy komponentów systemu „Classical” (źródło prawdy dla kolorów/typografii/odstępów).
- `design-system/readme.md` — opis systemu „Classical”.
