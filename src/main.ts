import { Notice, Plugin } from 'obsidian';

import commands from './commands';
import ThemeUpdaterSettingTab from './settings';
import type {
	ObsidianVaultTheme,
	ThemeUpdaterSettings,
	UpdateItem,
} from './types';
import ThemeUpdaterView from './ui/updater-leaf';
import listUpdates from './utils/list-updates';
import loadThemes from './utils/load-themes';
import stringToFragment from './utils/string-to-fragment';

const DEFAULT_SETTINGS: ThemeUpdaterSettings = {
	notifyOnNewUpdate: true,
	checkOnStartup: true,
};

export const THEME_UPDATER_VIEW_TYPE = 'theme-updater-ui';

export default class ThemeUpdater extends Plugin {
	settings: ThemeUpdaterSettings;

	updates: UpdateItem[];
	themes: ObsidianVaultTheme[];

	async onload() {
		await this.loadSettings();

		// Register the view
		this.registerView(
			THEME_UPDATER_VIEW_TYPE,
			(leaf) => new ThemeUpdaterView(this, leaf),
		);

		// Load after layout ready
		this.app.workspace.onLayoutReady(async () => {
			if (this.settings.checkOnStartup) {
				await this.checkForUpdates();
			}
		});

		for (const CommandClassItem of commands) {
			this.addCommand(new CommandClassItem(this));
		}

		const hourlyInterval = window.setInterval(
			this.checkForUpdates,
			1000 * 60 * 60,
		);

		this.registerInterval(hourlyInterval);

		this.addSettingTab(new ThemeUpdaterSettingTab(this.app, this));
	}

	async checkForUpdates(manual = false) {
		this.themes = await loadThemes(this.app);
		this.updates = await listUpdates(this.themes);

		if (this.updates.length === 0) {
			if (manual) {
				new Notice('No theme updates found');
			}

			return;
		}

		if (this.settings.notifyOnNewUpdate) {
			this.notifyAboutUpdates();
		}
	}

	showThemeUpdaterView() {
		this.app.workspace.getLeaf('tab').setViewState({
			type: THEME_UPDATER_VIEW_TYPE,
			active: true,
		});
	}

	async notifyAboutUpdates() {
		const buttonID = 'theme-updater-notification-button';

		new Notice(
			stringToFragment(
				`You have ${this.updates.length} theme update${
					this.updates.length > 1 ? 's' : ''
				} available.<br/><a id="${buttonID}">View updates</a>`,
			),

			15000,
		);

		const buttonEl = document.getElementById(buttonID);

		if (buttonEl) {
			// Bind the method to preserve the this context when running from top level Redux store middleware
			buttonEl.addEventListener('click', this.showThemeUpdaterView.bind(this));

			// Clean up the button and listener after 15 seconds
			setTimeout(() => {
				buttonEl.removeEventListener(
					'click',
					this.showThemeUpdaterView.bind(this),
				);
				buttonEl.remove();
			}, 15000);
		}
	}

	onunload() {
		// Close all views
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof ThemeUpdaterView) {
				this.app.workspace.detachLeavesOfType(THEME_UPDATER_VIEW_TYPE);
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
