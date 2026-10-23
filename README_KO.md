# Code Space

<h1 align="center">Obsidian을 위한 전문적인 코드 파일 지원</h1>

<p align="center">편집, 임베드, 외부 마운트, 터미널 통합.</p>

<p align="center"><a href="README.md">English</a> | <a href="README_CN.md">简体中文</a> | <a href="README_JA.md">日本語</a> | 한국어 | <a href="README_DE.md">Deutsch</a> | <a href="README_ES.md">Español</a> | <a href="README_PTBR.md">Português (Brasil)</a></p>

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

## 플러그인 소개

> Code Space는 Obsidian 공식 커뮤니티 플러그인 디렉터리에 등록되어 있습니다.🎉

Obsidian의 기본 워크플로는 Markdown 노트를 중심으로 하기 때문에, 코드 파일의 통합 탐색·관리·편집, 구조 탐색, 임베드 코드 내보내기에 대한 지원은 제한적입니다. Code Space는 그 공백을 메우기 위해 만들어졌습니다.

**"Space"의 다섯 가지 레이어:**

1. **관리 공간**: 코드 파일을 위한 통합 인덱스와 관리 영역을 제공하여, 시각적 대시보드로 코드 파일을 탐색할 수 있습니다.
2. **편집 공간**: 코드 파일을 보고 편집하기 위한 전용 환경에서 엽니다.
3. **임베드 공간**: Obsidian 기본 기능과 함께 작동하여 참조, 임베드 코드 미리보기, 네이티브 PDF 내보내기를 실제 코드 블록으로 지원합니다.
4. **마운트 공간**: 시스템 심볼릭 링크/정션을 통해 외부 폴더를 볼트에 마운트하여 프로젝트 간 코드 관리를 가능하게 합니다.
5. **터미널 공간**: 데스크톱에서 편집기 안에 실제 시스템 셸(PowerShell, zsh, bash)을 실행합니다.

<p align='center'><img src='docs\img\pre0.png' width=95%></p>

---

## 핵심 기능

### 1. 코드 파일 관리 공간
볼트 안의 코드 파일을 통합적으로 색인하고 관리하는 시각적 대시보드를 제공합니다.

- **시각적 대시보드**: 그리드 레이아웃과 파일 상태 개요를 갖춘 관리 인터페이스.
- **통합 관리 도구**: 헤더에서 **설정**, **파일 만들기**, 무시 항목 관리에 빠르게 접근.
- **다차원 동적 필터**: 폴더와 확장자로 필터링하고, 파일 이름이나 경로로 검색하고, 수정 날짜·이름·유형으로 정렬.
- **표준 파일 작업**: 이름 바꾸기, 이동, 삭제, 탐색에서 표시, 기본 앱으로 열기 등 Obsidian이 지원하는 작업을 사용.
- **대시보드 상태 기억**: 검색·필터·정렬 상태가 플러그인 설정과 함께 저장되어 반복 사용이 더 부드러워집니다.

<p align='center'><img src='docs\img\pre1.png' width=95%></p>


### 2. 전문적인 코드 편집 공간
IDE와 같은 코드 보기·편집 환경을 제공합니다.

- **구문 강조**: CodeMirror 6 기반. 다양한 언어를 정확하게 강조.
- **구조 탐색**: 클래스·함수·메서드를 분석하는 코드 아웃라인 뷰. 클릭하여 바로 이동.
- **고급 찾기 및 바꾸기**: 정규식, 대소문자 구분, 전체 단어 일치, 개별 바꾸기, 모두 바꾸기를 지원하는 전용 검색 패널.
- **수동 저장**: Ctrl/Cmd+S 수동 저장. 저장되지 않은 상태 피드백과 뷰포트 점프를 방지하는 커서 위치 보호를 제공.
- **기본 편집 지원**: 자동 들여쓰기, 괄호 짝 맞춤, 코드 접기, 줄 번호.
- **조작 최적화**: Ctrl/Cmd+휠 글자 크기 조정과 빠른 접근 플로팅 검색 버튼.

<p align='center'><img src='docs\img\pre22.png' width=95%></p>

