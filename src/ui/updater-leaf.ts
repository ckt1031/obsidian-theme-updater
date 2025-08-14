import { ItemView, type WorkspaceLeaf } from 'obsidian';

import type ThemeUpdater from '@/main';
import { THEME_UPDATER_VIEW_TYPE } from '@/main';
import type { UpdateItem } from '@/types';
import updateTheme, { updateAllThemes } from '@/utils/update-theme';

export default class ThemeUpdaterView extends ItemView {
	plugin: ThemeUpdater;
	isUpdating: boolean = false;
	abortController: AbortController;

	constructor(plugin: ThemeUpdater, leaf: WorkspaceLeaf) {
		super(leaf);
		this.plugin = plugin;
		this.abortController = new AbortController();
	}

	getViewType() {
		return THEME_UPDATER_VIEW_TYPE;
	}

	getDisplayText() {
		return 'Theme Updater';
	}

	async onClose() {
		this.abortController.abort();
	}

	createThemeCard(theme: UpdateItem, container: HTMLElement) {
		const themeCardID = `theme-updater-update-item-${theme.name}`;
		const themeCard = container.createDiv({
			attr: {
				id: themeCardID,
			},
			cls: 'theme-updater-update-item',
		});

		const buttonSplit = themeCard.createDiv({
			cls: 'theme-updater-update-item-button-split',
		});

		// Create flex-row
		const flexRow = buttonSplit.createDiv({
			attr: {
				style: 'display: flex; flex-direction: column; gap: 5px;',
			},
		});

		// Set the theme name
		const themeNameEl = flexRow.createEl('span', { text: theme.name });
		themeNameEl.addClass('theme-updater-update-item-title');

		// Set the theme version
		const themeVersionEl = flexRow.createEl('span', {
			text: `${theme.currentVersion} → ${theme.newVersion}`,
		});
		themeVersionEl.addClass('theme-updater-update-item-version');

		// Link to check repo
		flexRow.createEl('a', {
			text: 'View GitHub repository',
			attr: {
				href: `https://github.com/${theme.repo}`,
			},
		});

		// Button to update the theme
		const updateButton = buttonSplit.createEl('button', {
			text: 'Update',
			attr: {
				...(this.isUpdating && { disabled: true }),
			},
		});

		updateButton.addEventListener('click', async () => {
			this.isUpdating = true;
			this.onOpen(); // Reload the view
			await updateTheme(this.plugin, theme, this.abortController);
			this.isUpdating = false;
			this.onOpen(); // Reload the view
		});
	}

	closeTab() {
		this.plugin.app.workspace.detachLeavesOfType(THEME_UPDATER_VIEW_TYPE);
	}

	async onOpen() {
		// clear the content
		this.contentEl.empty();

		// Close the modal if no updates are available
		if (this.plugin.updates.length === 0) {
			// Set no updates message
			this.contentEl.createEl('p', {
				text: 'No updates available. Check back later.',
				attr: {
					style: 'text-align: center; margin-top: 20px;',
				},
			});
			return;
		}

		// Basic information to show how many updates are available
		const updatesInfoEl = this.contentEl.createDiv();
		updatesInfoEl.setText(
			`You have ${this.plugin.updates.length} theme update${this.plugin.updates.length > 1 ? 's' : ''} available.`,
		);

		const updateItemsContainer = this.contentEl.createDiv(
			'theme-updater-update-items-container',
		);

		for (const update of this.plugin.updates) {
			this.createThemeCard(update, updateItemsContainer);
		}

		// Button: Update all
		const updateAllButton = this.contentEl.createEl('button', {
			text: 'Update all',
			attr: {
				style: 'margin-top: 10px;',
				...(this.isUpdating && { disabled: true }),
			},
		});

		updateAllButton.addEventListener('click', async () => {
			this.isUpdating = true;
			this.onOpen(); // Reload the view
			await updateAllThemes(
				this.plugin,
				this.plugin.updates,
				this.abortController,
			);
			this.closeTab();
		});
	}
}
