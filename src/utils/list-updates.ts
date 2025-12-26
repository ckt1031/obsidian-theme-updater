import { compare } from 'compare-versions';

import type { ObsidianVaultTheme, UpdateItem } from '@/types';

const DEFAULT_RAW_THEMES_URL =
	'https://raw.githubusercontent.com/obsidianmd/obsidian-releases/refs/heads/master/community-css-themes.json';

interface CommunityThemeItem {
	name: string;
	author: string;
	repo: string;
	// screenshot: string;
	// modes: string[];
	// legacy: boolean;
}

/**
 * List updates for the given themes
 * @param themes - The themes to check for updates
 * @returns The updates for the given themes
 */
export default async function listUpdates(themes: ObsidianVaultTheme[]) {
	try {
		const response = await fetch(DEFAULT_RAW_THEMES_URL);
		if (!response.ok) return [];
		const data = await response.json();

		const updates: UpdateItem[] = [];

		for (const theme of themes) {
			/**
			 * Core content is the repository of the theme, we will fetch the theme version from there
			 */
			const themeData = data.find(
				(t: CommunityThemeItem) => t.name === theme.name,
			);

			if (!themeData) continue;

			try {
				const themeManifestURL = `https://raw.githubusercontent.com/${themeData.repo}/HEAD/manifest.json`;
				const themeManifestResponse = await fetch(themeManifestURL);

				if (!themeManifestResponse.ok) continue;

				const themeManifestData = await themeManifestResponse.json();

				if (compare(themeManifestData.version, theme.version, '>')) {
					updates.push({
						name: theme.name,
						currentVersion: theme.version,
						newVersion: themeManifestData.version,
						minAppVersion: themeManifestData.minAppVersion,
						repo: themeData.repo,
					});
				}
			} catch (e) {
				console.error(`Failed to check updates for ${theme.name}`, e);
			}
		}

		return updates;
	} catch (e) {
		console.error('Failed to list updates', e);
		return [];
	}
}
