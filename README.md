# Code Space

<h1 align="center">
    Professional Code File Management for Obsidian
    <p align='center'><img src='img\Code.webp' width=80%></p> 
    <img alt="Release version" src="https://img.shields.io/github/v/release/unlinearity/Obsidian-Codespace?style=for-the-badge">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/unlinearity/Obsidian-Codespace?style=for-the-badge">
    <img alt="License" src="https://img.shields.io/github/license/unlinearity/Obsidian-Codespace?style=for-the-badge">
</h1>

<p align="center">
    <span>A comprehensive plugin for viewing, managing, and editing code files in Obsidian</span>
    <br/>
    <a href="/README.md">English</a>
    ·
    <a href="/README_CN.md">简体中文</a>
</p>

---
## About

Obsidian does not support **viewing, managing, and editing code files** by default. Code Space was created to solve this problem.

**The Three Layers of "Space":**

1. **Management Space**: Provides a unified index and management space for code files, allowing you to browse all code files via a visual dashboard.
2. **Editing Space**: Enters inside the code file, providing a professional code viewing and editing environment.
3. **Embedding Space**: Deeply integrates with Obsidian's native features, supporting reference and embedded preview of code files.


[![Star History Chart](https://api.star-history.com/svg?repos=UNLINEARITY/Obsidian-CodeSpace&type=timeline&legend=top-left)](https://www.star-history.com/#UNLINEARITY/Obsidian-CodeSpace&type=timeline&legend=top-left)
---

## Core Features

### 1. Code File Management Space
Provides a visual dashboard for unified indexing and management of code files within your vault.

- **Visual Dashboard**: An immersive management interface supporting grid layouts and file status overviews.
- **Integrated Management Tools**: The title area integrates **Settings** and **File Creation** functionality to streamline workflows.
- **Multi-dimensional Dynamic Filtering**: Supports filtering by file extension and real-time search by filename.
- **Standard File Operations**: Integrated file management functions (Rename, Move, Delete, Open in system app) natively supported by Obsidian.

<p align='center'><img src='img\pre1.png' width=95%></p> 


### 2. Professional Code Editing Space
Provides an IDE-like code viewing and editing environment.

- **Syntax Highlighting**: Powered by CodeMirror 6, providing precise highlighting for multiple programming languages.
- **Structured Navigation**: Integrated Code Outline view that automatically parses Class, Function, and Method structures with click-to-jump support.
- **Advanced Search & Replace**: Independent search panel supporting Regular Expressions, case sensitivity, whole-word matching, and global replacement.
- **Manual Save Mechanism**: Supports Ctrl+S manual saving with cursor position protection to prevent viewport jumping.
- **Basic Editing Assistance**: Supports auto-indentation, bracket matching, code folding, and line number display.
- **Interaction Optimization**: Supports Ctrl+Wheel font scaling and provides a floating search button for quick access.

<p align='center'><img src='img\pre22.png' width=95%></p> 

### 3. Obsidian Native Embedding Space

Elegantly embed and preview code in Markdown notes.

- **File References**: Link code files using `[[filename]]` syntax.
- **Code Embedding**: Embed code previews in Markdown using `![[filename]]`.
- **Quick Preview**: Hover over links to preview code content.
- **Bidirectional Sync**: Automatic detection and notification of external modifications.

<p align='center'><img src='img\pre3.png' width=95%></p> 

---
## Configuration

Access configuration via **Settings > Community Plugins > Code Space**:

- **Managed Extensions**: Specify file extensions to be managed by Code Space (comma-separated).
- **Show Line Numbers**: Toggle line number display (Default: On).
- **Max Embed Lines**: Maximum lines to display in embedded previews (Default: 30, 0 for unlimited).
- **External folders (desktop only)**: Mount external folders into the vault using a system symlink/junction.

Note: External mounts allow access to files outside the vault. Use only folders you trust.

## Supported Languages (Extensible)

| Language | Extensions |
|----------|------------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs` |
| Web Technologies | `.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less` |
| Systems Programming | `.rs`, `.go` |
| Data | `.sql`, `.json`, `.yaml`, `.yml`, `.xml` |
| Scripting | `.php`, `.rb`, `.sh` |

**More languages can be added via plugin settings. The plugin supports management of files with any extension!**
- If it is a code file, it will be opened through the Code Space editor interface.
- If it is a binary file (e.g., images or PDF), it will be opened using Obsidian's native viewer. You can even use it to manage attachments like PDFs.

<p align='center'><img src='img\pre4.png' width=95%></p> 



## Supported Keyboard Shortcuts

### Plugin Commands

<p align='center'><img src='img\pre5.png' width=95%></p> 

| Command Path | Function |
|-------------|----------|
| `Ctrl+P` → "Open code dashboard" | Open code management panel |
| `Ctrl+P` → "Create code file" | Create new code file |
| `Ctrl+P` → "Reload code space plugin" | Reload plugin |
| `Ctrl+P` → "Toggle code outline" | Toggle code outline view (Default: On) |
| `Ctrl+P` → "Search and replace" | Search and replace in code interface |

---

### Basic Operations

| Shortcut | Function |
|--------|------|
| `Ctrl+S` | Manually save file |
| `Ctrl+Mouse Wheel` | Adjust font size |
| `Ctrl+C` | Copy selection |
| `Ctrl+X` | Cut selection |
| `Ctrl+V` | Paste content |
| `Ctrl+A` | Select all |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Tab` | Increase indent |
| `Shift+Tab` | Decrease indent |
| `Enter`           | New line and preserve indent |



| Cursor Navigation            |          | Selection & Editing              |         |
| --------------- | -------- | ----------------- | ------- |
| `↑` `↓` `←` `→` | Move cursor up/down/left/right | `Shift+Arrow Keys`       | Extend selection    |
| `Home`          | Jump to line start    | `Ctrl+Shift+←`    | Select to word start |
| `End`           | Jump to line end    | `Ctrl+Shift+→`    | Select to word end |
| `Ctrl+←`        | Move left one word | `Ctrl+Shift+Home` | Select to file start |
| `Ctrl+→`        | Move right one word | `Ctrl+Shift+End`  | Select to file end |
| `Ctrl+Home`     | Jump to file start  | `Backspace`       | Delete character before cursor |
| `Ctrl+End`      | Jump to file end  | `Delete`          | Delete character after cursor |
| `Page Up`       | Page up     | `Ctrl+Backspace`  | Delete word before cursor |
| `Page Down`     | Page down     | `Ctrl+Delete`     | Delete word after cursor |


---

## Installation

### Method 1: Via Obsidian Community Plugins (In review, not yet fully listed)

1. Open **Settings > Community Plugins**.
2. Turn off "Safe mode".
3. Click "Browse" button.
4. Search for "Code Space".
5. Click "Install" and enable.

### Method 2: Manual Installation

1. Visit [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest).
2. Download `main.js`, `manifest.json`, and `styles.css`. Place them in your vault's plugin directory: `.obsidian/plugins/code-space/`. If the `code-space` folder does not exist, please create it manually.
3. Reload and enable the plugin in Obsidian settings.

### Method 3: BRAT Download

Download the BRAT plugin first. When adding a Beta plugin in settings, enter this repository address: `https://github.com/UNLINEARITY/Obsidian-CodeSpace` and select the latest version.

<p align='center'><img src='img\pre6.png' width=85%></p> 

---

## Development

### Build Requirements

- Node.js 16 or higher
- npm

### Build Commands

```bash
npm install          # Install dependencies
npm run dev          # Development build (file watching)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Project Structure

```
obsidian-codespace/
├── src/
│   ├── main.ts           # Plugin Entry: Handles command registration, view mounting, and lifecycle management
│   ├── code_view.ts      # Editor Core: Implementation of CodeMirror 6 based code editing environment
│   ├── dashboard_view.ts # Dashboard View: Visual file indexing and management interface
│   ├── outline_view.ts   # Outline View: Implementation of sidebar structured navigation
│   ├── code_parser.ts    # Symbol Parser: Multi-language code structure analysis tool
│   ├── code_embed.ts     # Embed Processor: Markdown reference and preview logic
│   ├── dropdown.ts       # UI Component: Custom interactive dropdown menu
│   └── settings.ts       # Settings Panel: Implementation of plugin configuration options
├── styles.css            # Plugin Styles: Visual definitions for editor, dashboard, and outline
├── manifest.json         # Plugin Metadata
└── package.json          # Project dependencies and build scripts
```

---


## Contributing

Contributions are welcome via Pull Request!

Please ensure:
1. Code passes ESLint checks.
2. Follows existing code style.
3. Commit messages are clear and descriptive.

For issues or suggestions, please use [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues).
- Author: unlinearity
- Email: unlinearity@gmail.com
- [MIT License](LICENSE) - Copyright (c) 2026 unlinearity

**Known Limitations:**
- Code file content is currently not indexed by Obsidian's global search engine.

---
## Acknowledgments

This project is built upon the following excellent projects:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): Provides powerful plugin extensibility capabilities.
- [CodeMirror 6](https://codemirror.net/): Flexible and modern code editor engine.
- [Lezer](https://lezer.codemirror.net/): Efficient incremental code parsing system.
- [TypeScript](https://www.typescriptlang.org/): Provides robust type safety assurances.
- [esbuild](https://esbuild.github.io/): Extremely fast JavaScript bundler.

---

**Making code management simple and efficient in Obsidian!**
