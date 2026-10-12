# Code Space

<h1 align="center">Suporte profissional a arquivos de código para Obsidian</h1>

<p align="center">Edição, incorporação, montagens externas e integração com terminal.</p>

<p align="center"><a href="README.md">English</a> | <a href="README_CN.md">简体中文</a> | <a href="README_JA.md">日本語</a> | <a href="README_KO.md">한국어</a> | <a href="README_DE.md">Deutsch</a> | <a href="README_ES.md">Español</a> | Português (Brasil)</p>

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

## Sobre o plugin

> O Code Space está disponível no diretório oficial de plugins da comunidade do Obsidian.🎉

O fluxo de trabalho nativo do Obsidian é centrado em notas Markdown, então seu suporte para navegação, gerenciamento e edição centralizados de arquivos de código, navegação estrutural e exportação de código incorporado é limitado. O Code Space foi criado para preencher essa lacuna.

**As cinco camadas do "Space":**

1. **Espaço de gerenciamento**: Oferece um índice unificado e uma área de gerenciamento para arquivos de código, para que você possa navegar por eles em um painel visual.
2. **Espaço de edição**: Abre arquivos de código em um ambiente dedicado para visualização e edição.
3. **Espaço de incorporação**: Trabalha com os recursos nativos do Obsidian para dar suporte a referências, pré-visualizações de código incorporado e exportação nativa para PDF como blocos de código reais.
4. **Espaço de montagem**: Monta pastas externas no cofre via symlinks/junctions do sistema para gerenciamento de código entre projetos.
5. **Espaço de terminal**: Executa um shell real do sistema (PowerShell, zsh, bash) dentro do editor, no desktop.

<p align='center'><img src='docs\img\pre0.png' width=95%></p>

---

## Recursos principais

### 1. Espaço de gerenciamento de arquivos de código
Oferece um painel visual para indexação e gerenciamento unificados dos arquivos de código dentro do cofre.

- **Painel visual**: Uma interface de gerenciamento com layout em grade e visão geral do estado dos arquivos.
- **Ferramentas de gerenciamento integradas**: O cabeçalho dá acesso rápido a **Configurações**, **Criar arquivo** e ao gerenciamento de itens ignorados.
- **Filtragem dinâmica multidimensional**: Filtre por pasta e extensão, pesquise por nome de arquivo ou caminho e ordene por data de modificação, nome ou tipo.
- **Operações de arquivo padrão**: Use operações suportadas pelo Obsidian, como renomear, mover, excluir, revelar na navegação e abrir no aplicativo padrão.
- **Memória de estado do painel**: O estado de pesquisa, filtro e ordenação é salvo junto com as configurações do plugin para um uso repetido mais fluido.

<p align='center'><img src='docs\img\pre1.png' width=95%></p>


### 2. Espaço de edição de código profissional
Oferece um ambiente semelhante a uma IDE para visualizar e editar código.

- **Realce de sintaxe**: Movido por CodeMirror 6, com realce preciso para muitas linguagens.
- **Navegação estrutural**: Visão de estrutura de código que analisa classes, funções e métodos com navegação por clique.
- **Busca e substituição avançadas**: Painel de busca dedicado com regex, diferenciação de maiúsculas, palavra inteira, substituição única e substituir tudo.
- **Salvamento manual**: Ctrl/Cmd+S com aviso de estado não salvo e proteção da posição do cursor para evitar saltos da visualização.
- **Auxílios básicos de edição**: Indentação automática, correspondência de parênteses, dobramento de código e números de linha.
- **Otimizações de interação**: Escalonamento de fonte com Ctrl/Cmd+roda e botão de busca flutuante para acesso rápido.

<p align='center'><img src='docs\img\pre22.png' width=95%></p>

### 3. Espaço de incorporação nativo do Obsidian

Incorpore e pré-visualize código em Markdown, inclusive trechos específicos de arquivos de código:

- **Referências de arquivos**: Vincule arquivos de código com `[[nome-do-arquivo]]`.
- **Incorporação de código**: Incorpore pré-visualizações em Markdown com `![[nome-do-arquivo]]`.
- **Intervalos de linhas**: Especifique linhas iniciais ou intervalos para incorporar trechos de código com precisão.
- **Pré-visualização rápida**: Passe o mouse sobre os links para pré-visualizar o conteúdo do código.
- **Abra os arquivos-fonte de várias formas**: Clique no cabeçalho da incorporação para abrir o arquivo-fonte. Ctrl/Cmd+clique abre em uma nova aba, Ctrl/Cmd+Shift+clique abre em uma nova janela e Ctrl/Cmd+Alt/Option+clique abre em um painel dividido.
- **Sincronização de pré-visualização**: Quando um arquivo de código-fonte muda, as pré-visualizações incorporadas relacionadas são renderizadas novamente.
- **Exportação nativa para PDF**: Use o **Exportar para PDF** oficial do Obsidian e as referências a arquivos de código serão exportadas como blocos de código reais em vez de cartões cinzentos de arquivo.
- **Compatibilidade mais ampla de hosts**: As pré-visualizações de código incorporado se comportam de forma mais confiável no modo de leitura, janelas destacadas e outros hosts que reutilizam o pipeline de Markdown do Obsidian.

<p align='center'><img src='docs\img\pre3.png' width=95%></p>

**Sintaxe de incorporação suportada:**

| Sintaxe | Descrição |
|--------|-------------|
| `![[test.py]]` | Incorpora o arquivo inteiro |
| `![[test.py#20]]` | Exibe da linha 20 até o fim do arquivo |
| `![[test.py#L20]]` | Igual ao anterior (estilo GitHub com prefixo `L`) |
| `![[test.py#20-40]]` | Exibe as linhas 20 a 40 |
| `![[test.py#L20-L40]]` | Igual ao anterior (estilo GitHub) |
| `![[test.py#L20-40]]` | Formato misto também suportado |

**Comportamento dos intervalos de linhas:**
- No modo intervalo, exibe o intervalo completo especificado, ignorando a configuração "Máximo de linhas incorporadas"
- Se a linha final exceder o tamanho do arquivo, trunca automaticamente no fim do arquivo
- Se a linha final for menor que a inicial, ajusta automaticamente para exibição de linha única
- Os números de linha são consistentes com o arquivo original

Dica: Quando uma nota contém incorporações de arquivos de código, exporte-a com o **Exportar para PDF** oficial do Obsidian. O Code Space mantém essas incorporações como blocos de código reais no PDF final, preservando o layout e a paginação nativos do Obsidian.

<p align='center'><img src='docs\img\pre8.png' width=90%></p>

### 4. Espaço de montagem externa (somente desktop)

Trabalhe além dos limites do cofre para gerenciar código de projetos externos.

- **Symlinks/junctions**: Crie e gerencie symlinks (macOS/Linux) ou junctions de diretório (Windows) pela página de configurações para montar pastas externas no cofre
- **Fluxo de trabalho integrado**: Arquivos de código em pastas montadas aparecem no painel com as funcionalidades do Code Space, como edição, incorporação e navegação por estrutura
- **Sincronização bidirecional**: Edições feitas do Obsidian ou da pasta externa afetam os mesmos arquivos subjacentes
- **Trabalho entre projetos**: Gerencie repositórios de código distribuídos diretamente, sem copiar o código do projeto para o cofre
- **Gerenciamento de estado de montagem**: Veja o status das montagens, remova ou revincule montagens e escolha o modo automático, symlink ou junction no Windows

<p align='center'><img src='docs\img\pre7.png' width=98%></p>

**Uso:**
1. Abra **Configurações > Plugins da comunidade > Code Space**
2. Ative **Pastas externas**
3. Clique em **Adicionar pasta externa**, escolha uma pasta de origem fora do cofre e defina o local de montagem dentro do cofre
4. O Code Space cria o link, salva a configuração e indexa os arquivos de código dentro da pasta montada

