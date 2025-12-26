import { addIcon, Notice, Plugin } from 'obsidian';

import themeUpdateIcon from '../icons/theme-update.svg';
import commands from './commands';
import ThemeUpdaterSettingTab from './settings';
import {
	type ObsidianVaultTheme,
	THEME_UPDATER_VIEW_TYPE,
	type ThemeUpdaterSettings,
	type UpdateItem,
} from './types';
import ThemeUpdaterView from './ui/updater-leaf';
import listUpdates from './utils/list-updates';
import loadThemes from './utils/load-themes';
import stringToFragment from './utils/string-to-fragment';

const DEFAULT_SETTINGS: ThemeUpdaterSettings = {
	notifyOnNewUpdate: true,
	checkOnStartup: true,
};

export default class ThemeUpdater extends Plugin {
	settings: ThemeUpdaterSettings;

	updates: UpdateItem[] = [];
	themes: ObsidianVaultTheme[] = [];

	private isLoaded = false;
	private activeNotices: Notice[] = [];
	private ribbonIconEl: HTMLElement | null = null;

	async onload() {
		this.isLoaded = true;

		await this.loadSettings();

		// Register custom icon
		addIcon('theme-update-icon', themeUpdateIcon);

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
			() => this.checkForUpdates(),
			1000 * 60 * 60,
		);

		this.registerInterval(hourlyInterval);

		this.addSettingTab(new ThemeUpdaterSettingTab(this.app, this));
	}

	async checkForUpdates(manual = false) {
		this.themes = await loadThemes(this.app);
		this.updates = await listUpdates(this.themes);

		this.refreshRibbonIcon();

		if (this.updates.length === 0) {
			if (manual) {
				this.activeNotices.push(new Notice('No theme updates found'));
			}

			return;
		}

		if (this.settings.notifyOnNewUpdate) {
			this.notifyAboutUpdates();
		}
	}

	refreshRibbonIcon() {
		if (this.updates.length > 0) {
			if (!this.ribbonIconEl) {
				this.ribbonIconEl = this.addRibbonIcon(
					'theme-update-icon',
					'Theme updates available',
					() => {
						this.showThemeUpdaterView();
					},
				);
			}
		} else {
			if (this.ribbonIconEl) {
				this.ribbonIconEl.remove();
				this.ribbonIconEl = null;
			}
		}
	}

	showThemeUpdaterView() {
		if (!this.isLoaded) {
			this.activeNotices.push(
				new Notice(
					'Theme Updater plugin is disabled. Please enable it to view updates.',
				),
			);
			return;
		}

		// Check if view already exists
		const leaves = this.app.workspace.getLeavesOfType(THEME_UPDATER_VIEW_TYPE);
		if (leaves.length > 0) {
			this.app.workspace.revealLeaf(leaves[0]);
			return;
		}

		// Open the new view
		this.app.workspace.getLeaf('tab').setViewState({
			type: THEME_UPDATER_VIEW_TYPE,
			active: true,
		});
	}

	async notifyAboutUpdates() {
		const buttonID = 'theme-updater-notification-button';

		const notice = new Notice(
			stringToFragment(
				`You have ${this.updates.length} theme update${
					this.updates.length > 1 ? 's' : ''
				} available.<br/><a id="${buttonID}">View updates</a>`,
			),

			15000,
		);

		this.activeNotices.push(notice);

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
		this.isLoaded = false;

		this.activeNotices.forEach((notice) => {
			notice.hide();
		});
		this.activeNotices = [];

		if (this.ribbonIconEl) {
			this.ribbonIconEl.remove();
			this.ribbonIconEl = null;
		}

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
