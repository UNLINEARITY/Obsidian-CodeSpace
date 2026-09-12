# Code Space

<h1 align="center">为 Obsidian 提供专业的代码文件支持</h1>

<p align="center">编辑、嵌入、外部挂载与终端集成</p>

<p align="center"><a href="README.md">English</a> | <a href="README_CN.md">简体中文</a></p>

<p align="center">
  <img src="docs/img/Code.webp" alt="Code Space Preview" width="80%">
</p>

<p align="center">
  <a href="https://github.com/UNLINEARITY/Obsidian-CodeSpace/releases">
    <img alt="Release" src="https://img.shields.io/github/v/release/UNLINEARITY/Obsidian-CodeSpace?label=Release&style=for-the-badge&logo=github&color=0891b2&labelColor=1c1917">
  </a>
  <a href="https://github.com/UNLINEARITY/Obsidian-CodeSpace/stargazers">
    <img alt="Stars" src="https://img.shields.io/github/stars/UNLINEARITY/Obsidian-CodeSpace?label=Stars&style=for-the-badge&logo=github&color=0891b2&labelColor=1c1917">
  </a>
  <a href="https://obsidian.md/plugins?id=code-space">
    <img alt="Downloads" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json&query=%24%5B%27code-space%27%5D.downloads&label=Downloads&style=for-the-badge&logo=obsidian&color=0891b2&labelColor=1c1917&cacheSeconds=21600">
  </a>
  <a href="https://github.com/UNLINEARITY/Obsidian-CodeSpace/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/UNLINEARITY/Obsidian-CodeSpace?label=License&style=for-the-badge&logo=opensourceinitiative&color=0891b2&labelColor=1c1917">
  </a>
</p>

---
## 关于插件
> Code Space 已可在 Obsidian 官方社区插件市场中检索和安装。🎉

Obsidian 原生工作流更偏向 Markdown 笔记，对**代码文件的集中查看、管理、编辑、结构导航和嵌入导出**支持有限。Code Space 插件为解决这一问题而生。

**"Space" 的五层含义：**

1. **管理空间**：为代码文件提供统一索引和管理空间，通过可视化面板浏览所有代码文件
2. **编辑空间**：进入代码文件内部，提供专业的代码查看和编辑环境
3. **嵌入空间**：与 Obsidian 原生功能深度融合，支持代码文件的引用、嵌入式预览和原生 PDF 导出
4. **挂载空间**：通过系统符号链接/目录联接将外部文件夹挂载到 Vault 内，实现跨项目代码管理
5. **终端空间**：在桌面端于编辑器内运行真实系统 shell（PowerShell、zsh、bash）

---

## 核心功能

### 1. 代码文件管理空间
提供可视化仪表盘，用于库内代码文件的统一索引与管理。

- **可视化仪表盘**：提供沉浸式管理界面，支持网格布局与文件状态概览。
- **集成管理工具**：标题区域集成**设置入口**、**文件创建功能**和**忽略项管理**，简化操作路径。
- **多维动态过滤**：支持按文件夹、文件扩展名筛选，按文件名或路径实时搜索，并可按修改日期、名称、类型排序。
- **标准文件操作**：集成重命名、移动、删除、在文件列表中显示、用默认应用打开等 Obsidian 原生支持的文件管理能力。
- **面板状态记忆**：搜索、筛选与排序状态会随设置保存，便于持续管理同一批代码文件。

<p align='center'><img src='docs\img\pre1.png' width=95%></p> 


### 2. 专业代码编辑空间
提供基于 IDE 体验的代码查看与编辑环境。

- **语法高亮**：基于 CodeMirror 6，提供针对多种编程语言的精确高亮显示。
- **结构化导航**：集成代码大纲视图，自动解析类、函数及方法结构并支持点击跳转。
- **高级搜索替换**：提供独立搜索面板，支持正则表达式、大小写敏感、全词匹配、逐项替换和全部替换。
- **手动保存机制**：支持 Ctrl/Cmd+S 手动保存，并具备未保存状态提示与光标位置保护，防止保存时视口跳动。
- **基础编辑辅助**：支持自动缩进、括号补全、代码折叠及行号显示。
- **交互优化**：支持 Ctrl/Cmd+滚轮缩放字体，并提供浮动搜索按钮以快速触达查找功能。

