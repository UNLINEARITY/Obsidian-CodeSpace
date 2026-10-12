# Code Space

<h1 align="center">Obsidian のためのプロフェッショナルなコードファイル支援</h1>

<p align="center">編集・埋め込み・外部マウント・ターミナル統合。</p>

<p align="center"><a href="README.md">English</a> | <a href="README_CN.md">简体中文</a> | 日本語 | <a href="README_KO.md">한국어</a> | <a href="README_DE.md">Deutsch</a> | <a href="README_ES.md">Español</a> | <a href="README_PTBR.md">Português (Brasil)</a></p>

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

## プラグインについて

> Code Space は Obsidian 公式コミュニティプラグインディレクトリで公開されています。🎉

Obsidian のネイティブワークフローは Markdown ノートを中心としているため、コードファイルの一元的な閲覧・管理・編集、構造ナビゲーション、埋め込みコードのエクスポートへの対応は限定的です。Code Space はその空白を埋めるために生まれました。

**「Space」の 5 つのレイヤー:**

1. **管理スペース**: コードファイルのための統一インデックスと管理領域を提供し、ビジュアルダッシュボードでコードファイルを閲覧できます。
2. **編集スペース**: コードファイルを閲覧・編集するための専用環境で開きます。
3. **埋め込みスペース**: Obsidian のネイティブ機能と連携し、参照・埋め込みコードプレビュー・ネイティブ PDF エクスポートを本物のコードブロックとしてサポートします。
4. **マウントスペース**: システムのシンボリックリンク/ジャンクション経由で外部フォルダをボールトにマウントし、プロジェクト横断的なコード管理を実現します。
5. **ターミナルスペース**: デスクトップでエディタ内に本物のシステムシェル（PowerShell、zsh、bash）を動かします。

<p align='center'><img src='docs\img\pre0.png' width=95%></p>

---

## 主な機能

### 1. コードファイル管理スペース
ボールト内のコードファイルを統一的に索引付け・管理するビジュアルダッシュボードを提供します。

- **ビジュアルダッシュボード**: グリッドレイアウトとファイル状態の概覧を持つ管理インターフェース。
- **統合管理ツール**: ヘッダーから**設定**、**ファイル作成**、無視アイテム管理にすばやくアクセス。
- **多次元動的フィルタ**: フォルダと拡張子で絞り込み、ファイル名やパスで検索、更新日時・名前・種類で並べ替え。
- **標準的なファイル操作**: 名前変更、移動、削除、ナビゲーションで表示、既定アプリで開くなど Obsidian 対応の操作が使えます。
- **ダッシュボード状態の記憶**: 検索・フィルタ・並べ替えの状態はプラグイン設定とともに保存され、繰り返しの利用がよりスムーズに。

<p align='center'><img src='docs\img\pre1.png' width=95%></p>


### 2. プロフェッショナルなコード編集スペース
IDE のようなコード閲覧・編集環境を提供します。

- **シンタックスハイライト**: CodeMirror 6 駆動。多くの言語を正確にハイライト。
- **構造ナビゲーション**: クラス・関数・メソッドを解析するコードアウトラインビュー。クリックでジャンプ。
- **高度な検索と置換**: 正規表現、大文字小文字区別、単語全体一致、単一置換、全置換に対応した専用検索パネル。
- **手動保存**: Ctrl/Cmd+S の手動保存。未保存状態のフィードバックと、ビューポートのジャンプを防ぐカーソル位置保護を備えます。
- **基本編集支援**: 自動インデント、括弧の対応、コード折りたたみ、行番号。
- **操作の最適化**: Ctrl/Cmd+ホイールでフォントサイズ調整、クイックアクセスのフローティング検索ボタン。

<p align='center'><img src='docs\img\pre22.png' width=95%></p>

### 3. Obsidian ネイティブ埋め込みスペース

Markdown 内にコードを埋め込んでプレビューできます。コードファイルの特定の断片も含みます:

- **ファイル参照**: `[[ファイル名]]` でコードファイルにリンク。
- **コード埋め込み**: `![[ファイル名]]` で Markdown にプレビューを埋め込み。
- **行範囲**: 開始行や行範囲を指定して、コード断片を正確に埋め込み。
- **クイックプレビュー**: リンクにホバーするとコード内容をプレビュー。
- **複数の方法でソースを開く**: 埋め込みヘッダーのクリックでソースファイルを開く。Ctrl/Cmd+クリックで新規タブ、Ctrl/Cmd+Shift+クリックで新規ウィンドウ、Ctrl/Cmd+Alt/Option+クリックで分割ペインで開きます。
- **プレビュー同期**: ソースコードファイルが変わると、関連する埋め込みプレビューが再レンダリングされます。
- **ネイティブ PDF エクスポート**: Obsidian 公式の**PDF にエクスポート**を使うと、コードファイル参照はグレーのファイルカードではなく本物のコードブロックとして出力されます。
- **より広いホスト互換性**: 埋め込みコードプレビューは、閲覧モードやポップアウトウィンドウなど Obsidian の Markdown レンダリングパイプラインを再利用するホストでも、より安定して動作します。

<p align='center'><img src='docs\img\pre3.png' width=95%></p>

**対応する埋め込み構文:**

| 構文 | 説明 |
|--------|-------------|
| `![[test.py]]` | ファイル全体を埋め込み |
| `![[test.py#20]]` | 20 行目からファイル終端まで表示 |
| `![[test.py#L20]]` | 上と同じ（`L` プレフィックスの GitHub スタイル） |
| `![[test.py#20-40]]` | 20 行目から 40 行目まで表示 |
| `![[test.py#L20-L40]]` | 上と同じ（GitHub スタイル） |
| `![[test.py#L20-40]]` | 混合フォーマットも対応 |

**行範囲の動作:**
- 範囲モードでは「埋め込みの最大行数」設定を無視して指定範囲全体を表示します
- 終端行がファイル長を超える場合、ファイル終端で自動的に打ち切ります
- 終端行が開始行より小さい場合、単一行表示に自動調整します
- 行番号は元のファイルと一致します

ヒント: ノートにコードファイルの埋め込みが含まれる場合、Obsidian 公式の**PDF にエクスポート**で出力してください。Code Space はそれらの埋め込みを最終 PDF 内で本物のコードブロックとして保持し、Obsidian ネイティブのレイアウトと改ページも維持します。

<p align='center'><img src='docs\img\pre8.png' width=90%></p>

### 4. 外部マウントスペース（デスクトップのみ）

ボールトの境界を越えて外部プロジェクトのコードを管理します。

- **シンボリックリンク/ジャンクション**: 設定ページからシンボリックリンク（macOS/Linux）またはディレクトリジャンクション（Windows）を作成・管理し、外部フォルダをボールトにマウント
- **統合ワークフロー**: マウントされたフォルダ内のコードファイルはダッシュボードに表示され、編集・埋め込み・アウトラインナビゲーションなどの Code Space 機能が使えます
- **双方向同期**: Obsidian からの編集も外部フォルダからの編集も、同じ実ファイルに反映されます
- **プロジェクト横断**: プロジェクトコードをボールトにコピーせず、分散したコードリポジトリを直接管理
- **マウント状態管理**: マウント状態の確認、削除・再リンク、Windows での auto/symlink/junction モード選択

<p align='center'><img src='docs\img\pre7.png' width=98%></p>

**使い方:**
1. **設定 > コミュニティプラグイン > Code Space** を開く
2. **外部フォルダ**を有効化
3. **外部フォルダを追加**をクリックし、ボールト外のソースフォルダを選んで、ボールト内のマウント先を設定
4. Code Space がリンクを作成し、設定を保存して、マウントフォルダ内のコードファイルを索引付けします

