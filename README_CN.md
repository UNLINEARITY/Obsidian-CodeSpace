# Code Space

<h1 align="center">
    为 Obsidian 提供专业的代码文件管理
    <p align='center'><img src='img\Code.webp' width=80%></p> 
    <img alt="Release version" src="https://img.shields.io/github/v/release/unlinearity/Obsidian-Codespace?style=for-the-badge">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/unlinearity/Obsidian-Codespace?style=for-the-badge">
    <img alt="License" src="https://img.shields.io/github/license/unlinearity/Obsidian-Codespace?style=for-the-badge">
</h1>

<p align="center">
    <span>一款功能全面的插件，在 Obsidian 中查看、管理和编辑代码文件</span>
    <br/>
    <a href="/README.md">English</a>
    ·
    <a href="/README_CN.md">简体中文</a>
</p>

---
## 关于插件

Obsidian 默认不支持**代码文件的查看、管理和编辑**，Code Space 插件为解决这一问题而生。

**"Space" 的三层含义：**

1. **管理空间**：为代码文件提供统一索引和管理空间，通过可视化面板浏览所有代码文件
2. **编辑空间**：进入代码文件内部，提供专业的代码查看和编辑环境
3. **嵌入空间**：与 Obsidian 原生功能深度融合，支持代码文件的引用和嵌入式预览