<p align='center'><img src='docs\img\pre22.png' width=95%></p> 

### 3. Obsidian 原生嵌入空间

在 Markdown 中优雅地嵌入和预览代码，允许你在 Markdown 中嵌入指定代码文件的特定片段：

- **文件引用**：使用 `[[文件名]]` 语法链接代码文件
- **代码嵌入**：使用 `![[文件名]]` 在 Markdown 中嵌入预览
- **行号范围**：支持指定起始行或行范围，精确嵌入代码片段
- **快速预览**：悬停在链接上即可预览代码内容
- **多方式打开源文件**：点击嵌入块标题可打开源文件；Ctrl/Cmd+点击在新标签页打开，Ctrl/Cmd+Shift+点击在新窗口打开，Ctrl/Cmd+Alt/Option+点击在分屏中打开
- **预览同步**：源代码文件变更后会重新渲染相关嵌入预览
- **原生 PDF 导出**：直接使用 Obsidian 官方 **Export to PDF**，代码文件引用会导出为真实代码块，同时保留官方版式、分页和导出设置能力
- **宿主兼容性**：阅读模式、弹出窗口，以及复用 Obsidian 渲染链的宿主场景下，代码嵌入预览更加稳定

<p align='center'><img src='docs\img\pre3.png' width=95%></p> 

**支持的嵌入引用语法：**

| 语法 | 说明 |
|------|------|
| `![[test.py]]` | 嵌入整个文件内容 |
| `![[test.py#20]]` | 从第 20 行开始显示到文件末尾 |
| `![[test.py#L20]]` | 同上（GitHub 风格，支持 `L` 前缀） |
| `![[test.py#20-40]]` | 显示第 20 行至第 40 行 |
| `![[test.py#L20-L40]]` | 同上（GitHub 风格） |
| `![[test.py#L20-40]]` | 混合格式也支持 |

**行号范围特性：**
- 范围模式下显示完整指定范围，不受「最大嵌入行数」设置限制
- 若结束行超过文件总行数，自动截断至文件末尾
- 若结束行小于起始行，自动调整为单行显示
- 行号显示与原始文件保持一致

> 导出包含代码引用的 Markdown 文档时，可以直接使用 Obsidian 官方 **Export to PDF**。Code Space 会在导出链路中把代码嵌入展开为真实代码块，而不是灰色文件卡片。

<p align='center'><img src='docs\img\pre8.png' width=90%></p> 

### 4. 外部挂载空间（仅桌面端）

突破 Vault 边界，管理外部项目代码。

- **符号链接/目录联接**：通过设置页创建和管理符号链接（macOS/Linux）或目录联接（Windows），将外部文件夹挂载到 Vault 内
- **无缝集成**：挂载的文件夹中的代码文件会出现在仪表盘，支持完整的 Code Space 功能（编辑、嵌入、大纲等）
- **双向同步**：外部文件的修改会自动同步到 Obsidian，Obsidian 内的编辑也会写回原始位置
- **跨项目协作**：无需将项目代码复制到 Vault，直接管理分布在各处的代码仓库
- **挂载状态管理**：可查看挂载状态，支持移除、重新挂载，并可在 Windows 上选择自动、symlink 或 junction 链接类型

<p align='center'><img src='docs\img\pre7.png' width=95%></p> 

**使用方式**：
1. 打开 **设置 > 社区插件 > Code Space**
2. 在 **外部文件夹（符号链接/目录联接）** 中启用挂载功能
3. 点击 **添加外部文件夹**，选择 Vault 外部的源文件夹，并填写 Vault 内的挂载路径
4. Code Space 会创建链接、保存配置，并自动识别挂载文件夹中的代码文件