**重要な注意事項!**
- **デスクトップ限定**: サンドボックス制約のため、外部マウントは iOS/Android では利用できません
- **セキュリティリスク**: 外部マウントにより、プラグインはボールト外のファイルへアクセスします。**信頼するフォルダのみマウントしてください**
- **パス検証**: ソースはボールト外の絶対フォルダである必要があります。ボールト自身のマウント、親子の循環、他のシンボリックリンク/ジャンクション配下へのマウントパスは拒否されます
- **安全な削除**: Code Space はリンクが設定されたソースを指している場合のみマウントを削除します。変更されたリンクやユーザー作成のリンクはターゲット不一致として報告され、そのまま残されます
- **権限の違い**: Windows ではシンボリックリンクに開発者モードまたは管理者権限が必要な場合があります。自動モードはまずシンボリックリンクを試し、失敗するとジャンクションにフォールバックします
- **パフォーマンス**: 軽量なリポジトリやマルチリポジトリの連携には使えますが、大量のファイルや非常に大きなディレクトリのマウントは避けてください
- **パスの安定性**: 外部フォルダの移動や名前変更でマウントは壊れ、再設定が必要になります
- **同期の問題**: 外部フォルダがクラウド同期ディレクトリ（Dropbox、OneDrive など）にある場合、競合を避けるために Obsidian と外部フォルダの同期状態を確認してください。また、一部のクラウドサービスはボールト内のシンボリックリンクをたどってマウントフォルダ全体をクラウドにアップロードすることがあります。不要な場合は、その同期サービスからマウントフォルダを除外してください

### 5. 統合ターミナル（デスクトップのみ）

Code Space 内で本物のシステムシェルを動かします。xterm.js と node-pty による実装です。

- **本物の PTY ターミナル**: インタラクティブプログラム、色、ジョブ制御、ページャがネイティブターミナル同様に動作（Windows は ConPTY、macOS/Linux は Unix pty）
- **2 つのホスト、1 セットのセッション**: コードエディタ下部の埋め込みパネル、またはメインエリアの独立ターミナルタブ。パネルやビューを閉じてもセッションは動き続けます
- **マルチタブセッション**: タブバーからセッションを作成・切替・終了。終了したセッションはマーク付きで閉じるまで読めます
- **コンテキスト追従**: 新しいターミナルは現在開いているファイルのフォルダで起動（外部マウントは実ディスク上の場所に解決）、フォールバックはボールトルート
- **テーマ追従**: 色と等幅フォントは Obsidian テーマに追従。ポップアウトウィンドウも含みます
- **リサイズ可能なパネル**: 埋め込みパネル上部のグリップをドラッグして高さを調整

**使い方:**
1. **設定 > Code Space > ターミナル** でターミナルを有効化（既定では無効）
2. 「サポートファイル」の横の**ダウンロード**を選択 — Code Space が小さなプラットフォームパッケージをダウンロードします（下記の注意を参照）。準備ができてからヘッダーボタン、コマンド、残りの設定が現れます
3. コードファイルを開いてエディタヘッダーのターミナルボタンを選ぶか、**Code Space: ターミナルパネルを切り替え**を実行
4. または **Code Space: ターミナルを開く** で独立したターミナルタブを開く（各タブが 1 つの全画面ターミナル）
5. ターミナルタブを閉じるとそのターミナルが停止します。すべて止めるには **Code Space: すべてのターミナルセッションを閉じる** を実行

**重要な注意事項!**
- **デスクトップ限定**: ターミナルは iOS/Android では利用できません
- **明示的ダウンロード**: 本物の PTY にはネイティブヘルパー（`node-pty`）が必要です。Obsidian のプラグインストアは JavaScript のみ配布するため、ヘルパーは**設定 > ターミナル**の**ダウンロード**を選んだときにだけダウンロードされます: このリポジトリの GitHub リリースからプラットフォーム向けビルド済みパッケージ（約 1-3 MB）を取得し、SHA-256 チェックサムで検証してプラグインフォルダ配下に保存します。ターミナルのコマンドやボタンが単体で何かをダウンロードすることはありません
- **対応プラットフォーム**: Windows x64/ARM64、macOS x64/ARM64、Linux x64。その他の Linux アーキテクチャは未対応です
- **Linux の要件**: Linux でサポートパッケージをインストールするには `unzip` ユーティリティが必要です（ほとんどのディストリビューションにプレインストール）
- **シェル検出**: Windows は PowerShell（`pwsh.exe` → `powershell.exe` → `cmd.exe`）、macOS は `$SHELL` → `zsh`、Linux は `$SHELL` → `bash`。**設定 > ターミナル**で明示的に指定できます
- **キーボードフォーカス**: ターミナルにフォーカスがある間、キー（Ctrl/Cmd 組み合わせを含む）は VS Code と同様にシェルへ渡されます。エディタを選択するとキーが戻ります
- **セキュリティ**: ターミナルはユーザー権限で動き、ボールト外のファイルにもアクセスできます。貼り付けたコマンドは通常のシステムターミナルと同じ注意で扱ってください