**Avisos importantes!**
- **Somente desktop**: Montagens externas não estão disponíveis no iOS/Android devido a restrições de sandbox
- **Risco de segurança**: Montagens externas permitem que o plugin acesse arquivos fora do cofre. **Monte apenas pastas em que você confia**
- **Validação de caminho**: A origem deve ser uma pasta absoluta fora do cofre. O Code Space rejeita automontagens do cofre, ciclos pai/filho e caminhos de montagem aninhados sob outro symlink ou junction
- **Remoção segura**: O Code Space remove uma montagem somente quando o link ainda aponta para a origem configurada. Um link alterado ou criado pelo usuário é reportado como destino divergente e permanece intacto
- **Diferenças de permissão**: No Windows, symlinks podem exigir modo de desenvolvedor ou privilégios de administrador. O modo automático tenta symlink primeiro e recorre ao junction
- **Problemas de desempenho**: Você pode usar isso para repositórios leves ou coordenação de múltiplos repositórios, mas evite montar arquivos demais ou diretórios muito grandes
- **Estabilidade de caminho**: Mover ou renomear pastas externas quebrará a montagem e exigirá reconfiguração
- **Problemas de sincronização**: Se as pastas externas estiverem em diretórios sincronizados na nuvem (ex.: Dropbox, OneDrive), garanta que o Obsidian e as pastas externas estejam sincronizados para evitar conflitos. Note também que alguns serviços de nuvem seguem os symlinks dentro do cofre e enviam a pasta montada inteira para a nuvem; se não quiser isso, exclua as pastas montadas desse serviço de sincronização

### 5. Terminal integrado (somente desktop)

Execute um shell real do sistema dentro do Code Space, movido por xterm.js e node-pty.

- **Terminal PTY real**: Programas interativos, cores, controle de tarefas e paginação funcionam como em um terminal nativo (ConPTY no Windows, pty Unix no macOS/Linux)
- **Dois hosts, um conjunto de sessões**: Alterne um painel incorporado na parte inferior do editor de código ou abra uma aba de terminal independente na área principal. As sessões continuam em execução quando painéis ou visualizações são fechados
- **Sessões com múltiplas abas**: Crie, alterne e feche sessões de terminal pela barra de abas; sessões encerradas são marcadas e continuam legíveis até serem fechadas
- **Segue seu contexto**: Novos terminais iniciam na pasta do arquivo aberto no momento (montagens externas resolvem para o local real no disco), com fallback para a raiz do cofre
- **Ciente do tema**: Cores e a fonte monoespaçada seguem seu tema do Obsidian, inclusive em janelas destacadas
- **Painel redimensionável**: Arraste a alça acima do painel incorporado para ajustar a altura

**Uso:**
1. Ative o terminal em **Configurações > Code Space > Terminal** (desativado por padrão)
2. Selecione **Baixar** ao lado de "Arquivos de suporte" — o Code Space baixa um pequeno pacote da plataforma (veja os avisos abaixo); o botão de cabeçalho, os comandos e as demais configurações aparecem quando estiver pronto
3. Abra um arquivo de código e selecione o botão de terminal no cabeçalho do editor, ou execute **Code Space: Alternar painel de terminal**
4. Ou execute **Code Space: Abrir terminal** para uma aba de terminal independente (cada aba é um terminal de tela cheia)
5. Feche uma aba de terminal para parar esse terminal, ou execute **Code Space: Fechar todas as sessões de terminal** para parar tudo

**Avisos importantes!**
- **Somente desktop**: O terminal não está disponível no iOS/Android
- **Download explícito**: Um PTY real exige um auxiliar nativo (`node-pty`). A loja de plugins do Obsidian distribui apenas JavaScript, então o auxiliar é baixado somente quando você seleciona **Baixar** em **Configurações > Terminal**: um pacote pré-compilado (~1-3 MB) para sua plataforma, dos releases do GitHub deste repositório, verificado por checksum SHA-256 e armazenado na pasta do plugin. Comandos e botões do terminal nunca baixam nada por conta própria
- **Plataformas suportadas**: Windows x64/ARM64, macOS x64/ARM64, Linux x64. Outras arquiteturas Linux ainda não são suportadas
- **Requisito no Linux**: Instalar o pacote de suporte no Linux exige o utilitário `unzip` (pré-instalado na maioria das distribuições)
- **Detecção de shell**: PowerShell (`pwsh.exe` → `powershell.exe` → `cmd.exe`) no Windows, `$SHELL` → `zsh` no macOS, `$SHELL` → `bash` no Linux. Defina um executável explícito em **Configurações > Terminal**
- **Foco do teclado**: Enquanto o terminal está em foco, as teclas (incluindo combinações Ctrl/Cmd) vão para o shell, como no VS Code. Selecione o editor para devolver as teclas
- **Segurança**: O terminal é executado com suas permissões de usuário e pode acessar arquivos fora do cofre. Trate comandos colados com o mesmo cuidado que em qualquer terminal do sistema

