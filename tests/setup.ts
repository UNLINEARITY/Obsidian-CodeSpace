// vitest 全局 setup：为 node 测试环境预置 window 全局。
// src/lang/helpers.ts 在模块加载时访问 window.moment.locale()，
// 任何间接触及该模块的测试都需要它先于测试文件导入执行。

type WindowLike = {
	require?: (module: string) => unknown;
	moment: { locale(): string };
};

const existing = (globalThis as { window?: WindowLike }).window;
if (!existing) {
	(globalThis as { window: WindowLike }).window = {
		moment: { locale: () => "en" },
	};
}

// xterm 系列包的 UMD 包装在模块加载期访问 self（浏览器全局）
if (typeof (globalThis as { self?: unknown }).self === "undefined") {
	(globalThis as { self: unknown }).self = globalThis;
}
