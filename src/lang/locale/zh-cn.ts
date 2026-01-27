export default {
    // Settings
    SETTINGS_HEADING: 'Code Space 设置',
    SETTINGS_EXTENSIONS_NAME: '管理的文件后缀',
    SETTINGS_EXTENSIONS_DESC: '用逗号分隔的文件后缀列表 (例如: py, js, cpp)。修改后需要重启插件以生效文件关联。',
    SETTINGS_EXTENSIONS_PLACEHOLDER: '例如: py, js, c, cpp',
    SETTINGS_LINE_NUMBERS_NAME: '显示行号',
    SETTINGS_LINE_NUMBERS_DESC: '在代码编辑器中显示行号。',
    SETTINGS_MAX_EMBED_LINES_NAME: '引用最大显示行数',
    SETTINGS_MAX_EMBED_LINES_DESC: '嵌入式代码预览的最大显示行数（0 为不限制）。',
    SETTINGS_MAX_EMBED_LINES_PLACEHOLDER: '30',

    // Dashboard
    VIEW_TITLE: 'Code Space',
    BUTTON_OPEN_SETTINGS: '打开设置',
    BUTTON_CREATE_FILE: '创建代码文件',
    SUBTITLE_MANAGED_FILES: '个代码文件',
    TOOLBAR_SEARCH_PLACEHOLDER: '搜索文件...',
    TOOLBAR_FILTER_ALL: '所有语言',
    TOOLBAR_SORT_DATE: '修改日期',
    TOOLBAR_SORT_NAME: '文件名',
    TOOLBAR_SORT_TYPE: '文件类型',
    TOOLBAR_SORT_TOGGLE: '切换排序',
    EMPTY_STATE_NO_FILES: '没有找到匹配的文件。',

    // Modals
    MODAL_RENAME_TITLE: '重命名文件',
    MODAL_RENAME_PLACEHOLDER: '输入新名称 (不含后缀)',
    MODAL_RENAME_BUTTON_SUBMIT: '确定',
    MODAL_RENAME_BUTTON_CANCEL: '取消',
    MODAL_CREATE_TITLE: '创建文件',
    MODAL_CREATE_LABEL: '文件名:',
    MODAL_CREATE_DESC: '输入文件名及后缀 (例如 test.py, script.js)。默认为 .md',
    MODAL_CREATE_BUTTON_SUBMIT: '创建',
    MODAL_CREATE_BUTTON_CANCEL: '取消',
    MODAL_MOVE_TITLE: '移动文件到',
    MODAL_MOVE_PLACEHOLDER: '输入文件夹名称',

    // Context Menu
    MENU_RENAME: '重命名',
    MENU_MOVE: '移动文件到',
    MENU_OPEN_DEFAULT: '用默认应用打开',
    MENU_REVEAL: '在文件列表中显示',
    MENU_DELETE: '删除',

    // Commands
    CMD_OPEN_DASHBOARD: '打开主面板 (Dashboard)',
    CMD_CREATE_FILE: '创建代码文件',
    CMD_RELOAD_PLUGIN: '重载插件',
    CMD_TOGGLE_OUTLINE: '切换大纲视图 (Outline)',
    CMD_SEARCH_REPLACE: '搜索与替换',
    RIBBON_OPEN_DASHBOARD: '打开 Code Space 主面板',

    // Notices
    NOTICE_RELOAD_START: '正在重载 Code Space...',
    NOTICE_RELOAD_SUCCESS: 'Code Space 重载成功！',
    NOTICE_RELOAD_FAIL: 'Code Space 重载失败',
    NOTICE_CREATE_SUCCESS: '已创建',
    NOTICE_CREATE_FAIL: '创建文件失败，文件可能已存在。',
    NOTICE_RENAME_SUCCESS: '已重命名为',
    NOTICE_RENAME_FAIL: '重命名文件失败',
    NOTICE_MOVE_SUCCESS: '已移动到',
    NOTICE_MOVE_FAIL: '移动文件失败',

    // Embed
    EMBED_TOOLTIP_OPEN: '点击打开文件',
    EMBED_LINES_SHOWING: '显示 {0} / {1} 行',
    EMBED_LINES_TOTAL: '共 {0} 行',

    // Outline
    OUTLINE_TITLE: '代码大纲',
    OUTLINE_EMPTY_OPEN: '打开一个代码文件以查看结构',
    OUTLINE_EMPTY_NO_SYMBOLS: '当前文件中未找到符号',

    // Editor View
    VIEW_DEFAULT_TITLE: 'Code Space',
    SEARCH_PLACEHOLDER: '搜索',
    SEARCH_REPLACE_PLACEHOLDER: '替换',
    SEARCH_BTN_CASE: '区分大小写',
    SEARCH_BTN_REGEX: '使用正则表达式',
    SEARCH_BTN_WHOLE: '全字匹配',
    SEARCH_BTN_PREV: '上一个匹配',
    SEARCH_BTN_NEXT: '下一个匹配',
    SEARCH_BTN_CLOSE: '关闭',
    SEARCH_BTN_REPLACE: '替换',
    SEARCH_BTN_REPLACE_ALL: '全部替换',
    HEADER_ACTION_SEARCH: '搜索',
    HEADER_ACTION_OUTLINE: '大纲',
    HEADER_ACTION_PLAY: '用默认应用打开',
    NOTICE_MODIFIED_EXTERNALLY: '文件已被外部修改。当前有未保存的更改。',
    NOTICE_SAVE_FAIL: '保存文件失败',
};