---
## Configuração

Acesse a configuração em **Configurações > Plugins da comunidade > Code Space**:

- **Extensões gerenciadas**: Especifica as extensões de arquivo gerenciadas pelo Code Space (separadas por vírgula). Alterações atualizam as associações de arquivos gerenciados.
- **Mostrar números de linha**: Alterna os números de linha (padrão: ativado)
- **Tamanho da fonte do editor**: Tamanho da fonte do editor de código (padrão: 18px, intervalo: 9-36px)
- **Tamanho da fonte dos blocos incorporados**: Tamanho da fonte dos blocos de código incorporados em Markdown (padrão: 15px, intervalo: 9-36px)
- **Máximo de linhas incorporadas**: Máximo de linhas exibidas nas pré-visualizações incorporadas (padrão: 20, 0 para ilimitado)
- **Local para novos arquivos de código**: Cria novos arquivos de código em uma pasta personalizada ou na pasta do arquivo ativo no momento
- **Pastas externas (somente desktop)**: Monta pastas externas no cofre via symlinks/junctions do sistema. Você pode ativar ou desativar o recurso, adicionar, remover, revincular e inspecionar montagens.
- **Terminal (somente desktop)**: Ativa o terminal integrado (desativado por padrão; ativar exibe o botão e os comandos do terminal), escolhe um executável de shell (vazio para detecção automática), define tamanho da fonte, histórico e o número máximo de sessões simultâneas, e gerencia os arquivos de suporte do terminal baixados (baixar novamente ou remover).

Nota: Montagens externas permitem acesso a arquivos fora do cofre. Monte apenas pastas em que você confia.

## Linguagens suportadas (extensível)

### 1. Extensões suportadas por padrão

