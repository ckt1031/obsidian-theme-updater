export interface ThemeUpdaterSettings {
	notifyOnNewUpdate: boolean;
	checkOnStartup: boolean;
}

export interface ObsidianVaultTheme {
	name: string;
	version: string;
	minAppVersion: string;
}

export interface UpdateItem {
	name: string;
	newVersion: string;
	currentVersion: string;
	minAppVersion: string;
	repo: string;
}
