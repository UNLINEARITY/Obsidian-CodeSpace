# Code Space

<h1 align="center">
    Professional code file management for Obsidian
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
## About the plugin

Obsidian does not support **viewing, managing, and editing code files** out of the box. Code Space was created to solve this problem.

**The four layers of "Space":**

1. **Management space**: Provides a unified index and management space for code files, allowing you to browse all code files through a visual dashboard.
2. **Editing space**: Enter the code file for a professional code viewing and editing environment.
3. **Embedding space**: Deeply integrates with Obsidian's native features to support references and embedded previews of code files.
4. **Mount space**: Mount external folders into the Vault via system symlinks/junctions for cross-project code management.


<p align="center">
  <img src="https://api.star-history.com/svg?repos=UNLINEARITY/Obsidian-CodeSpace&type=timeline&legend=top-left" alt="Star History Chart">
</p>

---

## Core features

### 1. Code file management space
Provides a visual dashboard for unified indexing and management of code files within the vault.

- **Visual dashboard**: An immersive management interface with grid layout and file status overview.
- **Integrated management tools**: The header integrates **Settings** and **Create file** for simpler workflows.
- **Multi-dimensional dynamic filtering**: Filter by file extension and search by filename in real time.
- **Standard file operations**: Built-in Obsidian-supported file operations like rename, move, delete, and open in external apps.

<p align='center'><img src='img\pre1.png' width=95%></p> 


### 2. Professional code editing space
Provides an IDE-like environment for code viewing and editing.

- **Syntax highlighting**: Powered by CodeMirror 6 with accurate highlighting for many languages.
- **Structured navigation**: Code outline view that parses classes, functions, and methods with click-to-jump navigation.
- **Advanced search and replace**: Dedicated search panel with regex, case sensitivity, whole-word matching, and global replacement.
- **Manual save**: Ctrl+S manual save with cursor position protection to prevent viewport jumps.
- **Basic editing helpers**: Auto indentation, bracket matching, code folding, and line numbers.
- **Interaction optimizations**: Ctrl+wheel font scaling and a floating search button for quick access.

<p align='center'><img src='img\pre22.png' width=95%></p> 

### 3. Obsidian native embedding space

Elegantly embed and preview code in Markdown, allowing you to embed specific snippets from code files:

- **File references**: Link code files with `[[filename]]`.
- **Code embedding**: Embed previews in Markdown with `![[filename]]`.
- **Line ranges**: Specify start lines or line ranges to embed code snippets precisely.
- **Quick preview**: Hover links to preview code content.
- **Bidirectional sync**: Automatically detect and notify on external modifications.

<p align='center'><img src='img\pre3.png' width=95%></p> 

**Supported embed syntax:**

| Syntax | Description |
|--------|-------------|
| `![[test.py]]` | Embed the entire file |
| `![[test.py#20]]` | Display from line 20 to end of file |
| `![[test.py#L20]]` | Same as above (GitHub-style with `L` prefix) |
| `![[test.py#20-40]]` | Display lines 20 to 40 |
| `![[test.py#L20-L40]]` | Same as above (GitHub-style) |
| `![[test.py#L20-40]]` | Mixed format also supported |

**Line range features:**
- In range mode, displays the full specified range ignoring the "Max embed lines" setting
- If end line exceeds file length, automatically truncates to end of file
- If end line is less than start line, automatically adjusts to single line display
- Line numbers are consistent with the original file

### 4. External mount space (desktop only)

Break through Vault boundaries to manage external project code.

- **Symlinks/junctions**: Mount external folders into the Vault by creating symlinks (macOS/Linux) or directory junctions (Windows)
- **Seamless integration**: Code files in mounted folders appear in the dashboard with full Code Space functionality (editing, embedding, outline, etc.)
- **Bidirectional sync**: External file modifications automatically sync to Obsidian, and edits in Obsidian are written back to the original location
- **Cross-project collaboration**: Manage distributed code repositories directly without copying project code into the Vault

<p align='center'><img src='img\pre7.png' width=95%></p> 