**重要提示！**
- **仅桌面端支持**：由于移动端的沙盒限制，外部挂载在 iOS/Android 上不可用
- **安全风险**：外部挂载使插件能够访问 Vault 外的文件系统，请**仅挂载可信目录**
- **路径校验**：源路径必须是 Vault 外部的绝对文件夹路径。Code Space 会拒绝 Vault 自挂载、父子目录循环，以及位于其他符号链接或目录联接下的挂载路径
- **安全移除**：只有链接仍指向已配置的源目录时，Code Space 才会移除挂载。目标被修改或属于用户自行创建的链接会被标记为不匹配，并保持原样
- **权限差异**：Windows 上 symlink 可能需要开发者模式或管理员权限；自动模式会先尝试 symlink，再回退到 junction
- **性能问题**：请不要滥用此功能。你可以管理轻量仓库或进行多仓库联动，但不建议随意挂载过多文件或大型目录
- **路径稳定性**：外部文件夹的移动或重命名会导致挂载失效，需重新配置
- **同步问题**：如果外部文件夹位于云同步目录（如 Dropbox、OneDrive），请确保 Obsidian 和外部文件夹的同步状态一致，避免冲突

### 5. 集成终端（仅桌面端）

在 Code Space 内运行真实系统 shell，由 xterm.js 与 node-pty 驱动。

- **真实 PTY 终端**：交互式程序、颜色、任务控制与分页均与原生终端一致（Windows 使用 ConPTY，macOS/Linux 使用 Unix pty）
- **多页面独立分组**：可同时打开多个终端标签页，每个页面拥有独立的一组终端；组内通过标签栏切换、新建与关闭；关闭页面即关闭该组终端，重新打开为全新一组
- **编辑器内嵌面板**：编辑器底部提供快速终端面板（可拖拽调高），与终端页面互不干扰；支持将面板中正在使用的终端**移交**到新的终端标签页（进程与回溯原样保留）
- **跟随上下文**：新建终端的工作目录默认取当前打开文件所在文件夹（外部挂载会解析到真实磁盘路径），无活动文件时回退到 Vault 根目录
- **主题联动**：配色与等宽字体跟随 Obsidian 主题（含弹出窗口），WebGL 渲染，文字锐利
- **进程退出提示**：shell 退出时显示「进程已退出」提示行，标签置灰，仍可查看回溯

**使用方式：**
1. 在 **设置 > Code Space > 终端** 中开启开关（默认关闭）
2. 点击「支持文件」旁的 **下载**，Code Space 会下载一个较小的平台支持包（见下方说明），就绪后细项设置与相关命令才会出现
3. 通过命令面板 **Code Space: 打开终端** 新开终端标签页，或在代码文件中点击编辑器头部的终端按钮打开内嵌面板
4. 页面内通过 **+** 新建终端、点击标签切换、**×** 关闭单个终端；**Code Space: 关闭所有终端会话** 一键全部关闭

**重要提示！**
- **仅桌面端**：终端在 iOS/Android 上不可用
- **显式下载**：真正的 PTY 需要原生辅助程序（`node-pty`）。Obsidian 插件商店只分发 JavaScript，因此辅助程序仅在你点击设置中的 **下载** 时获取：从本仓库 GitHub releases 下载对应平台的预编译包（约 1-3 MB），经 SHA-256 校验后存放在插件目录。终端命令与按钮自身绝不会触发下载
- **支持平台**：Windows x64/ARM64、macOS x64/ARM64、Linux x64；其他 Linux 架构暂不支持
- **Linux 依赖**：Linux 上安装支持包需要 `unzip` 工具（多数发行版已预装）
- **shell 检测**：Windows 依次检测 PowerShell（`pwsh.exe` → `powershell.exe` → `cmd.exe`）；macOS 为 `$SHELL` → `zsh`；Linux 为 `$SHELL` → `bash`。可在 **设置 > 终端** 指定可执行文件
- **键盘焦点**：终端聚焦时按键（含 Ctrl/Cmd 组合）会发送给 shell（与 VS Code 一致），点击编辑器即可交还焦点
- **安全**：终端以你的用户权限运行，可访问 Vault 外的文件，请谨慎执行粘贴的命令
- **移除与更新**：在设置中可随时移除已下载的支持文件；若文件被当前会话占用，未锁定部分立即删除，剩余文件将在 Obsidian 重启后自动完成移除

