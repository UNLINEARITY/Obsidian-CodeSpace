# Code Space

<h1 align="center">Soporte profesional de archivos de código para Obsidian</h1>

<p align="center">Edición, incrustación, montajes externos e integración de terminal.</p>

<p align="center"><a href="README.md">English</a> | <a href="README_CN.md">简体中文</a> | <a href="README_JA.md">日本語</a> | <a href="README_KO.md">한국어</a> | <a href="README_DE.md">Deutsch</a> | Español | <a href="README_PTBR.md">Português (Brasil)</a></p>

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

## Sobre el complemento

> Code Space está disponible en el directorio oficial de complementos comunitarios de Obsidian.🎉

El flujo de trabajo nativo de Obsidian se centra en notas Markdown, por lo que su soporte para explorar, gestionar y editar archivos de código de forma centralizada, navegar por su estructura y exportar código incrustado es limitado. Code Space nació para cubrir ese vacío.

**Las cinco capas del «Space»:**

1. **Espacio de gestión**: Ofrece un índice unificado y una zona de gestión para archivos de código, para explorarlos mediante un panel visual.
2. **Espacio de edición**: Abre archivos de código en un entorno dedicado para verlos y editarlos.
3. **Espacio de incrustación**: Trabaja con las funciones nativas de Obsidian para admitir referencias, vistas previas de código incrustado y exportación nativa a PDF como bloques de código reales.
4. **Espacio de montaje**: Monta carpetas externas en la bóveda mediante symlinks/junctions del sistema para gestionar código entre proyectos.
5. **Espacio de terminal**: Ejecuta un shell real del sistema (PowerShell, zsh, bash) dentro del editor, en escritorio.

<p align='center'><img src='docs\img\pre0.png' width=95%></p>

---

## Funciones principales

### 1. Espacio de gestión de archivos de código
Ofrece un panel visual para indexar y gestionar de forma unificada los archivos de código de la bóveda.

- **Panel visual**: Una interfaz de gestión con disposición en cuadrícula y resumen del estado de los archivos.
- **Herramientas de gestión integradas**: El encabezado da acceso rápido a **Ajustes**, **Crear archivo** y la gestión de elementos ignorados.
- **Filtrado dinámico multidimensional**: Filtra por carpeta y extensión, busca por nombre o ruta, y ordena por fecha de modificación, nombre o tipo.
- **Operaciones de archivo estándar**: Usa operaciones compatibles con Obsidian como renombrar, mover, eliminar, revelar en la navegación y abrir en la aplicación predeterminada.
- **Memoria de estado del panel**: El estado de búsqueda, filtro y ordenación se guarda con los ajustes del complemento para un uso repetido más fluido.

<p align='center'><img src='docs\img\pre1.png' width=95%></p>


### 2. Espacio de edición de código profesional
Ofrece un entorno tipo IDE para ver y editar código.

- **Resaltado de sintaxis**: Basado en CodeMirror 6, con resaltado preciso para muchos lenguajes.
- **Navegación estructural**: Vista de esquema de código que analiza clases, funciones y métodos con navegación por clic.
- **Búsqueda y sustitución avanzadas**: Panel de búsqueda dedicado con expresiones regulares, distinción de mayúsculas, palabra completa, sustitución única y sustitución total.
- **Guardado manual**: Ctrl/Cmd+S con aviso de estado no guardado y protección de la posición del cursor para evitar saltos de la vista.
- **Ayudas básicas de edición**: Sangría automática, emparejamiento de llaves, plegado de código y números de línea.
- **Optimizaciones de interacción**: Escalado de fuente con Ctrl/Cmd+rueda y botón de búsqueda flotante de acceso rápido.

<p align='center'><img src='docs\img\pre22.png' width=95%></p>

### 3. Espacio de incrustación nativo de Obsidian

Incrusta y previsualiza código en Markdown, incluidos fragmentos concretos de archivos de código:

- **Referencias de archivos**: Enlaza archivos de código con `[[nombre]]`.
- **Incrustación de código**: Incrusta vistas previas en Markdown con `![[nombre]]`.
- **Rangos de líneas**: Indica líneas de inicio o rangos para incrustar fragmentos con precisión.
- **Vista previa rápida**: Pasa el cursor sobre los enlaces para previsualizar el contenido del código.
- **Abrir el código de varias formas**: Haz clic en el encabezado de la incrustación para abrir el archivo fuente. Ctrl/Cmd+clic lo abre en una pestaña nueva, Ctrl/Cmd+Shift+clic en una ventana nueva y Ctrl/Cmd+Alt/Opción+clic en un panel dividido.
- **Sincronización de vistas previas**: Cuando cambia un archivo de código fuente, las vistas previas incrustadas relacionadas se vuelven a renderizar.
- **Exportación nativa a PDF**: Usa el **Exportar a PDF** oficial de Obsidian y las referencias a archivos de código se exportan como bloques de código reales en lugar de tarjetas grises de archivo.
- **Mayor compatibilidad de hosts**: Las vistas previas de código incrustado se comportan de forma más fiable en modo lectura, ventanas emergentes y otros hosts que reutilizan la canalización de Markdown de Obsidian.
- **Editar bloques de código en Code Space**: Coloca el cursor dentro de un bloque de código cercado de una nota y selecciona el botón de código en la cabecera de la nota (a la izquierda del conmutador de lectura/edición), o ejecuta **Editar bloque de código en Code Space** desde la paleta de comandos o el menú contextual del editor. El bloque se abre en una ventana del editor de Code Space con resaltado de sintaxis. Al guardar o cerrar la ventana, el código se escribe de vuelta en la nota, donde se puede deshacer. La línea de la cerca se conserva tal cual, y se admiten bloques de código dentro de callouts, citas y listas.

<p align='center'><img src='docs\img\pre3.png' width=95%></p>

**Sintaxis de incrustación admitida:**

| Sintaxis | Descripción |
|--------|-------------|
| `![[test.py]]` | Incrusta el archivo completo |
| `![[test.py#20]]` | Muestra desde la línea 20 hasta el final del archivo |
| `![[test.py#L20]]` | Igual que la anterior (estilo GitHub con prefijo `L`) |
| `![[test.py#20-40]]` | Muestra las líneas 20 a 40 |
| `![[test.py#L20-L40]]` | Igual que la anterior (estilo GitHub) |
| `![[test.py#L20-40]]` | El formato mixto también se admite |

**Comportamiento de los rangos de líneas:**
- En modo rango, se muestra el rango completo especificado ignorando el ajuste «Límite de líneas de incrustación»
- Si la línea final supera la longitud del archivo, se trunca automáticamente al final del archivo
- Si la línea final es menor que la inicial, se ajusta automáticamente a la visualización de una sola línea
- Los números de línea coinciden con los del archivo original

Consejo: Cuando una nota contiene incrustaciones de archivos de código, expórtala con el **Exportar a PDF** oficial de Obsidian. Code Space mantiene esas incrustaciones como bloques de código reales en el PDF final, conservando la disposición y la paginación nativas de Obsidian.

<p align='center'><img src='docs\img\pre8.png' width=90%></p>

### 4. Espacio de montaje externo (solo escritorio)

Trabaja más allá de los límites de la bóveda para gestionar código de proyectos externos.

- **Symlinks/junctions**: Crea y gestiona symlinks (macOS/Linux) o junctions de directorio (Windows) desde la página de ajustes para montar carpetas externas en la bóveda
- **Flujo de trabajo integrado**: Los archivos de código de las carpetas montadas aparecen en el panel con las funciones de Code Space, como edición, incrustación y navegación por esquema
- **Sincronización bidireccional**: Las ediciones hechas desde Obsidian o desde la carpeta externa afectan a los mismos archivos subyacentes
- **Trabajo entre proyectos**: Gestiona repositorios de código distribuidos directamente sin copiar el código del proyecto a la bóveda
- **Gestión del estado de montaje**: Consulta el estado, elimina o renlaza montajes y elige el modo automático, symlink o junction en Windows

