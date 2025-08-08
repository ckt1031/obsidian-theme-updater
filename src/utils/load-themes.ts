import type { App } from 'obsidian';

import type { ObsidianVaultTheme } from '@/types';

export default async function loadThemes(
	app: App,
): Promise<ObsidianVaultTheme[]> {
	const themes: ObsidianVaultTheme[] = [];

	const configDir = app.vault.configDir;

	// Read all files in the configDir
	const themeFolders = await app.vault.adapter.list(`${configDir}/themes`);

	// For all theme folders, read the manifest.json file
	for (const themeFolder of themeFolders.folders) {
		const manifest = await app.vault.adapter.read(
			`${themeFolder}/manifest.json`,
		);
		const theme: ObsidianVaultTheme = JSON.parse(manifest);

		themes.push(theme);
	}

	return themes;
}