---
## 配置选项

通过 **设置 > 社区插件 > Code Space** 访问配置：

- **管理的文件后缀**：指定需要 Code Space 管理的文件扩展名（英文逗号分隔），修改后会刷新文件关联
- **显示行号**：是否显示行号（默认：开启）
- **编辑器字体大小**：代码编辑界面的字体大小（默认：18px，可设置 9-36px）
- **引用块字体大小**：Markdown 嵌入式代码块的字体大小（默认：15px，可设置 9-36px）
- **最大嵌入行数**：嵌入预览显示的最大行数（默认：20，0 表示无限制）
- **新代码文件存放位置**：创建新代码文件时，可使用指定文件夹，或使用当前正在编辑的文件所在文件夹
- **外部文件夹（仅桌面端）**：通过系统符号链接/目录联接将外部文件夹挂载到 Vault 内，可启用/禁用、添加、移除、重新挂载并查看状态。
- **终端（仅桌面端）**：启用集成终端（默认关闭，开启后显示终端按钮与相关命令）、下载/移除支持文件、指定 shell 可执行文件（留空自动检测）、设置字体大小、回溯行数与最大会话数。

注意：外部挂载会使插件访问 Vault 外的文件，请仅挂载可信目录。

## 支持的语言（可以任意扩展）

### 1. 默认支持的扩展名

| 语言 | 扩展名 |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.json` |
| Web 技术 | `.html`, `.htm`, `.xhtml`, `.css`, `.scss`, `.sass`, `.less` |
| 系统编程 | `.rs`, `.go`, `.java`, `.cs` |
| 数据/配置 | `.sql`, `.yaml`, `.yml`, `.xml` |
| 脚本 | `.php`, `.r`, `.rb`, `.sh` |

**更多语言可通过插件设置添加，插件支持任意后缀的文件管理！**
- 如果是文本/代码文件，会通过 Code Space 的代码界面打开
- 如果是二进制文件（例如图片或 PDF），会调用 Obsidian 原生查看器打开，你也可以用它集中管理 PDF 等附件

<p align='center'><img src='docs\img\pre4.png' width=98%></p> 

### 2. 可通过设置补充添加的文本/代码扩展名（同样支持语法高亮）

在 **设置 > Code Space > 管理的文件后缀** 中添加以下扩展名即可启用：

| 语言 | 扩展名 | 复用的高亮器 |
|------|--------|-------------|
| **XML 家族** | `.xsd`, `.xsl`, `.xslt`, `.wsdl`, `.plist`, `.csproj`, `.vcxproj`, `.props`, `.targets`, `.config` | XML |
| | `.urdf`, `.xacro` | XML |
| **C/C++ 家族** | `.ino`, `.pde`, `.nut` | C/C++ |
| | `.cu`, `.cuh`, `.glsl`, `.vert`, `.frag`, `.hlsl`, `.mm`, `.swift` | C/C++ |
| **Java 家族** | `.kt`, `.kts`, `.scala`, `.groovy`, `.gradle` | Java |
| **前端框架** | `.vue`, `.svelte`, `.astro` | JavaScript |
| **JSON 变体** | `.json5`, `.jsonc` | JavaScript |
| **Python 家族** | `.pyx`, `.pxd`, `.pxi`, `.ipy` | Python |
| **配置文件** | `.toml`, `.ini`, `.cfg`, `.conf` | YAML |
| **Shell 脚本** | `.bash`, `.zsh` | Shell |
| **PowerShell** | `.ps1`, `.psm1`, `.psd1` | PowerShell |
| **Fortran** | `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08` | 专用 |
| **其他语言** | `.cmake`, `.dockerfile`, `.diff`, `.patch`, `.lua`, `.pl`, `.pm`, `.erb`, `.m` | 专用 |

### 3. 二进制文件支持（Obsidian 原生打开）

如果把以下后缀加入管理列表，这些文件同样可以在 Code Space 的仪表盘进行管理（重命名、移动、删除等操作）。它们不会被 Code Space 编辑器打开，而是使用 Obsidian 原生查看器或系统默认应用打开。

| 类型 | 扩展名 |
|------|--------|
| 图片 | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.psd` |
| 文档 | `.pdf` |
| 音频 | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma` |
| 视频 | `.mp4`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v` |
| 压缩文件 | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz` |
| Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| 其他 | `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.dat` |

--- 

## 支持的快捷键

### 插件命令

<p align='center'><img src='docs\img\pre5.png' width=98%></p> 

| 命令路径 | 功能 |
|---------|------|
| `Ctrl+P` → "打开主面板 (Dashboard)" | 打开代码管理面板 |
| `Ctrl+P` → "创建代码文件" | 创建新代码文件 |
| `Ctrl+P` → "重载插件" | 重新加载插件 |
| `Ctrl+P` → "切换大纲视图 (Outline)" | 开关代码大纲视图 |
| `Ctrl+P` → "搜索与替换" | 在当前 Code Space 编辑器中打开搜索与替换面板 |
| `Ctrl+P` → "打开终端" | 新开一个终端标签页（启用终端并下载支持文件后可用） |
| `Ctrl+P` → "切换终端面板" | 开关当前编辑器中的内嵌终端面板 |
| `Ctrl+P` → "关闭所有终端会话" | 关闭全部终端 |

---

### 基础操作

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd+S` | 手动保存文件 |
| `Ctrl/Cmd+鼠标滚轮` | 调整字体大小（终端内：仅当前聚焦的终端） |
| `Ctrl/Cmd+F` | 搜索 |
| `Ctrl+H` / `Cmd+Option+F` | 替换 |
| `Ctrl/Cmd+C` | 复制选中内容 |
| `Ctrl/Cmd+X` | 剪切选中内容 |
| `Ctrl/Cmd+V` | 粘贴内容 |
| `Ctrl/Cmd+A` | 全选 |
| `Ctrl/Cmd+Z` | 撤销 |
| `Ctrl+Y` 或 `Ctrl/Cmd+Shift+Z` | 重做 |
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