<p align='center'><img src='docs\img\pre7.png' width=98%></p>

**Uso:**
1. Abre **Ajustes > Complementos comunitarios > Code Space**
2. Activa **Carpetas externas**
3. Haz clic en **Añadir carpeta externa**, elige una carpeta de origen fuera de la bóveda y define su ubicación de montaje dentro de la bóveda
4. Code Space crea el enlace, guarda la configuración e indexa los archivos de código de la carpeta montada

**¡Notas importantes!**
- **Solo escritorio**: Los montajes externos no están disponibles en iOS/Android debido a restricciones de sandbox
- **Riesgo de seguridad**: Los montajes externos permiten al complemento acceder a archivos fuera de la bóveda. **Monta solo carpetas de tu confianza**
- **Validación de rutas**: El origen debe ser una carpeta absoluta fuera de la bóveda. Code Space rechaza automontajes de la bóveda, ciclos padre/hijo y rutas de montaje anidadas bajo otro symlink o junction
- **Eliminación segura**: Code Space elimina un montaje solo cuando el enlace sigue apuntando a su origen configurado. Un enlace modificado o creado por el usuario se notifica como destino no coincidente y se deja intacto
- **Diferencias de permisos**: En Windows, los symlinks pueden requerir modo de desarrollador o privilegios de administrador. El modo automático prueba primero symlink y recurre a junction
- **Problemas de rendimiento**: Puedes usarlo para repositorios ligeros o coordinación multirrepositorio, pero evita montar demasiados archivos o directorios muy grandes
- **Estabilidad de rutas**: Mover o renombrar carpetas externas romperá el montaje y exigirá reconfigurarlo
- **Problemas de sincronización**: Si las carpetas externas están en directorios sincronizados en la nube (p. ej., Dropbox, OneDrive), asegúrate de que Obsidian y las carpetas externas estén sincronizados para evitar conflictos. Ten en cuenta además que algunos servicios en la nube siguen los symlinks dentro de la bóveda y suben toda la carpeta montada a la nube; si no lo deseas, excluye las carpetas montadas de ese servicio de sincronización

### 5. Terminal integrado (solo escritorio)

Ejecuta un shell real del sistema dentro de Code Space, basado en xterm.js y node-pty.

- **Terminal PTY real**: Los programas interactivos, colores, control de trabajos y paginación funcionan como en un terminal nativo (ConPTY en Windows, pty de Unix en macOS/Linux)
- **Dos hosts, un conjunto de sesiones**: Alterna un panel incrustado en la parte inferior del editor de código o abre una pestaña de terminal independiente en el área principal. Las sesiones siguen ejecutándose al cerrar paneles o vistas
- **Sesiones con varias pestañas**: Crea, cambia y cierra sesiones de terminal desde la barra de pestañas; las sesiones terminadas se marcan y siguen siendo legibles hasta cerrarlas
- **Sigue tu contexto**: Los nuevos terminales empiezan en la carpeta del archivo abierto actualmente (los montajes externos se resuelven a su ubicación real en disco), con la raíz de la bóveda como alternativa
- **Consciente del tema**: Los colores y la fuente monoespaciada siguen tu tema de Obsidian, también en ventanas emergentes
- **Panel redimensionable**: Arrastra el asa sobre el panel incrustado para ajustar su altura
- **Arrastrar archivos como rutas**: Arrastra archivos o carpetas desde la lista de archivos de Obsidian o el gestor de archivos del sistema a un terminal para pegar sus rutas absolutas reales, entrecomilladas según el shell actual (los montajes externos se resuelven a su ubicación real en disco)