**Usage:**
1. Create symlinks/junctions in your Vault pointing to external folders
2. Configure management rules in **Settings > Code Space > External Folders**
3. Code Space will automatically recognize and index code files in mounted folders

**Important notes!**
- **Desktop only**: External mounts are unavailable on iOS/Android due to sandbox restrictions
- **Security risk**: External mounts allow the plugin to access files outside the Vault. **Only mount folders you trust**
- **Performance issues**: Please do not abuse this feature. You can manage lightweight repositories or perform multi-repository coordination, but avoid mounting too many files or large files arbitrarily
- **Path stability**: Moving or renaming external folders will break the mount and require reconfiguration
- **Sync issues**: If external folders are in cloud-synced directories (e.g., Dropbox, OneDrive), ensure Obsidian and external folders are in sync to avoid conflicts

---
## Configuration

Access configuration via **Settings > Community plugins > Code Space**:

- **Managed Extensions**: Specify file extensions managed by Code Space (comma-separated)
- **Show Line Numbers**: Toggle line numbers (Default: On)
- **Max Embed Lines**: Maximum lines shown in embedded previews (Default: 30, 0 for unlimited)
- **External Folders (Desktop Only)**: Mount external folders into the Vault via system symlinks/junctions. See the "External Mount Space" chapter above for details.

Note: External mounts allow access to files outside the Vault. Only mount folders you trust.

## Supported languages (extensible)

### Default supported extensions

| Language | Extensions |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.json` |
| Web Technologies | `.html`, `.htm`, `.xhtml`, `.css`, `.scss`, `.sass`, `.less` |
| Systems Programming | `.rs`, `.go`, `.java`, `.cs` |
| Data/Config | `.sql`, `.yaml`, `.yml`, `.xml` |
| Scripting | `.php`, `.r` |

**You can add more languages in plugin settings. The plugin supports managing files with any extension!**
- Code files open in the Code Space editor interface
- Binary files (e.g., images or PDFs) open with Obsidian's native viewer. You can even use it to manage attachments like PDFs 

<p align='center'><img src='img\pre4.png' width=95%></p> 

### Manually addable extensions (also support syntax highlighting)

Add the following extensions in **Settings > Code Space > Managed Extensions** to enable:

| Language | Extensions | Highlighting reused from |
|------|--------|-------------|
| **XML Family** | `.svg`, `.xsd`, `.xsl`, `.xslt`, `.wsdl`, `.plist`, `.csproj`, `.vcxproj`, `.props`, `.targets`, `.config` | XML |
| | `.urdf`, `.xacro` | XML |
| **C/C++ Family** | `.ino`, `.pde`, `.nut` | C/C++ |
| | `.cu`, `.cuh`, `.glsl`, `.vert`, `.frag`, `.hlsl`, `.mm`, `.swift` | C/C++ |
| **Java Family** | `.kt`, `.kts`, `.scala`, `.groovy`, `.gradle` | Java |
| **Frontend Frameworks** | `.vue`, `.svelte`, `.astro` | JavaScript |
| **JSON Variants** | `.json5`, `.jsonc` | JavaScript |
| **Python Family** | `.pyx`, `.pxd`, `.pxi`, `.ipy` | Python |
| **Config Files** | `.toml`, `.ini`, `.cfg`, `.conf` | YAML |
| **Shell Scripts** | `.sh`, `.bash`, `.zsh` | Shell |
| **PowerShell** | `.ps1`, `.psm1`, `.psd1` | PowerShell |
| **Other Languages** | `.cmake`, `.dockerfile`, `.diff`, `.patch`, `.lua`, `.pl`, `.pm`, `.rb`, `.erb` | Dedicated |

### Binary file support (opened with Obsidian native viewer)

The following files can also be managed in the Code Space dashboard (rename, move, delete, etc.), but will not be opened by the Code Space editor. They use the system viewer or Obsidian's native viewer.

| Type | Extensions |
|------|--------|
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.psd` |
| Documents | `.pdf` |
| Audio | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma` |
| Video | `.mp4`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v` |
| Archives | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz` |
| Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| Other | `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.dat` |




## Supported keyboard shortcuts

### Plugin commands

<p align='center'><img src='img\pre5.png' width=95%></p> 

| Command path | Function |
|---------|------|
| `Ctrl+P` → "Open code dashboard" | Open the code management panel |
| `Ctrl+P` → "Create code file" | Create a new code file |
| `Ctrl+P` → "Reload code space plugin" | Reload the plugin |
| `Ctrl+P` → "Toggle code outline" | Toggle the code outline view (Default: On) |
| `Ctrl+P` → "Search and replace" | Search and replace in the code interface |

---

### Basic operations

| Shortcut | Function |
|--------|------|
| `Ctrl+S` | Manually save the file |
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



| Cursor navigation            |          | Selection and editing              |         |
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

### Method 1: Install via Obsidian community plugins (in review, not fully listed yet)

1. Open **Settings > Community plugins**.
2. Turn off "Safe mode".
3. Click the "Browse" button.
4. Search for "Code Space".
5. Click "Install" and enable.

### Method 2: Manual installation

1. Visit [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest).
2. Download `main.js`, `manifest.json`, and `styles.css`. Place them in your vault plugin directory: `.obsidian/plugins/code-space/`. If the `code-space` folder does not exist, create it manually.
3. Reload and enable the plugin in Obsidian settings.

### Method 3: BRAT

Install the BRAT plugin first. When adding a beta plugin in settings, enter this repository address: `https://github.com/UNLINEARITY/Obsidian-CodeSpace` and select the latest version.

