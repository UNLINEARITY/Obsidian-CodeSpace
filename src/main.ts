import { Plugin } from 'obsidian';
import { CodeSpaceView, VIEW_TYPE_CODE_SPACE } from "./code_view";

export default class MyPlugin extends Plugin {

	async onload() {
		// 注册自定义视图
		this.registerView(
			VIEW_TYPE_CODE_SPACE,
			(leaf) => new CodeSpaceView(leaf)
		);

		// 注册要接管的文件后缀
		try {
			this.registerExtensions(['py', 'c', 'cpp', 'h', 'hpp'], VIEW_TYPE_CODE_SPACE);
		} catch (e) {
			console.log("Extensions already registered or conflict:", e);
		}
	}

	onunload() {
		// 插件卸载时，Obsidian 会自动处理视图的注销
	}
}