**Uso:**
1. Activa el terminal en **Ajustes > Code Space > Terminal** (desactivado por defecto)
2. Selecciona **Descargar** junto a «Archivos de soporte» — Code Space descarga un pequeño paquete de plataforma (véanse las notas); el botón del encabezado, los comandos y los demás ajustes aparecen cuando está listo
3. Abre un archivo de código y selecciona el botón de terminal del encabezado del editor, o ejecuta **Code Space: Alternar panel de terminal**
4. O ejecuta **Code Space: Abrir terminal** para una pestaña de terminal independiente (cada pestaña es un terminal a pantalla completa)
5. Cierra una pestaña de terminal para detener ese terminal, o ejecuta **Code Space: Cerrar todas las sesiones de terminal** para detenerlo todo

**¡Notas importantes!**
- **Solo escritorio**: El terminal no está disponible en iOS/Android
- **Descarga explícita**: Un PTY real requiere un asistente nativo (`node-pty`). La tienda de complementos de Obsidian solo distribuye JavaScript, así que el asistente se descarga únicamente al seleccionar **Descargar** en **Ajustes > Terminal**: un paquete precompilado (~1-3 MB) para tu plataforma desde las versiones de GitHub de este repositorio, verificado con suma de comprobación SHA-256 y almacenado en la carpeta del complemento. Los comandos y botones del terminal nunca descargan nada por sí solos
- **Plataformas admitidas**: Windows x64/ARM64, macOS x64/ARM64, Linux x64. Otras arquitecturas de Linux aún no se admiten
- **Requisito de Linux**: Instalar el paquete de soporte en Linux requiere la utilidad `unzip` (preinstalada en la mayoría de distribuciones)
- **Detección de shell**: PowerShell (`pwsh.exe` → `powershell.exe` → `cmd.exe`) en Windows, `$SHELL` → `zsh` en macOS, `$SHELL` → `bash` en Linux. Define un ejecutable explícito en **Ajustes > Terminal**
- **Foco del teclado**: Mientras el terminal tiene el foco, las teclas (incluidas las combinaciones de Ctrl/Cmd) van al shell, como en VS Code. Selecciona el editor para devolver las teclas
- **Seguridad**: El terminal se ejecuta con tus permisos de usuario y puede acceder a archivos fuera de la bóveda. Trata los comandos pegados con el mismo cuidado que en cualquier terminal del sistema

---
## Configuración

Accede a la configuración en **Ajustes > Complementos comunitarios > Code Space**:

- **Extensiones gestionadas**: Especifica las extensiones de archivo gestionadas por Code Space (separadas por comas). Los cambios actualizan las asociaciones de archivos gestionados.
- **Mostrar números de línea**: Alterna los números de línea (predeterminado: activado)
- **Tamaño de fuente del editor**: Tamaño de fuente del editor de código (predeterminado: 18px, rango: 9-36px)
- **Tamaño de fuente de las incrustaciones**: Tamaño de fuente de los bloques de código incrustados en Markdown (predeterminado: 15px, rango: 9-36px)
- **Límite de líneas de incrustación**: Máximo de líneas mostradas en las vistas previas incrustadas (predeterminado: 20, 0 para ilimitado)
- **Ubicación de archivos de código nuevos**: Crea los archivos de código nuevos en una carpeta personalizada o en la carpeta del archivo activo
- **Carpetas externas (solo escritorio)**: Monta carpetas externas en la bóveda mediante symlinks/junctions del sistema. Puedes activar o desactivar la función, añadir, quitar, renlazar e inspeccionar montajes.
- **Terminal (solo escritorio)**: Activa el terminal integrado (desactivado por defecto; al activarlo se muestran el botón y los comandos del terminal), elige un ejecutable de shell (vacío para detección automática), define el tamaño de fuente, el historial y el máximo de sesiones simultáneas, y gestiona los archivos de soporte descargados (volver a descargar o eliminar).

Nota: Los montajes externos permiten acceder a archivos fuera de la bóveda. Monta solo carpetas de tu confianza.

## Lenguajes admitidos (extensible)