---
## 設定

**設定 > コミュニティプラグイン > Code Space** から設定にアクセスします:

- **管理する拡張子**: Code Space が管理するファイル拡張子を指定（カンマ区切り）。変更すると管理対象のファイル関連付けが更新されます。
- **行番号を表示**: 行番号の切り替え（既定: オン）
- **エディタのフォントサイズ**: コードエディタのフォントサイズ（既定: 18px、範囲: 9-36px）
- **埋め込みのフォントサイズ**: Markdown 埋め込みコードブロックのフォントサイズ（既定: 15px、範囲: 9-36px）
- **埋め込みの最大行数**: 埋め込みプレビューに表示する最大行数（既定: 20、0 で無制限）
- **新規コードファイルの作成先**: カスタムフォルダまたは現在アクティブなファイルのフォルダに作成
- **外部フォルダ（デスクトップのみ）**: システムのシンボリックリンク/ジャンクションで外部フォルダをボールトにマウント。機能の有効化/無効化、追加・削除・再リンク・状態確認ができます。
- **ターミナル（デスクトップのみ）**: 統合ターミナルを有効化（既定では無効。有効化するとターミナルボタンとコマンドが表示）、シェルの実行ファイルを選択（空欄で自動検出）、フォントサイズ・スクロールバック・最大同時セッション数を設定、ダウンロード済みサポートファイルの管理（再ダウンロード/削除）。

注: 外部マウントはボールト外のファイルへのアクセスを許可します。信頼するフォルダのみマウントしてください。

## 対応言語（拡張可能）

### 1. 既定で対応する拡張子

