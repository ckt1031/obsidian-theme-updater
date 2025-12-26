import type { Command } from 'obsidian';

import type ThemeUpdater from '@/main';

export default class ViewUpdatesCommand implements Command {
	id = 'view-updates';
	icon = 'theme-update-icon';
	name = 'View updates';

	plugin: ThemeUpdater;

	constructor(plugin: ThemeUpdater) {
		this.plugin = plugin;
	}

	callback() {
		this.plugin.showThemeUpdaterView();
	}
}