<p align='center'><img src='img\pre6.png' width=85%></p> 

---

## Development

### Build requirements

- Node.js 16 or later
- npm

### Build commands

```bash
npm install          # Install dependencies
npm run dev          # Development build (file watching)
npm run build        # Production build
npm run lint         # Run ESLint
```

### Project structure

```
obsidian-codespace/
├── src/
│   ├── main.ts                # Plugin entry: command registration, view mounting, and lifecycle management
│   ├── code_view.ts           # Editor core: CodeMirror 6 editing environment
│   ├── dashboard_view.ts      # Dashboard view: file indexing and management UI
│   ├── outline_view.ts        # Outline view: sidebar structured navigation
│   ├── code_parser.ts         # Syntax parser: multi-language structure analysis
│   ├── code_embed.ts          # Embed processing: reference and preview logic
│   ├── dropdown.ts            # UI components: dropdown/multi-select
│   ├── folder_filter_modal.ts # Folder filter modal
│   ├── external_mount.ts      # External mounts: symlink/junction management
│   ├── settings.ts            # Settings panel: plugin configuration
│   └── lang/
│       ├── helpers.ts         # Localization helpers
│       └── locale/
│           ├── en.ts          # English strings
│           └── zh-cn.ts       # Chinese strings
├── styles.css                 # Styles entry
├── manifest.json              # Plugin metadata
└── package.json               # Dependencies and scripts
```

---


## Contributing

Contributions are welcome via Pull Request!

Please ensure:
1. Code passes ESLint checks
2. Follow the existing code style
3. Commit messages are clear and descriptive

For issues or suggestions, please use [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues).
- Author: unlinearity
- Email: unlinearity@gmail.com
- [MIT License](LICENSE) - Copyright (c) 2026 unlinearity

Known limitations:
- Code file contents are currently not indexed by Obsidian's global search engine.

---
## Acknowledgments

This project is built upon the following excellent projects:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): Provides powerful plugin extensibility.
- [CodeMirror 6](https://codemirror.net/): Flexible and modern code editor engine.
- [Lezer](https://lezer.codemirror.net/): Efficient incremental code parsing system.
- [TypeScript](https://www.typescriptlang.org/): Provides robust type safety.
- [esbuild](https://esbuild.github.io/): Extremely fast JavaScript bundler.

---

**Make code management simple and efficient in Obsidian!**