| 言語 | 拡張子 |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.json` |
| Web 技術 | `.html`, `.htm`, `.xhtml`, `.css`, `.scss`, `.sass`, `.less` |
| システムプログラミング | `.rs`, `.go`, `.java`, `.cs` |
| データ/設定 | `.sql`, `.yaml`, `.yml`, `.xml` |
| スクリプト | `.php`, `.r`, `.rb`, `.sh` |

**プラグイン設定で拡張子を追加できます。Code Space はカスタム拡張子のファイルも管理できます。**
- テキスト・コードファイルは Code Space エディタで開きます
- バイナリファイル（画像や PDF など）は Obsidian のネイティブビューアまたはシステム既定アプリで開きます。ダッシュボードで PDF などの添付ファイルを管理することもできます

<p align='center'><img src='docs\img\pre4.png' width=95%></p>

### 2. シンタックスハイライト付きの追加テキスト/コード拡張子

**設定 > Code Space > 管理する拡張子**に以下の拡張子を追加すると有効になります:

| 言語 | 拡張子 | 再利用するハイライト |
|------|--------|-------------|
| **XML 系** | `.xsd`, `.xsl`, `.xslt`, `.wsdl`, `.plist`, `.csproj`, `.vcxproj`, `.props`, `.targets`, `.config` | XML |
| | `.urdf`, `.xacro` | XML |
| **C/C++ 系** | `.ino`, `.pde`, `.nut` | C/C++ |
| | `.cu`, `.cuh`, `.glsl`, `.vert`, `.frag`, `.hlsl`, `.mm`, `.swift` | C/C++ |
| **Java 系** | `.kt`, `.kts`, `.scala`, `.groovy`, `.gradle` | Java |
| **フロントエンドフレームワーク** | `.vue`, `.svelte`, `.astro` | JavaScript |
| **JSON 系** | `.json5`, `.jsonc` | JavaScript |
| **Python 系** | `.pyx`, `.pxd`, `.pxi`, `.ipy` | Python |
| **設定ファイル** | `.toml`, `.ini`, `.cfg`, `.conf` | YAML |
| **シェルスクリプト** | `.bash`, `.zsh` | Shell |
| **PowerShell** | `.ps1`, `.psm1`, `.psd1` | PowerShell |
| **Fortran** | `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08` | 専用 |
| **その他の言語** | `.cmake`, `.dockerfile`, `.diff`, `.patch`, `.lua`, `.pl`, `.pm`, `.erb`, `.m` | 専用 |

### 3. バイナリファイル対応（Obsidian ネイティブビューアで開く）

以下の拡張子を管理リストに追加すると、これらのファイルも Code Space ダッシュボードで管理できます（名前変更、移動、削除など）。Code Space エディタでは開かず、Obsidian のネイティブビューアまたはシステム既定アプリを使います。

| 種類 | 拡張子 |
|------|--------|
| 画像 | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.psd` |
| ドキュメント | `.pdf` |
| 音声 | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma` |
| 動画 | `.mp4`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v` |
| アーカイブ | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz` |
| Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| その他 | `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.dat` |

---

## 対応キーボードショートカット

### 1. プラグインコマンド

<p align='center'><img src='docs\img\pre5.png' width=98%></p>

| コマンドパス | 機能 |
|---------|------|
| `Ctrl+P` → 「ダッシュボードを開く」 | コード管理パネルを開く |
| `Ctrl+P` → 「コードファイルを作成」 | 新しいコードファイルを作成 |
| `Ctrl+P` → 「プラグインを再読み込み」 | プラグインを再読み込み |
| `Ctrl+P` → 「コードアウトラインを切り替え」 | コードアウトラインビューを切り替え |
| `Ctrl+P` → 「検索と置換」 | 現在の Code Space エディタで検索・置換パネルを開く |
| `Ctrl+P` → 「ターミナルを開く」 | 新しいターミナルタブを開く（ターミナル有効化とサポートファイルのダウンロード後に利用可） |
| `Ctrl+P` → 「ターミナルパネルを切り替え」 | 現在のエディタの埋め込みターミナルパネルを切り替え |
| `Ctrl+P` → 「すべてのターミナルセッションを閉じる」 | すべてのターミナルを停止 |

---

### 2. 基本操作

| ショートカット | 機能 |
|--------|------|
| `Ctrl/Cmd+S` | ファイルを手動保存 |
| `Ctrl/Cmd+マウスホイール` | フォントサイズ調整（ターミナル内: フォーカスされたターミナルのみ） |
| `Ctrl/Cmd+F` | 検索 |
| `Ctrl+H` / `Cmd+Option+F` | 置換 |
| `Ctrl/Cmd+C` | 選択範囲をコピー |
| `Ctrl/Cmd+X` | 選択範囲を切り取り |
| `Ctrl/Cmd+V` | 内容を貼り付け |
| `Ctrl/Cmd+A` | すべて選択 |
| `Ctrl/Cmd+Z` | 元に戻す |
| `Ctrl+Y` または `Ctrl/Cmd+Shift+Z` | やり直す |
| `Tab` | インデントを増やす |
| `Shift+Tab` | インデントを減らす |
| `Enter`           | 改行してインデントを保持 |



| カーソル移動            |          | 選択と編集              |         |
| --------------- | -------- | ----------------- | ------- |
| `↑` `↓` `←` `→` | カーソルを上下左右に移動 | `Shift+矢印キー`       | 選択範囲を拡張    |
| `Home`          | 行頭へジャンプ    | `Ctrl+Shift+←`    | 単語の先頭まで選択 |
| `End`           | 行末へジャンプ    | `Ctrl+Shift+→`    | 単語の末尾まで選択 |
| `Ctrl+←`        | 左に 1 単語移動 | `Ctrl+Shift+Home` | ファイルの先頭まで選択 |
| `Ctrl+→`        | 右に 1 単語移動 | `Ctrl+Shift+End`  | ファイルの末尾まで選択 |
| `Ctrl+Home`     | ファイルの先頭へジャンプ  | `Backspace`       | カーソル前の文字を削除 |
| `Ctrl+End`      | ファイルの末尾へジャンプ  | `Delete`          | カーソル後の文字を削除 |
| `Page Up`       | 1 ページ上へ     | `Ctrl+Backspace`  | カーソル前の単語を削除 |
| `Page Down`       | 1 ページ下へ     | `Ctrl+Delete`     | カーソル後の単語を削除 |


---

## インストール

### 方法 1: Obsidian コミュニティプラグインからインストール（推奨）

Code Space は Obsidian 公式コミュニティプラグインディレクトリで公開されています。

1. **設定 > コミュニティプラグイン**を開く。
2. 要求されたら**制限モード**をオフにする。
3. **ブラウズ**をクリック。
4. 「Code Space」を検索。
5. **インストール**をクリックしてプラグインを有効化。

### 方法 2: 手動インストール

1. [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest) を開く。
2. `main.js`、`manifest.json`、`styles.css` をダウンロードし、ボールトのプラグインディレクトリ `.obsidian/plugins/code-space/` に置く。`code-space` フォルダがなければ手動で作成してください。
3. Obsidian の設定で再読み込みしてプラグインを有効化。

### 方法 3: BRAT

開発版やプレリリース版を試したい場合のみ BRAT を使ってください。まず BRAT プラグインをインストールし、このリポジトリをベータプラグインとして追加します: `https://github.com/UNLINEARITY/Obsidian-CodeSpace`。そして最新バージョンを選択します。ほとんどのユーザーはコミュニティプラグイン版のインストールを推奨します。