| Linguagem | Extensões |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.json` |
| Tecnologias web | `.html`, `.htm`, `.xhtml`, `.css`, `.scss`, `.sass`, `.less` |
| Programação de sistemas | `.rs`, `.go`, `.java`, `.cs` |
| Dados/Configuração | `.sql`, `.yaml`, `.yml`, `.xml` |
| Scripts | `.php`, `.r`, `.rb`, `.sh` |

**Você pode adicionar mais extensões nas configurações do plugin. O Code Space consegue gerenciar arquivos com extensões personalizadas.**
- Arquivos de texto e código abrem na interface do editor do Code Space
- Arquivos binários (ex.: imagens ou PDFs) abrem com o visualizador nativo do Obsidian ou o aplicativo padrão do sistema. Você também pode usar o painel para gerenciar anexos como PDFs

<p align='center'><img src='docs\img\pre4.png' width=95%></p>

### 2. Extensões de texto/código adicionais com realce de sintaxe

Adicione as seguintes extensões em **Configurações > Code Space > Extensões gerenciadas** para ativá-las:

| Linguagem | Extensões | Realce reaproveitado de |
|------|--------|-------------|
| **Família XML** | `.xsd`, `.xsl`, `.xslt`, `.wsdl`, `.plist`, `.csproj`, `.vcxproj`, `.props`, `.targets`, `.config` | XML |
| | `.urdf`, `.xacro` | XML |
| **Família C/C++** | `.ino`, `.pde`, `.nut` | C/C++ |
| | `.cu`, `.cuh`, `.glsl`, `.vert`, `.frag`, `.hlsl`, `.mm`, `.swift` | C/C++ |
| **Família Java** | `.kt`, `.kts`, `.scala`, `.groovy`, `.gradle` | Java |
| **Frameworks de frontend** | `.vue`, `.svelte`, `.astro` | JavaScript |
| **Variantes de JSON** | `.json5`, `.jsonc` | JavaScript |
| **Família Python** | `.pyx`, `.pxd`, `.pxi`, `.ipy` | Python |
| **Arquivos de configuração** | `.toml`, `.ini`, `.cfg`, `.conf` | YAML |
| **Scripts de shell** | `.bash`, `.zsh` | Shell |
| **PowerShell** | `.ps1`, `.psm1`, `.psd1` | PowerShell |
| **Fortran** | `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08` | Dedicado |
| **Outras linguagens** | `.cmake`, `.dockerfile`, `.diff`, `.patch`, `.lua`, `.pl`, `.pm`, `.erb`, `.m` | Dedicado |

### 3. Suporte a arquivos binários (abertos com o visualizador nativo do Obsidian)

Se você adicionar as seguintes extensões à lista gerenciada, esses arquivos também poderão ser gerenciados no painel do Code Space (renomear, mover, excluir etc.). Eles não são abertos pelo editor do Code Space; usam o visualizador nativo do Obsidian ou o aplicativo padrão do sistema.

| Tipo | Extensões |
|------|--------|
| Imagens | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.psd` |
| Documentos | `.pdf` |
| Áudio | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma` |
| Vídeo | `.mp4`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v` |
| Arquivos compactados | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz` |
| Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| Outros | `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.dat` |

---

## Atalhos de teclado suportados

### 1. Comandos do plugin

<p align='center'><img src='docs\img\pre5.png' width=98%></p>

| Caminho do comando | Função |
|---------|------|
| `Ctrl+P` → "Abrir painel" | Abre o painel de gerenciamento de código |
| `Ctrl+P` → "Criar arquivo de código" | Cria um novo arquivo de código |
| `Ctrl+P` → "Recarregar plugin" | Recarrega o plugin |
| `Ctrl+P` → "Alternar estrutura de código" | Alterna a visão de estrutura de código |
| `Ctrl+P` → "Buscar e substituir" | Abre o painel de busca e substituição no editor do Code Space atual |
| `Ctrl+P` → "Abrir terminal" | Abre uma nova aba de terminal (disponível após ativar o terminal e baixar os arquivos de suporte) |
| `Ctrl+P` → "Alternar painel de terminal" | Alterna o painel de terminal incorporado no editor atual |
| `Ctrl+P` → "Fechar todas as sessões de terminal" | Para todos os terminais |

---

### 2. Operações básicas

| Atalho | Função |
|--------|------|
| `Ctrl/Cmd+S` | Salvar o arquivo manualmente |
| `Ctrl/Cmd+Roda do mouse` | Ajustar o tamanho da fonte (no terminal: somente o terminal em foco) |
| `Ctrl/Cmd+F` | Buscar |
| `Ctrl+H` / `Cmd+Option+F` | Substituir |
| `Ctrl/Cmd+C` | Copiar a seleção |
| `Ctrl/Cmd+X` | Recortar a seleção |
| `Ctrl/Cmd+V` | Colar conteúdo |
| `Ctrl/Cmd+A` | Selecionar tudo |
| `Ctrl/Cmd+Z` | Desfazer |
| `Ctrl+Y` ou `Ctrl/Cmd+Shift+Z` | Refazer |
| `Tab` | Aumentar indentação |
| `Shift+Tab` | Diminuir indentação |
| `Enter`           | Nova linha preservando a indentação |



| Navegação do cursor            |          | Seleção e edição              |         |
| --------------- | -------- | ----------------- | ------- |
| `↑` `↓` `←` `→` | Mover o cursor para cima/baixo/esquerda/direita | `Shift+Setas`       | Estender a seleção    |
| `Home`          | Ir para o início da linha    | `Ctrl+Shift+←`    | Selecionar até o início da palavra |
| `End`           | Ir para o fim da linha    | `Ctrl+Shift+→`    | Selecionar até o fim da palavra |
| `Ctrl+←`        | Mover uma palavra para a esquerda | `Ctrl+Shift+Home` | Selecionar até o início do arquivo |
| `Ctrl+→`        | Mover uma palavra para a direita | `Ctrl+Shift+End`  | Selecionar até o fim do arquivo |
| `Ctrl+Home`     | Ir para o início do arquivo  | `Backspace`       | Apagar o caractere antes do cursor |
| `Ctrl+End`      | Ir para o fim do arquivo  | `Delete`          | Apagar o caractere após o cursor |
| `Page Up`       | Rolar uma página acima     | `Ctrl+Backspace`  | Apagar a palavra antes do cursor |
| `Page Down`       | Rolar uma página abaixo     | `Ctrl+Delete`     | Apagar a palavra após o cursor |


---

## Instalação

### Método 1: Instalar pelos plugins da comunidade do Obsidian (recomendado)

O Code Space está disponível no diretório oficial de plugins da comunidade do Obsidian.

1. Abra **Configurações > Plugins da comunidade**.
2. Se o Obsidian pedir, desative o **Modo restrito**.
3. Clique em **Procurar**.
4. Pesquise "Code Space".
5. Clique em **Instalar** e ative o plugin.

### Método 2: Instalação manual

1. Visite [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest).
2. Baixe `main.js`, `manifest.json` e `styles.css`. Coloque-os no diretório de plugins do seu cofre: `.obsidian/plugins/code-space/`. Se a pasta `code-space` não existir, crie-a manualmente.
3. Recarregue e ative o plugin nas configurações do Obsidian.

### Método 3: BRAT

Use o BRAT somente se quiser testar uma versão de desenvolvimento ou pré-lançamento. Instale primeiro o plugin BRAT e depois adicione este repositório como plugin beta: `https://github.com/UNLINEARITY/Obsidian-CodeSpace`, e selecione a versão mais recente. A maioria dos usuários deve instalar a versão do plugin da comunidade.

