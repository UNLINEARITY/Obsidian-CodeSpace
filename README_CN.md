# Code Space

<h1 align="center">
    为 Obsidian 提供专业的代码文件管理
</h1>

<p align="center">
    <img alt="Release version" src="https://img.shields.io/github/v/release/unlinearity/Obsidian-Codespace?style=for-the-badge">
    <img alt="License" src="https://img.shields.io/github/license/unlinearity/Obsidian-Codespace?style=for-the-badge">
</p>

<p align="center">
    <span>一个为 Obsidian 提供代码文件全方位支持的插件</span>
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


---

## 核心功能

### 1. 代码文件管理空间
通过可视化仪表盘统一管理所有代码文件

- **可视化仪表盘**：通过专用界面浏览和管理所有代码文件
- **智能筛选**：按文件扩展名、文件名搜索过滤
- **右键操作**：重命名、移动、删除、在系统应用中打开
- **快速创建**：一键创建新的代码文件

<p align='center'><img src='img\pre1.png' width=95%></p> 


### 2. 专业代码编辑空间

语法高亮、行号、代码折叠等专业编辑功能 

- **语法高亮**：基于 CodeMirror 6 的多语言语法高亮
- **智能编辑**：自动缩进、括号匹配、代码折叠
- **行号显示**：可选的行号显示功能
- **手动保存**：Ctrl+S 手动保存，避免意外修改
- **字体缩放**：Ctrl+鼠标滚轮调整字体大小
- **快捷操作**: 支持系列快捷键，可以参考后面快捷键的提示

<p align='center'><img src='img\pre2.png' width=95%></p> 

### 3. Obsidian 原生语法嵌入

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

*更多语言可通过插件设置添加，插件支持任意后缀的文件管理！*
- 如果是代码文件，会通过Code Space的代码界面打开
- 如果是二进制文件（例如图片或 pdf ,会调用 Obsidian 原生的查看器进行打开

<p align='center'><img src='img\pre4.png' width=95%></p> 



## 支持的快捷键

### 插件命令

<p align='center'><img src='img\pre5.png' width=95%></p> 

| 命令路径 | 功能 |
|---------|------|
| `Ctrl+P` → "Open Code Dashboard" | 打开代码管理面板 |
| `Ctrl+P` → "Create Code File" | 创建新代码文件 |
| `Ctrl+P` → "Reload Code Space Plugin" | 重新加载插件 |


---

### 基础操作

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 保存当前文件 |
| `Ctrl+鼠标滚轮` | 调整字体大小 |
| `Ctrl+C` | 复制选中内容 |
| `Ctrl+X` | 剪切选中内容 |
| `Ctrl+V` | 粘贴内容 |
| `Ctrl+A` | 全选 |
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` 或 `Ctrl+Shift+Z` | 重做 |
| `Tab` | 增加缩进 |
| `Shift+Tab` | 减少缩进 |

### 光标导航

| 快捷键 | 功能 |
|--------|------|
| `↑` `↓` `←` `→` | 上下左右移动光标 |
| `Home` | 跳转到行首 |
| `End` | 跳转到行尾 |
| `Ctrl+←` | 向左移动一个单词 |
| `Ctrl+→` | 向右移动一个单词 |
| `Ctrl+Home` | 跳转到文件开头 |
| `Ctrl+End` | 跳转到文件末尾 |
| `Page Up` | 向上翻页 |
| `Page Down` | 向下翻页 |

### 选择操作

| 快捷键 | 功能 |
|--------|------|
| `Shift+方向键` | 扩展选择 |
| `Ctrl+Shift+←` | 选择到单词开头 |
| `Ctrl+Shift+→` | 选择到单词结尾 |
| `Ctrl+Shift+Home` | 选择到文件开头 |
| `Ctrl+Shift+End` | 选择到文件结尾 |
| `Ctrl+A` | 全选 |

### 编辑操作

| 快捷键 | 功能 |
|--------|------|
| `Backspace` | 删除光标前字符 |
| `Delete` | 删除光标后字符 |
| `Ctrl+Backspace` | 删除光标前单词 |
| `Ctrl+Delete` | 删除光标后单词 |
| `Enter` | 换行并保持缩进 |

---

## 安装

### 方式一：通过 Obsidian 社区插件安装（推荐）

1. 打开 **设置 > 社区插件**
2. 关闭"安全模式"
3. 点击"浏览"按钮
4. 搜索"Code Space"
5. 点击"安装"并启用

### 方式二：手动安装

1. 访问 [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest) 下载最新版本
2. 将下载的文件解压到库的插件目录：`.obsidian/plugins/code-space/`
3. 在 Obsidian 设置中重新加载并启用插件

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
│   ├── main.ts           # 插件初始化
│   ├── code_view.ts      # 代码编辑器实现
│   ├── code_embed.ts     # Markdown 嵌入处理器
│   ├── code_dashboard.ts # 文件浏览界面
│   └── settings.ts       # 设置界面
├── styles.css            # 插件样式
├── manifest.json         # 插件元数据
└── package.json
```

---

## 贡献

欢迎通过 Pull Request 贡献代码！

请确保：
1. 代码通过 ESLint 检查
2. 遵循现有代码风格
3. 提交信息清晰明确

如有问题或建议，请使用 [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues)。

---

## 已知限制
- 代码文件内容未被 Obsidian 全局搜索索引
- 未实现查找和替换功能

---
## 致谢

本项目构建于以下优秀项目：
- [Obsidian API](https://github.com/obsidianmd/obsidian-api)
- [CodeMirror 6](https://codemirror.net/)
- [TypeScript](https://www.typescriptlang.org/)

---

## 联系方式

- 作者：unlinearity
- 邮箱：unlinearity@gmail.com
- 问题反馈：[GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues)
- [MIT License](LICENSE) - Copyright (c) 2026 unlinearity
---

**让代码管理在 Obsidian 中变得简单而高效！**