### 1. Extensiones admitidas por defecto

| Lenguaje | Extensiones |
|------|--------|
| Python | `.py` |
| C/C++ | `.c`, `.cpp`, `.h`, `.hpp`, `.cc`, `.cxx` |
| JavaScript/TypeScript | `.js`, `.ts`, `.jsx`, `.tsx`, `.mjs`, `.cjs`, `.json` |
| Tecnologías web | `.html`, `.htm`, `.xhtml`, `.css`, `.scss`, `.sass`, `.less` |
| Programación de sistemas | `.rs`, `.go`, `.java`, `.cs` |
| Datos/Configuración | `.sql`, `.yaml`, `.yml`, `.xml` |
| Scripts | `.php`, `.r`, `.rb`, `.sh` |

**Puedes añadir más extensiones en los ajustes del complemento. Code Space puede gestionar archivos con extensiones personalizadas.**
- Los archivos de texto y código se abren en la interfaz del editor de Code Space
- Los archivos binarios (p. ej., imágenes o PDF) se abren con el visor nativo de Obsidian o la aplicación predeterminada del sistema. También puedes usar el panel para gestionar adjuntos como PDF

<p align='center'><img src='docs\img\pre4.png' width=95%></p>

### 2. Extensiones de texto/código adicionales con resaltado de sintaxis

Añade las siguientes extensiones en **Ajustes > Code Space > Extensiones gestionadas** para activarlas:

| Lenguaje | Extensiones | Resaltado reutilizado de |
|------|--------|-------------|
| **Familia XML** | `.xsd`, `.xsl`, `.xslt`, `.wsdl`, `.plist`, `.csproj`, `.vcxproj`, `.props`, `.targets`, `.config` | XML |
| | `.urdf`, `.xacro` | XML |
| **Familia C/C++** | `.ino`, `.pde`, `.nut` | C/C++ |
| | `.cu`, `.cuh`, `.glsl`, `.vert`, `.frag`, `.hlsl`, `.mm`, `.swift` | C/C++ |
| **Familia Java** | `.kt`, `.kts`, `.scala`, `.groovy`, `.gradle` | Java |
| **Frameworks frontend** | `.vue`, `.svelte`, `.astro` | JavaScript |
| **Variantes de JSON** | `.json5`, `.jsonc` | JavaScript |
| **Familia Python** | `.pyx`, `.pxd`, `.pxi`, `.ipy` | Python |
| **Archivos de configuración** | `.toml`, `.ini`, `.cfg`, `.conf` | YAML |
| **Scripts de shell** | `.bash`, `.zsh` | Shell |
| **PowerShell** | `.ps1`, `.psm1`, `.psd1` | PowerShell |
| **Fortran** | `.f`, `.for`, `.f90`, `.f95`, `.f03`, `.f08` | Dedicado |
| **Otros lenguajes** | `.cmake`, `.dockerfile`, `.diff`, `.patch`, `.lua`, `.pl`, `.pm`, `.erb`, `.m` | Dedicado |

### 3. Soporte de archivos binarios (abiertos con el visor nativo de Obsidian)

Si añades las siguientes extensiones a la lista gestionada, estos archivos también podrán gestionarse en el panel de Code Space (renombrar, mover, eliminar, etc.). No los abre el editor de Code Space; usan el visor nativo de Obsidian o la aplicación predeterminada del sistema.

| Tipo | Extensiones |
|------|--------|
| Imágenes | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.bmp`, `.ico`, `.tiff`, `.psd` |
| Documentos | `.pdf` |
| Audio | `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac`, `.m4a`, `.wma` |
| Vídeo | `.mp4`, `.avi`, `.mkv`, `.mov`, `.wmv`, `.flv`, `.webm`, `.m4v` |
| Archivos comprimidos | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.xz` |
| Office | `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` |
| Otros | `.exe`, `.dll`, `.so`, `.dylib`, `.bin`, `.dat` |

---

## Atajos de teclado admitidos