<p align='center'><img src='docs\img\pre6.png' width=90%></p>

---

## Desenvolvimento

### Requisitos de build

- Node.js 18 ou posterior (LTS atual recomendado)
- npm

### Comandos de build

```bash
npm install          # Instalar dependências
npm run dev          # Build de desenvolvimento (observação de arquivos)
npm run build        # Build de produção
npm test             # Executar testes unitários
npm run lint         # Executar ESLint
npm run dev:copy     # Copiar artefatos compilados para o cofre local
```

O `npm run dev:copy` usa `C:\Nonlinear\ob` e `.obsidian` por padrão. Defina `OBSIDIAN_VAULT_PATH` ou `OBSIDIAN_CONFIG_DIR` quando seu cofre usar caminhos diferentes.

### Fluxo de versão

Atualize a versão em `package.json`, execute o pipeline de validação e envie uma tag SemVer como `2.4.0`. O GitHub Actions então valida a tag, compila os artefatos da versão, cria atestações de procedência e publica `main.js`, `manifest.json` e `styles.css` no release do GitHub.

### Estrutura do projeto

```
obsidian-codespace/
├── src/
│   ├── main.ts                # Entrada do plugin: registro de comandos, montagem de views e gerenciamento de ciclo de vida
│   ├── code_view.ts           # Núcleo do editor: ambiente de edição CodeMirror 6
│   ├── dashboard_view.ts      # View do painel: indexação de arquivos e interface de gerenciamento
│   ├── outline_view.ts        # View de estrutura: navegação estrutural na barra lateral
│   ├── code_parser.ts         # Parser de sintaxe: análise estrutural multilinguagem
│   ├── code_embed.ts          # Processamento de incorporações: lógica de referência e pré-visualização
│   ├── code_embed_markdown.ts # Expansão de incorporações para exportação nativa para PDF e fluxos relacionados
│   ├── scrollbar_visibility.ts # Estado de visibilidade da barra de rolagem para editores e incorporações
│   ├── native_pdf_export_patch.ts # Integração com Exportar para PDF nativo e patch da cadeia de exportação
│   ├── dropdown.ts            # Componentes de UI: dropdown/seleção múltipla
│   ├── folder_filter_modal.ts # Modal de filtro de pastas
│   ├── ignore_manager_modal.ts # Modal de gerenciamento de arquivos/pastas ignorados
│   ├── external_mount.ts      # Montagens externas: gerenciamento de symlink/junction
│   ├── settings.ts            # Painel de configurações: configuração do plugin
│   ├── terminal/              # Terminal integrado (somente desktop)
│   │   ├── types.ts           # Tipos compartilhados de terminal e interface pty local
│   │   ├── node_access.ts     # Acesso às APIs do Node via window.require em tempo de execução
│   │   ├── binary_manager.ts  # Download/verificação/extração do prebuild do node-pty
│   │   ├── conout_patch.ts    # Patch do renderizador ConPTY do Windows (node-pty)
│   │   ├── pty_host.ts        # Wrapper do PtyProcess: carregar node-pty, spawn/kill
│   │   ├── shell_detector.ts  # Detecção do shell padrão da plataforma
│   │   ├── terminal_theme.ts  # Mapeamento das variáveis de tema do Obsidian para o tema do xterm
│   │   ├── terminal_component.ts # Wrapper do xterm.js: attach/detach/fit
│   │   ├── session_manager.ts # TerminalManager: ciclo de vida global das sessões
│   │   ├── terminal_panel.ts  # Painel compartilhado com barra de abas (hosts incorporado + view)
│   │   └── terminal_view.ts   # ItemView de terminal independente
│   └── lang/
│       ├── helpers.ts         # Auxiliares de localização
│       └── locale/
│           ├── en.ts          # Strings em inglês
│           └── zh-cn.ts       # Strings em chinês
├── styles.css                 # Entrada de estilos
├── manifest.json              # Metadados do plugin
└── package.json               # Dependências e scripts
```

