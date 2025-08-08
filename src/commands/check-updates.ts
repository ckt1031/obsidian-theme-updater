import type { Command } from 'obsidian';

import type ThemeUpdater from '@/main';

export default class CheckUpdatesCommand implements Command {
	id = 'check-updates';
	icon = 'refresh';
	name = 'Check for updates';

	plugin: ThemeUpdater;

	constructor(plugin: ThemeUpdater) {
		this.plugin = plugin;
	}

	callback() {
		this.plugin.checkForUpdates();
	}
}