### 3. Obsidian 네이티브 임베드 공간

Markdown에 코드를 임베드하고 미리 볼 수 있습니다. 코드 파일의 특정 조각도 포함합니다:

- **파일 참조**: `[[파일 이름]]`으로 코드 파일을 링크.
- **코드 임베드**: `![[파일 이름]]`으로 Markdown에 미리보기를 삽입.
- **줄 범위**: 시작 줄이나 줄 범위를 지정해 코드 조각을 정확하게 임베드.
- **빠른 미리보기**: 링크에 마우스를 올리면 코드 내용을 미리 봅니다.
- **여러 방식으로 소스 열기**: 임베드 헤더를 클릭하면 소스 파일을 엽니다. Ctrl/Cmd+클릭은 새 탭, Ctrl/Cmd+Shift+클릭은 새 창, Ctrl/Cmd+Alt/Option+클릭은 분할 창에서 엽니다.
- **미리보기 동기화**: 소스 코드 파일이 변경되면 관련 임베드 미리보기가 다시 렌더링됩니다.
- **네이티브 PDF 내보내기**: Obsidian 공식 **PDF로 내보내기**를 사용하면 코드 파일 참조가 회색 파일 카드가 아닌 실제 코드 블록으로 내보내집니다.
- **더 넓은 호스트 호환성**: 임베드 코드 미리보기는 읽기 모드, 팝아웃 창 등 Obsidian의 Markdown 렌더링 파이프라인을 재사용하는 호스트에서 더 안정적으로 동작합니다.
- **Code Space에서 코드 블록 편집**: 노트의 펜스 코드 블록 안에 커서를 두고 노트 헤더(읽기/편집 전환 버튼 왼쪽)의 코드 버튼을 선택하거나, 명령 팔레트 또는 편집기 우클릭 메뉴에서 **Code Space에서 코드 블록 편집**을 실행합니다. 블록은 구문 강조가 적용된 Code Space 편집기 창에서 열립니다. 저장하거나 창을 닫으면 코드가 노트에 다시 기록되며, 노트에서 실행 취소할 수 있습니다. 펜스 줄은 그대로 유지되고, 콜아웃·인용·목록 안의 코드 블록도 지원합니다.

<p align='center'><img src='docs\img\pre3.png' width=95%></p>

**지원하는 임베드 구문:**

| 구문 | 설명 |
|--------|-------------|
| `![[test.py]]` | 파일 전체 임베드 |
| `![[test.py#20]]` | 20번째 줄부터 파일 끝까지 표시 |
| `![[test.py#L20]]` | 위와 동일(`L` 접두사가 붙는 GitHub 스타일) |
| `![[test.py#20-40]]` | 20~40번째 줄 표시 |
| `![[test.py#L20-L40]]` | 위와 동일(GitHub 스타일) |
| `![[test.py#L20-40]]` | 혼합 형식도 지원 |

**줄 범위 동작:**
- 범위 모드에서는 "최대 임베드 줄 수" 설정을 무시하고 지정 범위 전체를 표시합니다
- 끝 줄이 파일 길이를 초과하면 파일 끝에서 자동으로 잘립니다
- 끝 줄이 시작 줄보다 작으면 한 줄 표시로 자동 조정합니다
- 줄 번호는 원본 파일과 일치합니다

팁: 노트에 코드 파일 임베드가 포함된 경우 Obsidian 공식 **PDF로 내보내기**로 내보내세요. Code Space는 해당 임베드를 최종 PDF에서 실제 코드 블록으로 유지하며 Obsidian 네이티브 레이아웃과 페이지 매김도 보존합니다.

<p align='center'><img src='docs\img\pre8.png' width=90%></p>

### 4. 외부 마운트 공간 (데스크톱 전용)

볼트 경계를 넘어 외부 프로젝트 코드를 관리합니다.