<p align='center'><img src='docs\img\pre6.png' width=90%></p>

---

## 開発

### ビルド要件

- Node.js 18 以降（現在の LTS を推奨）
- npm

### ビルドコマンド

```bash
npm install          # 依存関係をインストール
npm run dev          # 開発ビルド（ファイル監視）
npm run build        # 本番ビルド
npm test             # ユニットテストを実行
npm run lint         # ESLint を実行
npm run dev:copy     # ビルド成果物をローカルボールトへコピー
```

`npm run dev:copy` は既定で `C:\Nonlinear\ob` と `.obsidian` を使います。ボールトが異なるパスの場合は `OBSIDIAN_VAULT_PATH` または `OBSIDIAN_CONFIG_DIR` を設定してください。

### リリースワークフロー

`package.json` のバージョンを更新し、検証パイプラインを実行して、`2.4.0` のような SemVer タグを push します。GitHub Actions がタグを検証し、リリース成果物をビルドし、来歴アテステーションを作成し、`main.js`、`manifest.json`、`styles.css` を GitHub リリースに公開します。

### プロジェクト構造

```
obsidian-codespace/
├── src/
│   ├── main.ts                # プラグインエントリ: コマンド登録、ビューのマウント、ライフサイクル管理
│   ├── code_view.ts           # エディタコア: CodeMirror 6 編集環境
│   ├── dashboard_view.ts      # ダッシュボードビュー: ファイル索引付けと管理 UI
│   ├── outline_view.ts        # アウトラインビュー: サイドバーの構造ナビゲーション
│   ├── code_parser.ts         # 構文パーサ: 多言語の構造解析
│   ├── code_embed.ts          # 埋め込み処理: 参照とプレビューのロジック
│   ├── code_embed_markdown.ts # ネイティブ PDF エクスポート等向けのコード埋め込み展開
│   ├── scrollbar_visibility.ts # エディタと埋め込みのスクロールバー可視状態
│   ├── native_pdf_export_patch.ts # ネイティブ PDF エクスポート統合とエクスポートチェーンのパッチ
│   ├── dropdown.ts            # UI コンポーネント: ドロップダウン/複数選択
│   ├── folder_filter_modal.ts # フォルダフィルタモーダル
│   ├── ignore_manager_modal.ts # 無視ファイル/フォルダ管理モーダル
│   ├── external_mount.ts      # 外部マウント: symlink/junction 管理
│   ├── settings.ts            # 設定パネル: プラグイン設定
│   ├── terminal/              # 統合ターミナル（デスクトップのみ）
│   │   ├── types.ts           # ターミナル共通型とローカル pty インターフェース
│   │   ├── node_access.ts     # window.require 経由の Node API アクセス
│   │   ├── binary_manager.ts  # node-pty プリビルドのダウンロード/検証/展開
│   │   ├── conout_patch.ts    # Windows ConPTY レンダラーパッチ (node-pty)
│   │   ├── pty_host.ts        # PtyProcess ラッパー: node-pty のロード、spawn/kill
│   │   ├── shell_detector.ts  # プラットフォーム既定シェルの検出
│   │   ├── terminal_theme.ts  # Obsidian テーマ変数から xterm テーマへのマッピング
│   │   ├── terminal_component.ts # xterm.js ラッパー: attach/detach/fit
│   │   ├── session_manager.ts # TerminalManager: グローバルセッションのライフサイクル
│   │   ├── terminal_panel.ts  # 共有タブバーパネル（埋め込み + ビューホスト）
│   │   └── terminal_view.ts   # 独立ターミナル ItemView
│   └── lang/
│       ├── helpers.ts         # ローカライズヘルパー
│       └── locale/
│           ├── en.ts          # 英語文字列
│           └── zh-cn.ts       # 中国語文字列
├── styles.css                 # スタイルエントリ
├── manifest.json              # プラグインメタデータ
└── package.json               # 依存関係とスクリプト
```