---


## Contribuindo

Contribuições via Pull Request são bem-vindas!

Certifique-se de que:
1. O código passa nas verificações do ESLint
2. Segue o estilo de código existente
3. As mensagens de commit são claras e descritivas

Para problemas ou sugestões, use [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues).
- Autor: unlinearity
- Email: unlinearity@gmail.com
- [AGPL-3.0-or-later](LICENSE) - Copyright (c) 2026 unlinearity

Limitações conhecidas:
- O conteúdo dos arquivos de código atualmente não é indexado pelo motor de busca global do Obsidian. Use o painel de busca e substituição do Code Space para o arquivo atual.
- O terminal integrado é somente para desktop; se o download dos arquivos de suporte falhar no Windows ARM64, relate em uma issue.

---

## Agradecimentos

<p align="center">O Code Space também está hospedado no <a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace">AtomGit</a>, onde você pode navegar pelo código-fonte.</p>
<p align="center"><a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace"><img alt="AtomGit G-Star" src="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace/star/new_badge.svg"></a></p>

### Obrigado pelo apoio

> Obrigado a todos que relataram problemas e contribuíram com pull requests.

Se este plugin for útil ou divertido de usar, você pode me comprar um chá de bolhas. ❤️ (QR code de gorjeta via WeChat abaixo)

<p align='center'><img src='docs/img/wechat-tip.png' width=60%></p>

### Projetos referenciados

Este projeto é construído sobre os seguintes excelentes projetos:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): Fornece poderosa extensibilidade de plugins.
- [CodeMirror 6](https://codemirror.net/): Engine de editor de código flexível e moderna.
- [Lezer](https://lezer.codemirror.net/): Sistema eficiente de análise incremental de código.
- [xterm.js](https://github.com/xtermjs/xterm.js/): Frontend de terminal para o terminal integrado.
- [node-pty](https://github.com/microsoft/node-pty): Backend de pseudo-terminal da Microsoft; seu patch para Windows dentro do Obsidian é adaptado de [lean-obsidian-terminal](https://github.com/sdkasper/lean-obsidian-terminal).
- [TypeScript](https://www.typescriptlang.org/): Fornece robusta segurança de tipos.
- [esbuild](https://esbuild.github.io/): Empacotador JavaScript extremamente rápido.

---

## Histórico de estrelas

<!-- star-history:start -->
[![Star History](https://raw.githubusercontent.com/UNLINEARITY/Obsidian-CodeSpace/main/assets/star-history/star-history.png)](https://star-history.com/#UNLINEARITY/Obsidian-CodeSpace&Date)
<!-- star-history:end -->

---

**Torne o gerenciamento de código no Obsidian simples e eficiente!**