### 1. Comandos del complemento

<p align='center'><img src='docs\img\pre5.png' width=98%></p>

| Ruta del comando | Función |
|---------|------|
| `Ctrl+P` → «Abrir panel» | Abre el panel de gestión de código |
| `Ctrl+P` → «Crear archivo de código» | Crea un archivo de código nuevo |
| `Ctrl+P` → «Recargar complemento» | Recarga el complemento |
| `Ctrl+P` → «Alternar esquema de código» | Alterna la vista de esquema de código |
| `Ctrl+P` → «Buscar y reemplazar» | Abre el panel de búsqueda y sustitución en el editor de Code Space actual |
| `Ctrl+P` → «Editar bloque de código en Code Space» | Edita el bloque de código del cursor en una ventana del editor de Code Space (disponible cuando el cursor está dentro de un bloque de código) |
| `Ctrl+P` → «Abrir terminal» | Abre una pestaña de terminal nueva (disponible tras activar el terminal y descargar los archivos de soporte) |
| `Ctrl+P` → «Alternar panel de terminal» | Alterna el panel de terminal incrustado en el editor actual |
| `Ctrl+P` → «Cerrar todas las sesiones de terminal» | Detiene todos los terminales |

---

### 2. Operaciones básicas

| Atajo | Función |
|--------|------|
| `Ctrl/Cmd+S` | Guardar el archivo manualmente |
| `Ctrl/Cmd+Rueda del ratón` | Ajustar el tamaño de fuente (en el terminal: solo el terminal con foco) |
| `Ctrl/Cmd+F` | Buscar |
| `Ctrl+H` / `Cmd+Option+F` | Reemplazar |
| `Ctrl/Cmd+C` | Copiar la selección |
| `Ctrl/Cmd+X` | Cortar la selección |
| `Ctrl/Cmd+V` | Pegar contenido |
| `Ctrl/Cmd+A` | Seleccionar todo |
| `Ctrl/Cmd+Z` | Deshacer |
| `Ctrl+Y` o `Ctrl/Cmd+Shift+Z` | Rehacer |
| `Tab` | Aumentar sangría |
| `Shift+Tab` | Reducir sangría |
| `Enter`           | Nueva línea conservando la sangría |



| Navegación del cursor            |          | Selección y edición              |         |
| --------------- | -------- | ----------------- | ------- |
| `↑` `↓` `←` `→` | Mover el cursor arriba/abajo/izquierda/derecha | `Shift+Flechas`       | Extender la selección    |
| `Home`          | Saltar al inicio de línea    | `Ctrl+Shift+←`    | Seleccionar hasta el inicio de palabra |
| `End`           | Saltar al final de línea    | `Ctrl+Shift+→`    | Seleccionar hasta el final de palabra |
| `Ctrl+←`        | Moverse una palabra a la izquierda | `Ctrl+Shift+Home` | Seleccionar hasta el inicio del archivo |
| `Ctrl+→`        | Moverse una palabra a la derecha | `Ctrl+Shift+End`  | Seleccionar hasta el final del archivo |
| `Ctrl+Home`     | Saltar al inicio del archivo  | `Backspace`       | Borrar el carácter anterior al cursor |
| `Ctrl+End`      | Saltar al final del archivo  | `Delete`          | Borrar el carácter posterior al cursor |
| `Page Up`       | Página arriba     | `Ctrl+Backspace`  | Borrar la palabra anterior al cursor |
| `Page Down`       | Página abajo     | `Ctrl+Delete`     | Borrar la palabra posterior al cursor |


---

## Instalación

### Método 1: Instalar desde los complementos comunitarios de Obsidian (recomendado)

Code Space está disponible en el directorio oficial de complementos comunitarios de Obsidian.

1. Abre **Ajustes > Complementos comunitarios**.
2. Si Obsidian lo pide, desactiva el **Modo restringido**.
3. Haz clic en **Explorar**.
4. Busca «Code Space».
5. Haz clic en **Instalar** y activa el complemento.