- **심볼릭 링크/정션**: 설정 페이지에서 심볼릭 링크(macOS/Linux) 또는 디렉터리 정션(Windows)을 만들고 관리하여 외부 폴더를 볼트에 마운트
- **통합 워크플로**: 마운트된 폴더의 코드 파일은 대시보드에 표시되며 편집, 임베드, 아웃라인 탐색 등 Code Space 기능을 사용할 수 있습니다
- **양방향 동기화**: Obsidian에서의 편집이든 외부 폴더에서의 편집이든 동일한 실제 파일에 반영됩니다
- **프로젝트 간 작업**: 프로젝트 코드를 볼트에 복사하지 않고 분산된 코드 저장소를 직접 관리
- **마운트 상태 관리**: 마운트 상태 확인, 제거·재연결, Windows에서 자동/심볼릭 링크/정션 모드 선택

<p align='center'><img src='docs\img\pre7.png' width=98%></p>

**사용 방법:**
1. **설정 > 커뮤니티 플러그인 > Code Space**를 엽니다
2. **외부 폴더**를 활성화합니다
3. **외부 폴더 추가**를 클릭하고, 볼트 밖의 원본 폴더를 선택한 뒤 볼트 안의 마운트 위치를 정합니다
4. Code Space가 링크를 만들고, 구성을 저장하고, 마운트된 폴더 안의 코드 파일을 색인합니다

**중요 사항!**
- **데스크톱 전용**: 샌드박스 제한으로 인해 외부 마운트는 iOS/Android에서 사용할 수 없습니다
- **보안 위험**: 외부 마운트는 플러그인이 볼트 밖의 파일에 접근할 수 있게 합니다. **신뢰하는 폴더만 마운트하세요**
- **경로 검증**: 원본은 볼트 밖의 절대 경로 폴더여야 합니다. Code Space는 볼트 자기 마운트, 부모/자식 순환, 다른 심볼릭 링크/정션 아래에 중첩된 마운트 경로를 거부합니다
- **안전한 제거**: Code Space는 링크가 여전히 구성된 원본을 가리킬 때만 마운트를 제거합니다. 변경되었거나 사용자가 만든 링크는 대상 불일치로 보고되고 그대로 남습니다
- **권한 차이**: Windows에서는 심볼릭 링크에 개발자 모드나 관리자 권한이 필요할 수 있습니다. 자동 모드는 심볼릭 링크를 먼저 시도하고 실패하면 정션으로 대체합니다
- **성능 문제**: 가벼운 저장소나 다중 저장소 연동에는 사용할 수 있지만, 너무 많은 파일이나 매우 큰 디렉터리의 마운트는 피하세요
- **경로 안정성**: 외부 폴더를 이동하거나 이름을 바꾸면 마운트가 깨지고 재구성이 필요합니다
- **동기화 문제**: 외부 폴더가 클라우드 동기화 디렉터리(Dropbox, OneDrive 등)에 있는 경우 충돌을 피하려면 Obsidian과 외부 폴더의 동기화 상태를 확인하세요. 또한 일부 클라우드 서비스는 볼트 안의 심볼릭 링크를 따라가 마운트된 폴더 전체를 클라우드에 업로드할 수 있습니다. 원치 않으면 해당 동기화 서비스에서 마운트 폴더를 제외하세요

### 5. 통합 터미널 (데스크톱 전용)

Code Space 안에서 실제 시스템 셸을 실행합니다. xterm.js와 node-pty 기반입니다.

- **실제 PTY 터미널**: 대화형 프로그램, 색상, 작업 제어, 페이저가 네이티브 터미널처럼 동작합니다(Windows는 ConPTY, macOS/Linux는 Unix pty)
- **두 개의 호스트, 하나의 세션 집합**: 코드 편집기 하단의 내장 패널 또는 메인 영역의 독립 터미널 탭. 패널이나 뷰를 닫아도 세션은 계속 실행됩니다
- **다중 탭 세션**: 탭 표시줄에서 세션을 만들고, 전환하고, 닫습니다. 종료된 세션은 표시되며 닫을 때까지 읽을 수 있습니다
- **컨텍스트 따라가기**: 새 터미널은 현재 열려 있는 파일의 폴더에서 시작합니다(외부 마운트는 실제 디스크 위치로 해석). 대체로 볼트 루트를 사용합니다
- **테마 인식**: 색상과 고정폭 글꼴이 Obsidian 테마를 따릅니다. 팝아웃 창도 포함입니다
- **크기 조절 가능한 패널**: 내장 패널 위의 그립을 드래그하여 높이를 조절합니다
- **파일을 끌어 경로로 변환**: Obsidian 파일 목록이나 시스템 파일 관리자에서 파일 또는 폴더를 터미널로 끌어 놓으면 실제 절대 경로가 현재 셸에 맞게 따옴표로 묶여 붙여넣어집니다(외부 마운트는 디스크상의 실제 위치로 해석)