### 方式一：通过 Obsidian 社区插件市场安装（推荐）

Code Space 已可在 Obsidian 官方社区插件市场中检索和安装。

1. 打开 **设置 > 社区插件**
2. 如 Obsidian 提示，请关闭 **受限模式**
3. 点击 **浏览** 按钮
4. 搜索 **Code Space**
5. 点击 **安装** 并启用

### 方式二：手动安装

1. 访问 [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest) 
2. 下载 `main.js`、`manifest.json`、`styles.css`，放置在你的 Obsidian 库插件目录：`.obsidian/plugins/code-space/`，如果 `code-space` 文件夹不存在请手动创建
3. 在 Obsidian 设置中重新加载并启用插件

### 方式三：BRAT 下载

如果需要测试开发版或预发布版本，可以使用 BRAT。先安装 BRAT 插件，在设置中添加 Beta 插件时，填写本仓库地址：`https://github.com/UNLINEARITY/Obsidian-CodeSpace`，选择最新版本。普通用户优先使用社区插件市场版本。

<p align='center'><img src='docs\img\pre6.png' width=85%></p> 

---

## 开发

### 构建要求

- Node.js 18 或更高版本（推荐当前 LTS）
- npm

### 构建命令

```bash
npm install          # 安装依赖
npm run dev          # 开发构建（文件监视）
npm run build        # 生产构建
npm test             # 运行单元测试
npm run lint         # 运行 ESLint
npm run dev:copy     # 将构建产物复制到本地 Vault
```

`npm run dev:copy` 默认使用 `C:\Nonlinear\ob` 和 `.obsidian`。如 Vault 路径或配置目录不同，请设置 `OBSIDIAN_VAULT_PATH` 或 `OBSIDIAN_CONFIG_DIR`。

### 发布工作流

更新 `package.json` 中的版本，运行验证流水线，并推送类似 `2.4.0` 的 SemVer 标签。GitHub Actions 会校验标签、构建发布资产、生成 provenance attestation，并将 `main.js`、`manifest.json` 和 `styles.css` 发布到 GitHub Release。

