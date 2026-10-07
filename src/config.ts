export const REPOSITORY = 'https://github.com/EuphoriaTheme/aquadactyl';
export const COMMUNITY = 'https://discord.euphoriadevelopment.uk';
export const EUPHORIA = 'https://euphoriadevelopment.uk';
export const BRANCH = '1.0-develop';

export const INSTALL_COMMAND = `cd /var/www/pterodactyl
sudo cp .env.example .env
sudo chmod 640 .env
sudo nano .env
sudo bash scripts/panel-install.sh`;

export const UPDATE_COMMAND = `cd /var/www/pterodactyl
sudo bash scripts/panel-update.sh vRELEASE_TAG EuphoriaTheme/aquadactyl`;

export const BLUEPRINT_COMMAND = `cd /var/www/pterodactyl
sudo blueprint -version
sudo blueprint -i myextension`;
