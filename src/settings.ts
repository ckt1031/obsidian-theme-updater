import { type App, PluginSettingTab, Setting } from 'obsidian';

import type MyPlugin from './main';

export default class ThemeUpdaterSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Check for updates on startup')
			.setDesc(
				'Themes will be checked when the plugin is loaded, disable to check manually',
			)
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.checkOnStartup);
				toggle.onChange(async (value) => {
					this.plugin.settings.checkOnStartup = value;
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Notify on new update')
			.setDesc('A notification will be shown when new updates are found')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.notifyOnNewUpdate);
				toggle.onChange(async (value) => {
					this.plugin.settings.notifyOnNewUpdate = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