[![Star History Chart](https://api.star-history.com/svg?repos=UNLINEARITY/Obsidian-CodeSpace&type=timeline&legend=top-left)](https://www.star-history.com/#UNLINEARITY/Obsidian-CodeSpace&type=timeline&legend=top-left)
---

## 核心功能

### 1. 代码文件管理空间
提供可视化仪表盘，用于库内代码文件的统一索引与管理。

- **可视化仪表盘**：提供沉浸式管理界面，支持网格布局与文件状态概览。
- **集成管理工具**：标题区域集成**设置入口**与**文件创建功能**，简化操作路径。
- **多维动态过滤**：支持按文件扩展名筛选和按文件名实时搜索。
- **标准文件操作**：集成重命名、移动、删除及外部应用打开等obsidian原生支持的文件管理功能。

<p align='center'><img src='img\pre1.png' width=95%></p> 


### 2. 专业代码编辑空间
提供基于 IDE 体验的代码查看与编辑环境。

- **语法高亮**：基于 CodeMirror 6，提供针对多种编程语言的精确高亮显示。
- **结构化导航**：集成代码大纲视图，自动解析类、函数及方法结构并支持点击跳转。
- **高级搜索替换**：提供独立搜索面板，支持正则表达式、大小写敏感、全词匹配及全局替换。
- **手动保存机制**：支持 Ctrl+S 手动保存，并具备光标位置保护功能，防止保存时视口跳动。
- **基础编辑辅助**：支持自动缩进、括号补全、代码折叠及行号显示。
- **交互优化**：支持 Ctrl+滚轮缩放字体，并提供浮动搜索按钮以快速触达查找功能。

<p align='center'><img src='img\pre22.png' width=95%></p> 

### 3. Obsidian 原生嵌入空间

在 Markdown 中优雅地嵌入和预览代码

- **文件引用**：使用 `[[文件名]]` 语法链接代码文件
- **代码嵌入**：使用 `![[文件名]]` 在 Markdown 中嵌入预览
- **快速预览**：悬停在链接上即可预览代码内容
- **双向同步**：外部修改自动检测并提示

<p align='center'><img src='img\pre3.png' width=95%></p> 

---
## 配置选项

通过 **设置 > 社区插件 > Code Space** 访问配置：

- **管理的扩展名**：指定需要 Code Space 管理的文件扩展名（英文逗号分隔）
- **显示行号**：是否显示行号（默认：开启）
- **最大嵌入行数**：嵌入预览显示的最大行数（默认：30，0 表示无限制）
- **外部文件夹（仅桌面端）**：通过系统符号链接/目录联接将外部文件夹挂载到 vault 内。

注意：外部挂载会使插件访问 vault 外的文件，请仅挂载可信目录。

## 支持的语言（可以任意扩展）

| 语言 | 扩展名 |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs` |
| Web 技术 | `.html`, `.htm`, `.css`, `.scss`, `.sass`, `.less` |
| 系统编程 | `.rs`, `.go` |
| 数据 | `.sql`, `.json`, `.yaml`, `.yml`, `.xml` |
| 脚本 | `.php`, `.rb`, `.sh` |

**更多语言可通过插件设置添加，插件支持任意后缀的文件管理！**
- 如果是代码文件，会通过Code Space的代码界面打开
- 如果是二进制文件（例如图片或 pdf ,会调用 Obsidian 原生的查看器进行打开，你甚至可以用来管理 pdf 等附件）

<p align='center'><img src='img\pre4.png' width=95%></p> 



## 支持的快捷键

### 插件命令

<p align='center'><img src='img\pre5.png' width=95%></p> 

| 命令路径 | 功能 |
|---------|------|
| `Ctrl+P` → "Open code dashboard" | 打开代码管理面板 |
| `Ctrl+P` → "Create code file" | 创建新代码文件 |
| `Ctrl+P` → "Reload code space plugin" | 重新加载插件 |
| `Ctrl+P` → "Toggle code outline" | 开关代码大纲视图（默认打开） |
| `Ctrl+P` → "Search and replace" | 在代码界面搜索和替换 |

---

### 基础操作

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 手动保存文件 |
| `Ctrl+鼠标滚轮` | 调整字体大小 |
| `Ctrl+C` | 复制选中内容 |
| `Ctrl+X` | 剪切选中内容 |
| `Ctrl+V` | 粘贴内容 |
| `Ctrl+A` | 全选 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` 或 `Ctrl+Shift+Z` | 重做 |
| `Tab` | 增加缩进 |
| `Shift+Tab` | 减少缩进 |
| `Enter`           | 换行并保持缩进 |



| 光标导航            |          | 选择编辑              |         |
| --------------- | -------- | ----------------- | ------- |
| `↑` `↓` `←` `→` | 上下左右移动光标 | `Shift+方向键`       | 扩展选择    |
| `Home`          | 跳转到行首    | `Ctrl+Shift+←`    | 选择到单词开头 |
| `End`           | 跳转到行尾    | `Ctrl+Shift+→`    | 选择到单词结尾 |
| `Ctrl+←`        | 向左移动一个单词 | `Ctrl+Shift+Home` | 选择到文件开头 |
| `Ctrl+→`        | 向右移动一个单词 | `Ctrl+Shift+End`  | 选择到文件结尾 |
| `Ctrl+Home`     | 跳转到文件开头  | `Backspace`       | 删除光标前字符 |
| `Ctrl+End`      | 跳转到文件末尾  | `Delete`          | 删除光标后字符 |
| `Page Up`       | 向上翻页     | `Ctrl+Backspace`  | 删除光标前单词 |
| `Page Down`     | 向下翻页     | `Ctrl+Delete`     | 删除光标后单词 |


---

## 安装

### 方式一：通过 Obsidian 社区插件安装（在审核列表，还未完全上架）

1. 打开 **设置 > 社区插件**
2. 关闭"安全模式"
3. 点击"浏览"按钮
4. 搜索"Code Space"
5. 点击"安装"并启用

### 方式二：手动安装

1. 访问 [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest) 
2. 下载 main.js、manifest.json、styles.css，放置在你的obsidian库的插件目录：`.obsidian/plugins/code-space/`，code-space 这个文件夹如果不存在请手动创建
3. 在 Obsidian 设置中重新加载并启用插件

### 方式三：BRAT 下载

先下载好BRAT插件，设置中添加Beta插件时，填写本仓库地址：https://github.com/UNLINEARITY/Obsidian-CodeSpace ，选择最新版本。

<p align='center'><img src='img\pre6.png' width=85%></p> 

---

## 开发

### 构建要求

- Node.js 16 或更高版本
- npm

### 构建命令

```bash
npm install          # 安装依赖
npm run dev          # 开发构建（文件监视）
npm run build        # 生产构建
npm run lint         # 运行 ESLint
```

### 项目结构

```
obsidian-codespace/
├── src/
│   ├── main.ts           # 插件入口：负责命令注册、视图挂载及生命周期管理
│   ├── code_view.ts      # 编辑器核心：基于 CodeMirror 6 的代码编辑环境实现
│   ├── dashboard_view.ts # 仪表盘视图：可视化文件索引与管理界面
│   ├── outline_view.ts   # 大纲视图：侧边栏结构化导航实现
│   ├── code_parser.ts    # 符号解析器：多语言代码结构分析工具
│   ├── code_embed.ts     # 嵌入处理器：Markdown 引用与预览逻辑
│   ├── dropdown.ts       # UI 组件：自定义下拉交互菜单
│   └── settings.ts       # 设置面板：插件配置项实现
├── styles.css            # 插件样式：涵盖编辑器、仪表盘及大纲的视觉定义
├── manifest.json         # 插件元数据
└── package.json          # 项目依赖与构建脚本
```

---


## 贡献

欢迎通过 Pull Request 贡献代码！

请确保：
1. 代码通过 ESLint 检查
2. 遵循现有代码风格
3. 提交信息清晰明确

如有问题或建议，请使用 [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues)。
- 作者：unlinearity
- 邮箱：unlinearity@gmail.com
- [MIT License](LICENSE) - Copyright (c) 2026 unlinearity

已知限制：
- 代码文件内容目前不被 Obsidian 的全局搜索引擎索引。

---
## 致谢

本项目构建于以下优秀项目之上：
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): 提供强大的插件扩展能力。
- [CodeMirror 6](https://codemirror.net/): 灵活且现代的代码编辑器引擎。
- [Lezer](https://lezer.codemirror.net/): 高效的增量式代码解析系统。
- [TypeScript](https://www.typescriptlang.org/): 提供稳健的类型安全保障。
- [esbuild](https://esbuild.github.io/): 极速的 JavaScript 打包工具。

---

**让代码管理在 Obsidian 中变得简单而高效！**