### 项目结构

```
obsidian-codespace/
├── src/
│   ├── main.ts                # 插件入口：命令注册、视图挂载、生命周期管理
│   ├── code_view.ts           # 编辑器核心：CodeMirror 6 编辑环境
│   ├── dashboard_view.ts      # 面板视图：文件索引与管理界面
│   ├── outline_view.ts        # 大纲视图：侧边栏结构化导航
│   ├── code_parser.ts         # 语法解析：多语言结构分析
│   ├── code_embed.ts          # 嵌入处理：引用与预览逻辑
│   ├── code_embed_markdown.ts # 代码引用展开：供原生 PDF 导出等场景复用
│   ├── scrollbar_visibility.ts # 编辑器与嵌入的滚动条显示状态
│   ├── native_pdf_export_patch.ts # 原生 Export to PDF 接管与导出链 patch
│   ├── dropdown.ts            # UI 组件：下拉/多选
│   ├── folder_filter_modal.ts # 文件夹筛选弹窗
│   ├── ignore_manager_modal.ts # 忽略文件/文件夹管理弹窗
│   ├── external_mount.ts      # 外部挂载：symlink/junction 管理
│   ├── settings.ts            # 设置面板：插件配置
│   ├── terminal/              # 集成终端（仅桌面端）
│   │   ├── types.ts           # 终端共享类型与本地 pty 接口
│   │   ├── node_access.ts     # 运行时 window.require 访问 Node API
│   │   ├── binary_manager.ts  # node-pty 预编译包下载/校验/解压
│   │   ├── conout_patch.ts    # Windows ConPTY 渲染进程补丁
│   │   ├── pty_host.ts        # PtyProcess 封装：加载/生成/终止
│   │   ├── shell_detector.ts  # 平台默认 shell 检测
│   │   ├── terminal_theme.ts  # Obsidian 主题变量到 xterm 主题映射
│   │   ├── terminal_component.ts # xterm.js 封装：挂载/自适应/WebGL
│   │   ├── session_manager.ts # TerminalManager/TerminalGroup 会话架构
│   │   ├── terminal_panel.ts  # 共用标签栏面板（内嵌 + 视图宿主）
│   │   └── terminal_view.ts   # 独立终端视图
│   └── lang/
│       ├── helpers.ts         # 本地化工具
│       └── locale/
│           ├── en.ts          # 英文文案
│           └── zh-cn.ts       # 中文文案
├── styles.css                 # 样式入口
├── manifest.json              # 插件元数据
└── package.json               # 依赖与脚本
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
- 代码文件内容目前不被 Obsidian 的全局搜索引擎索引；在 Code Space 编辑器内可以使用搜索与替换面板处理当前文件。
- 集成终端为桌面端专属功能；Windows ARM64 的支持包由 CI 构建，如遇下载失败请提交 Issue 反馈。

---
## 致谢

本项目构建于以下优秀项目之上：
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): 提供强大的插件扩展能力。
- [CodeMirror 6](https://codemirror.net/): 灵活且现代的代码编辑器引擎。
- [Lezer](https://lezer.codemirror.net/): 高效的增量式代码解析系统。
- [xterm.js](https://github.com/xtermjs/xterm.js/): 集成终端的前端。
- [node-pty](https://github.com/microsoft/node-pty): 微软出品的伪终端后端；其在 Obsidian 内的 Windows 补丁改编自 [lean-obsidian-terminal](https://github.com/sdkasper/lean-obsidian-terminal)。
- [TypeScript](https://www.typescriptlang.org/): 提供稳健的类型安全保障。
- [esbuild](https://esbuild.github.io/): 极速的 JavaScript 打包工具。

---

## Star history

<!-- star-history:start -->
[![Star History](https://raw.githubusercontent.com/UNLINEARITY/Obsidian-CodeSpace/main/assets/star-history/star-history.png)](https://star-history.com/#UNLINEARITY/Obsidian-CodeSpace&Date)
<!-- star-history:end -->

---

**让代码管理在 Obsidian 中变得简单而高效！**