---


## コントリビュート

プルリクエストでの貢献を歓迎します！

以下を確認してください:
1. コードが ESLint チェックを通過すること
2. 既存のコードスタイルに従うこと
3. コミットメッセージが明確で説明的であること

問題や提案は [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues) を使ってください。
- 作者: unlinearity
- Email: unlinearity@gmail.com
- [AGPL-3.0-or-later](LICENSE) - Copyright (c) 2026 unlinearity

既知の制限:
- コードファイルの内容は現在 Obsidian のグローバル検索エンジンに索引付けされません。現在のファイルには Code Space の検索・置換パネルを使ってください。
- 統合ターミナルはデスクトップ限定です。Windows ARM64 でサポートファイルのダウンロードに失敗する場合は、issue で報告してください。

---

## 謝辞

<p align="center">Code Space は <a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace">AtomGit</a> でもホストされており、そこでソースコードを閲覧できます。</p>
<p align="center"><a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace"><img alt="AtomGit G-Star" src="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace/star/new_badge.svg"></a></p>

### 支援への感謝

> 問題を報告し、プルリクエストを送ってくださった皆さんに感謝します。

このプラグインが役に立つ、楽しいと感じたら、タピオカミルクティーをおごっていただけると嬉しいです。 ❤️（下の WeChat チップ QR コード）

<p align='center'><img src='docs/img/wechat-tip.png' width=60%></p>

### 参照プロジェクト

このプロジェクトは以下の優れたプロジェクトの上に構築されています:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): 強力なプラグイン拡張性を提供。
- [CodeMirror 6](https://codemirror.net/): 柔軟でモダンなコードエディタエンジン。
- [Lezer](https://lezer.codemirror.net/): 効率的なインクリメンタルコード解析システム。
- [xterm.js](https://github.com/xtermjs/xterm.js/): 統合ターミナルのターミナルフロントエンド。
- [node-pty](https://github.com/microsoft/node-pty): Microsoft の擬似ターミナルバックエンド。Obsidian 内の Windows パッチは [lean-obsidian-terminal](https://github.com/sdkasper/lean-obsidian-terminal) から適用。
- [TypeScript](https://www.typescriptlang.org/): 堅牢な型安全性を提供。
- [esbuild](https://esbuild.github.io/): 非常に高速な JavaScript バンドラー。

---

## スター履歴

<!-- star-history:start -->
[![Star History](https://raw.githubusercontent.com/UNLINEARITY/Obsidian-CodeSpace/main/assets/star-history/star-history.png)](https://star-history.com/#UNLINEARITY/Obsidian-CodeSpace&Date)
<!-- star-history:end -->

---

**Obsidian のコード管理をシンプルかつ効率的に！**