**사용 방법:**
1. **설정 > Code Space > 터미널**에서 터미널을 활성화합니다(기본 비활성화)
2. "지원 파일" 옆의 **다운로드**를 선택합니다 — Code Space가 작은 플랫폼 패키지를 다운로드합니다(아래 참고). 준비되면 헤더 버튼, 명령, 나머지 설정이 나타납니다
3. 코드 파일을 열고 편집기 헤더의 터미널 버튼을 선택하거나, **Code Space: 터미널 패널 전환**을 실행합니다
4. 또는 **Code Space: 터미널 열기**로 독립 터미널 탭을 엽니다(각 탭이 하나의 전체 화면 터미널입니다)
5. 터미널 탭을 닫으면 해당 터미널이 정지합니다. 모두 정지하려면 **Code Space: 모든 터미널 세션 닫기**를 실행합니다

**중요 사항!**
- **데스크톱 전용**: 터미널은 iOS/Android에서 사용할 수 없습니다
- **명시적 다운로드**: 실제 PTY에는 네이티브 헬퍼(`node-pty`)가 필요합니다. Obsidian 플러그인 스토어는 JavaScript만 배포하므로, 헬퍼는 **설정 > 터미널**에서 **다운로드**를 선택할 때만 다운로드됩니다: 이 저장소의 GitHub 릴리스에서 플랫폼용 사전 빌드 패키지(약 1-3 MB)를 받아 SHA-256 체크섬으로 검증한 뒤 플러그인 폴더 아래에 저장합니다. 터미널 명령과 버튼은 스스로 아무것도 다운로드하지 않습니다
- **지원 플랫폼**: Windows x64/ARM64, macOS x64/ARM64, Linux x64. 다른 Linux 아키텍처는 아직 지원하지 않습니다
- **Linux 요구 사항**: Linux에서 지원 패키지를 설치하려면 `unzip` 유틸리티가 필요합니다(대부분의 배포판에 미리 설치됨)
- **셸 감지**: Windows는 PowerShell(`pwsh.exe` → `powershell.exe` → `cmd.exe`), macOS는 `$SHELL` → `zsh`, Linux는 `$SHELL` → `bash`. **설정 > 터미널**에서 명시적으로 지정할 수 있습니다
- **키보드 포커스**: 터미널에 포커스가 있는 동안 키(Ctrl/Cmd 조합 포함)는 VS Code처럼 셸로 전달됩니다. 편집기를 선택하면 키가 돌아옵니다
- **보안**: 터미널은 사용자 권한으로 실행되며 볼트 밖의 파일에도 접근할 수 있습니다. 붙여넣은 명령은 일반 시스템 터미널과 같은 주의로 다루세요

---
## 설정

**설정 > 커뮤니티 플러그인 > Code Space**에서 설정에 접근합니다:

- **관리할 확장자**: Code Space가 관리할 파일 확장자를 지정합니다(쉼표로 구분). 변경하면 관리되는 파일 연결이 새로 고쳐집니다.
- **줄 번호 표시**: 줄 번호를 켜고 끕니다(기본: 켬)
- **편집기 글자 크기**: 코드 편집기의 글자 크기(기본: 18px, 범위: 9-36px)
- **임베드 글자 크기**: Markdown 임베드 코드 블록의 글자 크기(기본: 15px, 범위: 9-36px)
- **최대 임베드 줄 수**: 임베드 미리보기에 표시되는 최대 줄 수(기본: 20, 0은 무제한)
- **새 코드 파일 위치**: 새 코드 파일을 사용자 지정 폴더 또는 현재 활성 파일의 폴더에 만듭니다
- **외부 폴더(데스크톱 전용)**: 시스템 심볼릭 링크/정션으로 외부 폴더를 볼트에 마운트합니다. 기능 활성화/비활성화, 추가·제거·재연결·상태 확인이 가능합니다.
- **터미널(데스크톱 전용)**: 통합 터미널을 활성화합니다(기본 비활성화, 활성화하면 터미널 버튼과 명령이 표시). 셸 실행 파일 선택(비워 두면 자동 감지), 글자 크기·스크롤백·최대 동시 세션 수 설정, 다운로드한 터미널 지원 파일 관리(다시 다운로드/제거).

