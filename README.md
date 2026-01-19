# Code Space

A professional code editor plugin for Obsidian, providing advanced code editing, management, and preview capabilities.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-compatible-brightgreen.svg)](https://obsidian.md)
[![Version](https://img.shields.io/badge/version-1.0.0-orange.svg)](https://github.com/unlinearity/obsidian-codespace/releases)

## Overview

Code Space is a comprehensive code editor plugin designed for Obsidian, featuring syntax highlighting for multiple programming languages, code embedding, and a visual dashboard for managing code files.

## Features

### Professional Code Editing
- **Syntax Highlighting**: High-quality syntax highlighting powered by CodeMirror 6
- **Smart Indentation**: Automatic indentation and bracket matching
- **Code Folding**: Support for code block folding to improve readability
- **Line Numbers**: Configurable line number display
- **Custom Font Size**: Adjust font size using `Ctrl + Mouse Wheel`

### Code Management
- **Multi-language Support**: Python, C/C++, JavaScript/TypeScript, HTML, CSS, SQL, PHP, and more
- **Code Dashboard**: Visual management interface for all code files
- **Quick Creation**: One-click creation of new code files
- **Manual Save**: `Ctrl+S` to save changes, avoiding auto-save interruptions

### Code Embedding
- **Markdown Integration**: Embed code previews in Markdown using `![[filename]]` syntax
- **Automatic Height**: Preview height adjusts automatically based on line count
- **Configurable Limits**: Set maximum display lines to prevent excessive space usage
- **One-click Open**: Click embedded preview to open full editor

### Keyboard Shortcuts
| Shortcut | Function |
|----------|----------|
| `Ctrl+S` | Save file |
| `Ctrl + Mouse Wheel` | Adjust font size |
| `Ctrl+Shift+P` → "Reload Code Space Plugin" | Reload plugin |

## Installation

### Method 1: Via Obsidian Community Plugins (Coming Soon)

1. Open Obsidian Settings
2. Navigate to "Community Plugins"
3. Search for "Code Space"
4. Click "Install" and enable the plugin

### Method 2: Manual Installation

1. Download the latest [main.js](https://github.com/unlinearity/obsidian-codespace/releases/latest), [manifest.json](https://github.com/unlinearity/obsidian-codespace/raw/main/manifest.json), and [styles.css](https://github.com/unlinearity/obsidian-codespace/raw/main/styles.css)
2. Create plugin directory in your vault: `.obsidian/plugins/code-space/`
3. Copy downloaded files to this directory
4. Enable "Code Space" in Obsidian Settings

## Usage

### Editing Code Files

1. **Open Code Files**
   - Double-click code files in file tree (e.g., `.py`, `.js`)
   - Or execute "Open Dashboard" in command palette to browse all code files

2. **Edit Code**
   - Use familiar keyboard shortcuts for editing
   - Press `Ctrl+S` to save changes
   - Unsaved files display a `●` marker

3. **Adjust Font Size**
   - Hold `Ctrl` key and scroll mouse wheel

### Embedding Code in Markdown

Use the following syntax in Markdown files:

```
![[my-script.py]]
```

Embedded code displays as a preview box containing:
- Filename and path
- Line count statistics
- Scrollable code preview
- Click preview area to open full editor

### Configuration Options

In "Settings > Code Space", you can configure:

- **Managed Extensions**: Specify file extensions for Code Space to manage (default: `py, c, cpp, h, hpp, js, ts, jsx, tsx, json, mjs, cjs, css, scss, sass, less, html, htm, rs, go, java, sql, php, rb, sh, yaml, xml`)
- **Show Line Numbers**: Toggle line number display (default: enabled)
- **Max Embed Lines**: Maximum lines for embedded preview (default: 30 lines, 0 for unlimited)

## Supported Languages

| Language | Extensions |
|----------|------------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs` |
| Web | `.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less` |
| Rust | `.rs` |
| Go | `.go` |
| SQL | `.sql` |
| PHP | `.php` |
| Ruby | `.rb` |
| Shell | `.sh` |
| Config Files | `.yaml`, `.yml`, `.xml`, `.json` |

*More languages can be added via "Managed Extensions" in settings*

## Development

### Requirements

- Node.js >= 16
- npm or yarn

### Build Steps

```bash
# Clone repository
git clone https://github.com/unlinearity/obsidian-codespace.git
cd obsidian-codespace

# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Lint code
npm run lint
```

### Project Structure

```
obsidian-codespace/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── code_view.ts         # Code editor view
│   ├── code_embed.ts        # Code embed processor
│   ├── code_dashboard.ts    # Code dashboard
│   └── settings.ts          # Settings page
├── styles.css               # Plugin styles
├── manifest.json            # Plugin manifest
├── package.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## Changelog

### [1.0.0] - 2026-01-18

#### Added
- Initial release
- Syntax highlighting for multiple programming languages
- Code embedding preview functionality
- Code dashboard view
- Manual save (Ctrl+S)
- Font size adjustment (Ctrl + Mouse Wheel)
- Configurable display options

#### Known Issues
- Code file content not yet searchable via Obsidian global search
- Some advanced editing features (such as search and replace) not yet implemented

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- [Obsidian](https://obsidian.md) - Powerful knowledge management tool
- [CodeMirror](https://codemirror.net/) - Excellent code editor component
- All contributors and testers in the community

## Contact

- Author: unlinearity
- Email: unlinearity@gmail.com
- GitHub: [@unlinearity](https://github.com/unlinearity)
- Issue Tracker: [GitHub Issues](https://github.com/unlinearity/obsidian-codespace/issues)
