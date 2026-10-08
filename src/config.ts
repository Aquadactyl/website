export const REPOSITORY = "https://github.com/Aquadactyl/aquadactyl";
export const COMMUNITY = "https://discord.euphoriadevelopment.uk";
export const EUPHORIA = "https://euphoriadevelopment.uk";
export const BRANCH = "main";

export const INSTALL_COMMAND = `cd /var/www/aquadactyl
sudo cp .env.example .env
sudo chmod 640 .env
sudo nano .env
sudo bash scripts/panel-install.sh`;

export const UPDATE_COMMAND = `cd /var/www/aquadactyl
sudo bash scripts/panel-update.sh vRELEASE_TAG Aquadactyl/aquadactyl`;

export const BLUEPRINT_COMMAND = `cd /var/www/aquadactyl
sudo blueprint -version
sudo blueprint -i myextension`;