참고: 외부 마운트는 볼트 밖 파일에 대한 접근을 허용합니다. 신뢰하는 폴더만 마운트하세요.

## 지원 언어 (확장 가능)

### 1. 기본 지원 확장자

| 언어 | 확장자 |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.json` |
| 웹 기술 | `.html`, `.htm`, `.xhtml`, `.css`, `.scss`, `.sass`, `.less` |
| 시스템 프로그래밍 | `.rs`, `.go`, `.java`, `.cs` |
| 데이터/설정 | `.sql`, `.yaml`, `.yml`, `.xml` |
| 스크립팅 | `.php`, `.r`, `.rb`, `.sh` |

**플러그인 설정에서 확장자를 더 추가할 수 있습니다. Code Space는 사용자 지정 확장자의 파일도 관리할 수 있습니다.**
- 텍스트와 코드 파일은 Code Space 편집기 인터페이스로 열립니다
- 바이너리 파일(이미지, PDF 등)은 Obsidian 기본 뷰어 또는 시스템 기본 앱으로 열립니다. 대시보드로 PDF 같은 첨부 파일을 관리할 수도 있습니다

<p align='center'><img src='docs\img\pre4.png' width=95%></p>

### 2. 구문 강조가 포함된 추가 텍스트/코드 확장자

**설정 > Code Space > 관리할 확장자**에 다음 확장자를 추가하면 활성화됩니다:

| 언어 | 확장자 | 재사용되는 강조 |
|------|--------|-------------|
| **XML 계열** | `.xsd`, `.xsl`, `.xslt`, `.wsdl`, `.plist`, `.csproj`, `.vcxproj`, `.props`, `.targets`, `.config` | XML |
| | `.urdf`, `.xacro` | XML |
| **C/C++ 계열** | `.ino`, `.pde`, `.nut` | C/C++ |
| | `.cu`, `.cuh`, `.glsl`, `.vert`, `.frag`, `.hlsl`, `.mm`, `.swift` | C/C++ |
| **Java 계열** | `.kt`, `.kts`, `.scala`, `.groovy`, `.gradle` | Java |
| **프런트엔드 프레임워크** | `.vue`, `.svelte`, `.astro` | JavaScript |
| **JSON 변형** | `.json5`, `.jsonc` | JavaScript |
| **Python 계열** | `.pyx`, `.pxd`, `.pxi`, `.ipy` | Python |
| **설정 파일** | `.toml`, `.ini`, `.cfg`, `.conf` | YAML |
| **셸 스크립트** | `.bash`, `.zsh` | Shell |
| **PowerShell** | `.ps1`, `.psm1`, `.psd1` | PowerShell |
| **Fortran** | `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08` | 전용 |
| **기타 언어** | `.cmake`, `.dockerfile`, `.diff`, `.patch`, `.lua`, `.pl`, `.pm`, `.erb`, `.m` | 전용 |

### 3. 바이너리 파일 지원 (Obsidian 기본 뷰어로 열기)

다음 확장자를 관리 목록에 추가하면 이 파일들도 Code Space 대시보드에서 관리할 수 있습니다(이름 바꾸기, 이동, 삭제 등). Code Space 편집기로 열리지 않으며 Obsidian 기본 뷰어 또는 시스템 기본 앱을 사용합니다.

| 유형 | 확장자 |
|------|--------|
| 이미지 | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.psd` |
| 문서 | `.pdf` |
| 오디오 | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma` |
| 비디오 | `.mp4`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v` |
| 아카이브 | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz` |
| Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| 기타 | `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.dat` |

---

## 지원 키보드 단축키

### 1. 플러그인 명령

<p align='center'><img src='docs\img\pre5.png' width=98%></p>

| 명령 경로 | 기능 |
|---------|------|
| `Ctrl+P` → "대시보드 열기" | 코드 관리 패널을 엽니다 |
| `Ctrl+P` → "코드 파일 만들기" | 새 코드 파일을 만듭니다 |
| `Ctrl+P` → "플러그인 다시 불러오기" | 플러그인을 다시 불러옵니다 |
| `Ctrl+P` → "코드 아웃라인 전환" | 코드 아웃라인 뷰를 전환합니다 |
| `Ctrl+P` → "찾기 및 바꾸기" | 현재 Code Space 편집기에서 찾기·바꾸기 패널을 엽니다 |
| `Ctrl+P` → "Code Space에서 코드 블록 편집" | 커서 위치의 코드 블록을 Code Space 편집기 창에서 편집합니다(커서가 코드 블록 안에 있을 때 사용 가능) |
| `Ctrl+P` → "터미널 열기" | 새 터미널 탭을 엽니다(터미널 활성화 및 지원 파일 다운로드 후 사용 가능) |
| `Ctrl+P` → "터미널 패널 전환" | 현재 편집기의 내장 터미널 패널을 전환합니다 |
| `Ctrl+P` → "모든 터미널 세션 닫기" | 모든 터미널을 정지합니다 |

---

### 2. 기본 조작

| 단축키 | 기능 |
|--------|------|
| `Ctrl/Cmd+S` | 파일을 수동으로 저장 |
| `Ctrl/Cmd+마우스 휠` | 글자 크기 조정(터미널 안에서는 포커스된 터미널만) |
| `Ctrl/Cmd+F` | 찾기 |
| `Ctrl+H` / `Cmd+Option+F` | 바꾸기 |
| `Ctrl/Cmd+C` | 선택 복사 |
| `Ctrl/Cmd+X` | 선택 잘라내기 |
| `Ctrl/Cmd+V` | 내용 붙여넣기 |
| `Ctrl/Cmd+A` | 모두 선택 |
| `Ctrl/Cmd+Z` | 실행 취소 |
| `Ctrl+Y` 또는 `Ctrl/Cmd+Shift+Z` | 다시 실행 |
| `Tab` | 들여쓰기 증가 |
| `Shift+Tab` | 들여쓰기 감소 |
| `Enter`           | 새 줄 입력 시 들여쓰기 유지 |



| 커서 이동            |          | 선택 및 편집              |         |
| --------------- | -------- | ----------------- | ------- |
| `↑` `↓` `←` `→` | 커서를 상/하/좌/우로 이동 | `Shift+화살표 키`       | 선택 확장    |
| `Home`          | 줄 시작으로 이동    | `Ctrl+Shift+←`    | 단어 시작까지 선택 |
| `End`           | 줄 끝으로 이동    | `Ctrl+Shift+→`    | 단어 끝까지 선택 |
| `Ctrl+←`        | 왼쪽으로 한 단어 이동 | `Ctrl+Shift+Home` | 파일 시작까지 선택 |
| `Ctrl+→`        | 오른쪽으로 한 단어 이동 | `Ctrl+Shift+End`  | 파일 끝까지 선택 |
| `Ctrl+Home`     | 파일 시작으로 이동  | `Backspace`       | 커서 앞 문자 삭제 |
| `Ctrl+End`      | 파일 끝으로 이동  | `Delete`          | 커서 뒤 문자 삭제 |
| `Page Up`       | 한 페이지 위로     | `Ctrl+Backspace`  | 커서 앞 단어 삭제 |
| `Page Down`       | 한 페이지 아래로     | `Ctrl+Delete`     | 커서 뒤 단어 삭제 |


---

## 설치

### 방법 1: Obsidian 커뮤니티 플러그인에서 설치 (권장)

Code Space는 Obsidian 공식 커뮤니티 플러그인 디렉터리에 등록되어 있습니다.

1. **설정 > 커뮤니티 플러그인**을 엽니다.
2. 요청되면 **제한 모드**를 끕니다.
3. **찾아보기**를 클릭합니다.
4. "Code Space"를 검색합니다.
5. **설치**를 클릭하고 플러그인을 활성화합니다.

### 방법 2: 수동 설치

1. [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest)를 방문합니다.
2. `main.js`, `manifest.json`, `styles.css`를 내려받아 볼트의 플러그인 디렉터리 `.obsidian/plugins/code-space/`에 넣습니다. `code-space` 폴더가 없으면 직접 만드세요.
3. Obsidian 설정에서 다시 불러와 플러그인을 활성화합니다.

### 방법 3: BRAT

개발 빌드나 시험 릴리스를 테스트하려는 경우에만 BRAT을 사용하세요. 먼저 BRAT 플러그인을 설치한 뒤 이 저장소를 베타 플러그인으로 추가합니다: `https://github.com/UNLINEARITY/Obsidian-CodeSpace`. 그리고 최신 버전을 선택합니다. 대부분의 사용자는 커뮤니티 플러그인 버전을 설치하는 것이 좋습니다.

