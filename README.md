# 🗒️ Sticky Board

A colourful sticky notes to-do list built with plain HTML, CSS and JavaScript. No framework, no build step. Open the page and start sticking notes up.

---

## ✨ Features

- ➕ **Add notes** with a due date, a priority and one of six pastel colours
- ✅ **Tick notes off** and see them struck through
- ✏️ **Edit or delete** any note
- 🔎 **Filter** by All, To do or Done
- 📊 **Progress bar** showing how much is finished
- ⏰ **Due date highlights** for overdue and due-today notes
- 📄 **Download PDF** of the whole list, styled like the board
- 💾 **Auto-save** in your browser, so your notes are still there next time
- 📱 **Responsive** layout that works on phones
- ⌨️ **Keyboard shortcut**: press `/` to jump to the note box

---

## 🚀 Getting started

1. Download or clone this repository.
2. Open `index.html` in any modern browser.

That is all. There is nothing to install.

> 🌐 The Google Fonts and the PDF libraries load from the internet, so you need a connection for the handwriting font and the PDF button. Without one, everything else still works with fallback fonts.

---

## 🗂️ Project structure

```
sticky-board/
├── 📄 index.html        → the page structure (what is on the screen)
├── 🎨 style.css         → colours, layout and sticky note styling
├── ⚙️ script.js         → app logic, saving and PDF export
├── 🔰 logo-icon.svg     → the logo, used as the site icon
├── 📱 manifest.webmanifest → lets phones add it to the home screen with the logo
├── 🖼️ icons/            → favicon and app icons made from the logo
└── 📖 README.md         → this file
```

---

## 🧩 Code structure explained

### 📄 `index.html` — the skeleton

| Part | What it does |
| --- | --- |
| 🧢 `<header>` | Shows today's date, the title and the progress bar |
| 📝 `<form id="composer">` | The box where you write a note, pick a date, priority and colour |
| 🎛️ `.toolbar` | The All / To do / Done filter buttons and the **Download PDF** button |
| 🧱 `<ul id="list">` | The board. JavaScript fills it with sticky notes |
| 🦶 `.foot` | The "Clear completed" button and the saving hint |
| 📦 `<script>` tags | Load html2canvas and jsPDF, then `script.js` |

### 🎨 `style.css` — the look

| Section | What it does |
| --- | --- |
| 🎯 `:root` tokens | One place for all colours and fonts: the board colour, ink colour, accent and the six note colours (`--n0` to `--n5`) |
| 🔵 `body` | The light blue page with a dotted pattern |
| 📝 `.composer` | The white card that holds the form, plus the round colour swatches |
| 🏷️ `.tab` | The pill-shaped filter buttons |
| 🟨 `.board` and `.note` | A responsive grid of notes. Each note is tilted slightly, has a tape strip (`::before`) and straightens on hover |
| 🔖 `.chip` | The small labels for due date and priority |
| 📄 `.export-root` | An off-screen copy of the board used only for making the PDF |
| 📱 `@media` | Smaller layout for phones, and reduced motion support |

### ⚙️ `script.js` — the brain

The whole app is wrapped in one function so nothing leaks into the global scope.

**🗃️ Data**

Every note is a small object:

```js
{
  id: "k3j2h1a9b",     // unique id
  text: "Pay the bill", // the note text
  done: false,          // ticked or not
  due: "2026-11-25",    // due date, or empty
  pri: "high",          // low, normal or high
  color: 2,             // 0 to 5, picks the pastel colour
  sample: false,        // true for the example notes
  created: 1763600000000
}
```

All notes live in one array, `state.tasks`.

**🔧 Functions**

| Function | Job |
| --- | --- |
| 💾 `load()` / `persist()` | Read and write the notes in `localStorage` (key `daybook.v1`) |
| 🌱 `seed()` | Creates the sample notes the first time you open the page |
| 🔍 `find(id)` | Finds a note by its id |
| 🎨 `colourOf(t)` | Gives a note its colour |
| 📅 `dueInfo(due)` | Turns a date into text like "Due today" or "Overdue" |
| 🔢 `sorted(list)` | Puts unfinished notes first, ordered by due date |
| 🧱 `el(tag, class, text)` | Small helper that creates an HTML element safely |
| 🏷️ `metaFor(t)` | Builds the due date and priority labels |
| 🟨 `buildNote(t)` | Builds one sticky note, including the edit box when editing |
| 🔄 `render()` | Redraws the counts, progress bar, filters and all notes |
| 📌 `commit()` | Saves, then redraws. Used after every change |
| ✏️ `finishEdit()` | Saves or cancels an edit |
| 📄 `buildExportNote(t)` | Builds a note for the PDF (no buttons, simple tick) |
| 🖨️ `buildPdf()` | Makes the PDF (see below) |
| 📥 `saveFile()` | Downloads the finished PDF |

**🖱️ Events**

All clicks are handled with *event delegation*: one listener on the list watches for clicks on any note's checkbox, Edit or Delete button. This keeps the code short and fast.

**🔄 How the app flows**

```
 open page
    │
    ▼
 load() from localStorage ──(empty?)──► seed() sample notes
    │
    ▼
 render()  ◄──────────────┐
    │                     │
    ▼                     │
 you click / type         │
    │                     │
    ▼                     │
 change state.tasks ──► commit() = persist() + render()
```

### 📄 How the PDF is made

1. 🧱 `buildPdf()` builds a hidden copy of the board, three notes per row.
2. 📸 **html2canvas** takes one picture of that copy.
3. ✂️ The picture is cut into the header and one image per note.
4. 📐 **jsPDF** lays the images out on A4 pages, adds the dotted background and moves to a new page when a row would not fit.
5. 🔢 Page numbers are added at the bottom.
6. 📥 `saveFile()` hands the file to the browser as a download.

---

## 🛠️ Customising

| I want to... | Change this |
| --- | --- |
| 🎨 Change the note colours | `--n0` to `--n5` in `style.css` |
| 🌈 Change the page colour | `--bg` and `--dot` in `style.css` |
| 🔤 Change the fonts | The Google Fonts link in `index.html` and `--font-hand` in `style.css` |
| ➕ Add a seventh colour | Add `--n6` and `.note.c6` in CSS, a swatch in `index.html`, and raise `COLOURS` in `script.js` |
| 📄 Show more notes per PDF row | The `3` in `buildPdf()` and `.export-grid` in `style.css` |

---

## 🧰 Built with

- 🧱 HTML5
- 🎨 CSS3 (grid, custom properties)
- ⚙️ Vanilla JavaScript
- 📸 [html2canvas](https://html2canvas.hertzen.com/) 1.4.1
- 📄 [jsPDF](https://github.com/parallax/jsPDF) 2.5.1

---

## 📜 Licence

Free to use and change. Add a licence file such as MIT if you plan to share it.
