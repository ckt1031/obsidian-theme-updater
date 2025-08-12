import { Notice } from 'obsidian';

import type ThemeUpdater from '@/main';
import type { UpdateItem } from '@/types';

const RAW_GITHUB_BASE_URL = 'https://raw.githubusercontent.com';

function checkIfThemeIsUpdating(plugin: ThemeUpdater) {
	return plugin.abortController !== null;
}

export default async function updateTheme(
	plugin: ThemeUpdater,
	theme: UpdateItem,
	abortController: AbortController,
) {
	if (checkIfThemeIsUpdating(plugin)) {
		new Notice('Theme is already updating');
		return;
	}
	try {
		const manifestURL = `${RAW_GITHUB_BASE_URL}/${theme.repo}/HEAD/manifest.json`;
		const themeURL = `${RAW_GITHUB_BASE_URL}/${theme.repo}/HEAD/theme.css`;

		const manifestResponse = await fetch(manifestURL, {
			signal: abortController.signal,
		});
		const themeResponse = await fetch(themeURL, {
			signal: abortController.signal,
		});

		// Obtain their text content
		const manifestText = await manifestResponse.text();
		const themeText = await themeResponse.text();

		// Replace the theme.css and manifest.json with the new one
		const configDir = plugin.app.vault.configDir;
		const manifestPath = `${configDir}/themes/${theme.name}/manifest.json`;
		const themePath = `${configDir}/themes/${theme.name}/theme.css`;

		await plugin.app.vault.adapter.write(manifestPath, manifestText);
		await plugin.app.vault.adapter.write(themePath, themeText);

		console.log(`Theme ${theme.name} updated to version ${theme.newVersion}`);

		// Remove the update from the updates array
		plugin.updates = plugin.updates.filter((t) => t.name !== theme.name);
		// Update the themes array
		plugin.themes = plugin.themes.map((t) => {
			if (t.name === theme.name) {
				return { ...t, version: theme.newVersion };
			}
			return t;
		});

		new Notice(`Theme ${theme.name} updated to version ${theme.newVersion}`);
	} catch (error) {
		// Do not notice and log if error is AbortError
		if (error instanceof DOMException && error.name === 'AbortError') {
			console.log(`Theme ${theme.name} update aborted`);
			new Notice(`Theme ${theme.name} update aborted`);
			return;
		}

		new Notice(`Error updating theme ${theme.name}: ${error}`);
		console.error(`Error updating theme ${theme.name}: ${error}`);
	}
}

export async function updateAllThemes(
	plugin: ThemeUpdater,
	themes: UpdateItem[],
	abortController: AbortController,
) {
	if (checkIfThemeIsUpdating(plugin)) {
		new Notice('Theme is already updating');
		return;
	}

	console.log(`Updating ${themes.length} themes...`);

	for (const theme of themes) {
		// Check if the theme is already updating
		if (plugin.abortController?.signal.aborted) {
			break;
		}

		await updateTheme(plugin, theme, abortController);
	}
}