### Método 2: Instalación manual

1. Visita [Releases](https://github.com/unlinearity/Obsidian-Codespace/releases/latest).
2. Descarga `main.js`, `manifest.json` y `styles.css`. Colócalos en el directorio de complementos de tu bóveda: `.obsidian/plugins/code-space/`. Si la carpeta `code-space` no existe, créala manualmente.
3. Recarga y activa el complemento en los ajustes de Obsidian.

### Método 3: BRAT

Usa BRAT solo si quieres probar una versión de desarrollo o preliminar. Instala primero el complemento BRAT y luego añade este repositorio como complemento beta: `https://github.com/UNLINEARITY/Obsidian-CodeSpace`, y selecciona la versión más reciente. La mayoría de usuarios debería instalar la versión del complemento comunitario.

<p align='center'><img src='docs\img\pre6.png' width=90%></p>

---

## Desarrollo

### Requisitos de compilación

- Node.js 18 o posterior (se recomienda el LTS actual)
- npm

### Comandos de compilación

```bash
npm install          # Instalar dependencias
npm run dev          # Compilación de desarrollo (observación de archivos)
npm run build        # Compilación de producción
npm test             # Ejecutar pruebas unitarias
npm run lint         # Ejecutar ESLint
npm run dev:copy     # Copiar los artefactos compilados a la bóveda local
```

`npm run dev:copy` usa `C:\Nonlinear\ob` y `.obsidian` por defecto. Define `OBSIDIAN_VAULT_PATH` u `OBSIDIAN_CONFIG_DIR` cuando tu bóveda use rutas distintas.

### Flujo de versiones

Actualiza la versión en `package.json`, ejecuta la canalización de validación y publica una etiqueta SemVer como `2.4.0`. GitHub Actions valida la etiqueta, compila los artefactos, crea atestaciones de procedencia y publica `main.js`, `manifest.json` y `styles.css` en la versión de GitHub.

### Estructura del proyecto

```
obsidian-codespace/
├── src/
│   ├── main.ts                # Entrada del complemento: registro de comandos, montaje de vistas y gestión del ciclo de vida
│   ├── code_view.ts           # Núcleo del editor: entorno de edición CodeMirror 6
│   ├── dashboard_view.ts      # Vista del panel: indexación de archivos e interfaz de gestión
│   ├── outline_view.ts        # Vista de esquema: navegación estructural en la barra lateral
│   ├── code_parser.ts         # Analizador de sintaxis: análisis estructural multilenguaje
│   ├── code_embed.ts          # Procesamiento de incrustaciones: lógica de referencia y vista previa
│   ├── code_embed_markdown.ts # Expansión de incrustaciones para la exportación nativa a PDF y flujos relacionados
│   ├── scrollbar_visibility.ts # Estado de visibilidad de la barra de desplazamiento en editores e incrustaciones
│   ├── native_pdf_export_patch.ts # Integración con Exportar a PDF nativo y parche de la cadena de exportación
│   ├── dropdown.ts            # Componentes de interfaz: desplegable/selección múltiple
│   ├── folder_filter_modal.ts # Modal de filtro de carpetas
│   ├── ignore_manager_modal.ts # Modal de gestión de archivos/carpetas ignorados
│   ├── external_mount.ts      # Montajes externos: gestión de symlink/junction
│   ├── settings.ts            # Panel de ajustes: configuración del complemento
│   ├── terminal/              # Terminal integrado (solo escritorio)
│   │   ├── types.ts           # Tipos compartidos de terminal e interfaz pty local
│   │   ├── node_access.ts     # Acceso a las API de Node mediante window.require en tiempo de ejecución
│   │   ├── binary_manager.ts  # Descarga/verificación/extracción de prebuilds de node-pty
│   │   ├── conout_patch.ts    # Parche del renderizador ConPTY de Windows (node-pty)
│   │   ├── pty_host.ts        # Envoltorio de PtyProcess: cargar node-pty, spawn/kill
│   │   ├── shell_detector.ts  # Detección del shell predeterminado de la plataforma
│   │   ├── terminal_theme.ts  # Correspondencia de variables del tema de Obsidian al tema de xterm
│   │   ├── terminal_component.ts # Envoltorio de xterm.js: attach/detach/fit
│   │   ├── session_manager.ts # TerminalManager: ciclo de vida global de sesiones
│   │   ├── terminal_panel.ts  # Panel compartido con barra de pestañas (hosts incrustado + vista)
│   │   └── terminal_view.ts   # ItemView de terminal independiente
│   └── lang/
│       ├── helpers.ts         # Auxiliares de localización
│       └── locale/
│           ├── en.ts          # Cadenas en inglés
│           └── zh-cn.ts       # Cadenas en chino
├── styles.css                 # Entrada de estilos
├── manifest.json              # Metadatos del complemento
└── package.json               # Dependencias y scripts
```

---


## Contribuir

¡Las contribuciones mediante Pull Request son bienvenidas!

Asegúrate de que:
1. El código pasa las comprobaciones de ESLint
2. Sigues el estilo de código existente
3. Los mensajes de commit son claros y descriptivos

Para problemas o sugerencias, usa [GitHub Issues](https://github.com/unlinearity/Obsidian-Codespace/issues).
- Autor: unlinearity
- Email: unlinearity@gmail.com
- [AGPL-3.0-or-later](LICENSE) - Copyright (c) 2026 unlinearity

Limitaciones conocidas:
- El contenido de los archivos de código actualmente no es indexado por el motor de búsqueda global de Obsidian. Usa el panel de buscar y reemplazar de Code Space para el archivo actual.
- El terminal integrado es solo de escritorio; si la descarga de archivos de soporte falla en Windows ARM64, repórtalo en un issue.

---

## Agradecimientos

<p align="center">Code Space también está alojado en <a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace">AtomGit</a>, donde puedes explorar el código fuente.</p>
<p align="center"><a href="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace"><img alt="AtomGit G-Star" src="https://atomgit.com/UNLINEARITY/Obsidian-CodeSpace/star/new_badge.svg"></a></p>

### Gracias por el apoyo

> Gracias a todos los que reportaron problemas y contribuyeron pull requests.

Si este complemento te resulta útil o divertido, puedes invitarme a un bubble tea. ❤️ (código QR de propina por WeChat abajo)

<p align='center'><img src='docs/img/wechat-tip.png' width=60%></p>

### Proyectos referenciados

Este proyecto se construye sobre los siguientes excelentes proyectos:
- [Obsidian API](https://github.com/obsidianmd/obsidian-api): Proporciona una potente extensibilidad de complementos.
- [CodeMirror 6](https://codemirror.net/): Motor de editor de código flexible y moderno.
- [Lezer](https://lezer.codemirror.net/): Sistema eficiente de análisis incremental de código.
- [xterm.js](https://github.com/xtermjs/xterm.js/): Interfaz de terminal para el terminal integrado.
- [node-pty](https://github.com/microsoft/node-pty): Backend de pseudoterminal de Microsoft; su parche de Windows dentro de Obsidian está adaptado de [lean-obsidian-terminal](https://github.com/sdkasper/lean-obsidian-terminal).
- [TypeScript](https://www.typescriptlang.org/): Proporciona una sólida seguridad de tipos.
- [esbuild](https://esbuild.github.io/): Empaquetador de JavaScript extremadamente rápido.

---

## Historial de estrellas

<!-- star-history:start -->
[![Star History](https://raw.githubusercontent.com/UNLINEARITY/Obsidian-CodeSpace/main/assets/star-history/star-history.png)](https://star-history.com/#UNLINEARITY/Obsidian-CodeSpace&Date)
<!-- star-history:end -->

---

**¡Haz que la gestión de código en Obsidian sea simple y eficiente!**