<p align='center'><img src='docs\img\pre6.png' width=90%></p>

---

## 개발

### 빌드 요구 사항

- Node.js 18 이상(현재 LTS 권장)
- npm

### 빌드 명령

```bash
npm install          # 의존성 설치
npm run dev          # 개발 빌드(파일 감시)
npm run build        # 프로덕션 빌드
npm test             # 유닛 테스트 실행
npm run lint         # ESLint 실행
npm run dev:copy     # 빌드 결과물을 로컬 볼트로 복사
```

`npm run dev:copy`는 기본적으로 `C:\Nonlinear\ob`과 `.obsidian`을 사용합니다. 볼트가 다른 경로를 사용하면 `OBSIDIAN_VAULT_PATH` 또는 `OBSIDIAN_CONFIG_DIR`을 설정하세요.

### 릴리스 워크플로

`package.json`의 버전을 갱신하고 검증 파이프라인을 실행한 뒤 `2.4.0` 같은 SemVer 태그를 푸시합니다. GitHub Actions가 태그를 검증하고, 릴리스 결과물을 빌드하고, 출처 증명을 만들고, `main.js`, `manifest.json`, `styles.css`를 GitHub 릴리스에 게시합니다.

### 프로젝트 구조

```
obsidian-codespace/
├── src/
│   ├── main.ts                # 플러그인 진입점: 명령 등록, 뷰 마운트, 라이프사이클 관리
│   ├── code_view.ts           # 편집기 코어: CodeMirror 6 편집 환경
│   ├── dashboard_view.ts      # 대시보드 뷰: 파일 색인 및 관리 UI
│   ├── outline_view.ts        # 아웃라인 뷰: 사이드바 구조 탐색
│   ├── code_parser.ts         # 구문 파서: 다국어 구조 분석
│   ├── code_embed.ts          # 임베드 처리: 참조 및 미리보기 로직
│   ├── code_embed_markdown.ts # 네이티브 PDF 내보내기 등을 위한 코드 임베드 확장
│   ├── scrollbar_visibility.ts # 편집기와 임베드의 스크롤바 표시 상태
│   ├── native_pdf_export_patch.ts # 네이티브 PDF 내보내기 통합 및 내보내기 체인 패치
│   ├── dropdown.ts            # UI 컴포넌트: 드롭다운/다중 선택
│   ├── folder_filter_modal.ts # 폴더 필터 모달
│   ├── ignore_manager_modal.ts # 무시 파일/폴더 관리 모달
│   ├── external_mount.ts      # 외부 마운트: 심볼릭 링크/정션 관리
│   ├── settings.ts            # 설정 패널: 플러그인 구성
│   ├── terminal/              # 통합 터미널 (데스크톱 전용)
│   │   ├── types.ts           # 터미널 공용 타입과 로컬 pty 인터페이스
│   │   ├── node_access.ts     # window.require를 통한 Node API 접근
│   │   ├── binary_manager.ts  # node-pty 사전 빌드 다운로드/검증/압축 해제
│   │   ├── conout_patch.ts    # Windows ConPTY 렌더러 패치 (node-pty)
│   │   ├── pty_host.ts        # PtyProcess 래퍼: node-pty 로드, spawn/kill
│   │   ├── shell_detector.ts  # 플랫폼 기본 셸 감지
│   │   ├── terminal_theme.ts  # Obsidian 테마 변수를 xterm 테마로 매핑
│   │   ├── terminal_component.ts # xterm.js 래퍼: attach/detach/fit
│   │   ├── session_manager.ts # TerminalManager: 전역 세션 라이프사이클
│   │   ├── terminal_panel.ts  # 공용 탭바 패널(내장 + 뷰 호스트)
│   │   └── terminal_view.ts   # 독립 터미널 ItemView
│   └── lang/
│       ├── helpers.ts         # 로컬라이제이션 헬퍼
│       └── locale/
│           ├── en.ts          # 영어 문자열
│           └── zh-cn.ts       # 중국어 문자열
├── styles.css                 # 스타일 진입점
├── manifest.json              # 플러그인 메타데이터
└── package.json               # 의존성과 스크립트
```

