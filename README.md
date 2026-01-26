# Code Space

<h1 align="center">
     Code File Management for Obsidian
     <p align='center'><img src='img\pre0.png' width=70%></p> 
     <img alt="Release version" src="https://img.shields.io/github/v/release/unlinearity/Obsidian-Codespace?style=for-the-badge">
    <img alt="License" src="https://img.shields.io/github/license/unlinearity/Obsidian-Codespace?style=for-the-badge">
</h1>

<p align="center">
    <span>A comprehensive plugin for code file viewing, management, and editing in Obsidian</span>
    <br/>
    <a href="/README.md">English</a>
    ·
    <a href="/README_CN.md">简体中文</a>
</p>

---

## About

Obsidian does not support **code file viewing, management, and editing** by default. Code Space was created to solve this problem.

**The Three Layers of "Space":**

1. **Management Space**: Unified indexing and management for code files through a visual dashboard.
2. **Editing Space**: Professional code viewing and editing environment within code files.
3. **Embedding Space**: Deep integration with Obsidian native features for code file references and embedded previews.


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

- **Syntax Highlighting**: Precise highlighting for multiple programming languages powered by CodeMirror 6.
- **Structured Navigation**: Integrated Code Outline view that automatically parses Class, Function, and Method structures with click-to-jump support.
- **Advanced Search & Replace**: Independent search panel supporting Regular Expressions, case sensitivity, whole-word matching, and global replacement.
- **Manual Save Mechanism**: Supports Ctrl+S manual saving with cursor position protection to prevent viewport jumping.
- **Editing Assistance**: Supports auto-indentation, bracket matching, code folding, and line number display.
- **Interaction Optimization**: Supports Ctrl+Wheel font scaling and provides a floating search button for quick access.

<p align='center'><img src='img\pre22.png' width=95%></p> 

<p align='center'><img src='img\pre2.png' width=95%></p> 

### 3. Obsidian Native Embedding Space

Elegantly embed and preview code in Markdown notes.

- **File References**: Link code files using `[[filename]]` syntax.
- **Code Embedding**: Embed code previews in Markdown using `![[filename]]`.
- **Quick Preview**: Hover over links to preview code content.
- **Bidirectional Sync**: Automatic detection and notification of external modifications.

<p align='center'><img src='img\pre3.png' width=95%></p> 

---
## Configuration

Access plugin settings via: **Settings > Community Plugins > Code Space**

- **Managed Extensions**: Comma-separated list of file extensions for Code Space to manage.
- **Show Line Numbers**: Toggle line number display (default: enabled).
- **Max Embed Lines**: Maximum lines to display in embedded previews (default: 30, 0 for unlimited).

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
- If it is a binary file (e.g., images or PDFs), it will be opened using Obsidian's native viewer. You can even use it to manage attachments like PDFs.

<p align='center'><img src='img\pre4.png' width=95%></p> 



## Supported Keyboard Shortcuts

### Plugin Commands

<p align='center'><img src='img\pre5.png' width=95%></p> 

| Command Path | Function |
|-------------|----------|
| `Ctrl+P` → "Open code dashboard" | Open code management panel |
| `Ctrl+P` → "Create code file" | Create new code file |
| `Ctrl+P` → "Reload code space plugin" | Reload plugin |
| `Ctrl+P` → "Toggle code outline" | Toggle code outline view (Enabled by default) |


---

### Basic Operations

| Shortcut | Function |
|----------|----------|
| `Ctrl+S` | Save file manually |
| `Ctrl+Mouse Wheel` | Adjust font size |
| `Ctrl+C` | Copy selection |
| `Ctrl+X` | Cut selection |
| `Ctrl+V` | Paste |
| `Ctrl+A` | Select all |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Tab` | Increase indent |
| `Shift+Tab` | Decrease indent |

### Cursor Navigation

| Shortcut | Function |
|----------|----------|
| `↑` `↓` `←` `→` | Move cursor up/down/left/right |
| `Home` | Jump to line start |
| `End` | Jump to line end |
| `Ctrl+←` | Move left one word |
| `Ctrl+→` | Move right one word |
| `Ctrl+Home` | Jump to file start |
| `Ctrl+End` | Jump to file end |
| `Page Up` | Scroll up |
| `Page Down` | Scroll down |

### Selection Operations

| Shortcut | Function |
|----------|----------|
| `Shift+Arrow Keys` | Extend selection |
| `Ctrl+Shift+←` | Select to word start |
| `Ctrl+Shift+→` | Select to word end |
| `Ctrl+Shift+Home` | Select to file start |
| `Ctrl+Shift+End` | Select to file end |
| `Ctrl+A` | Select all |

### Editing Operations

| Shortcut | Function |
|----------|----------|
| `Backspace` | Delete character before cursor |
| `Delete` | Delete character after cursor |
| `Ctrl+Backspace` | Delete word before cursor |
| `Ctrl+Delete` | Delete word after cursor |
| `Enter` | New line with indent preserved |

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
2. Download `main.js`, `manifest.json`, and `styles.css`. Place them in your vault's plugin directory: `.obsidian/plugins/code-space/`. Create the `code-space` folder manually if it doesn't exist.
3. Reload and enable in Obsidian settings.

---

## Development

### Requirements

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

---

## Known Limitations
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

## Contact

- Author: unlinearity
- Email: unlinearity@gmail.com
- Issues: [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues)
- [MIT License](LICENSE) - Copyright (c) 2026 unlinearity
---

**Making code management simple and efficient in Obsidian!**

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=UNLINEARITY/Obsidian-CodeSpace&type=timeline&legend=top-left)](https://www.star-history.com/#UNLINEARITY/Obsidian-CodeSpace&type=timeline&legend=top-left)