---


## 기여

풀 리퀘스트를 통한 기여를 환영합니다!

다음을 확인해 주세요:
1. 코드가 ESLint 검사를 통과할 것
2. 기존 코드 스타일을 따를 것
3. 커밋 메시지가 명확하고 설명적일 것

문제나 제안은 [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues)를 사용해 주세요.
- 저자: unlinearity
- Email: unlinearity@gmail.com
- [AGPL-3.0-or-later](LICENSE) - Copyright (c) 2026 unlinearity

알려진 제한:
- 코드 파일 내용은 현재 Obsidian 전역 검색 엔진에 색인되지 않습니다. 현재 파일에는 Code Space의 찾기·바꾸기 패널을 사용하세요.
- 통합 터미널은 데스크톱 전용입니다. Windows ARM64에서 지원 파일 다운로드가 실패하면 이슈로 알려주세요.

---

## 감사의 말

<p align="center">Code Space는 <a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace">AtomGit</a>에도 호스팅되어 있으며, 거기서 소스 코드를 볼 수 있습니다.</p>
<p align="center"><a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace"><img alt="AtomGit G-Star" src="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace/star/new_badge.svg"></a></p>

### 지원에 감사드립니다

> 문제를 보고하고 풀 리퀘스트를 보내주신 모든 분들께 감사드립니다.

이 플러그인이 도움이 되거나 재미있었다면, 버블티 한 잔 사주실 수 있습니다. ❤️ (아래 WeChat 팁 QR 코드)

<p align='center'><img src='docs/img/wechat-tip.png' width=60%></p>

### 참고 프로젝트

이 프로젝트는 다음의 훌륭한 프로젝트 위에 구축되었습니다:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): 강력한 플러그인 확장성을 제공.
- [CodeMirror 6](https://codemirror.net/): 유연하고 현대적인 코드 편집기 엔진.
- [Lezer](https://lezer.codemirror.net/): 효율적인 증분 코드 파싱 시스템.
- [xterm.js](https://github.com/xtermjs/xterm.js/): 통합 터미널의 터미널 프런트엔드.
- [node-pty](https://github.com/microsoft/node-pty): Microsoft의 의사 터미널 백엔드. Obsidian 내 Windows 패치는 [lean-obsidian-terminal](https://github.com/sdkasper/lean-obsidian-terminal)에서 적용.
- [TypeScript](https://www.typescriptlang.org/): 견고한 타입 안전성을 제공.
- [esbuild](https://esbuild.github.io/): 매우 빠른 JavaScript 번들러.

---

## 스타 히스토리

<!-- star-history:start -->
[![Star History](https://raw.githubusercontent.com/UNLINEARITY/Obsidian-CodeSpace/main/assets/star-history/star-history.png)](https://star-history.com/#UNLINEARITY/Obsidian-CodeSpace&Date)
<!-- star-history:end -->

---

**Obsidian에서 코드 관리를 간단하고 효율적으로!**
