#!/bin/sh
set -eu
cd /bench
php artisan package:discover --no-interaction
php artisan migrate --force --no-interaction
php /harness/seed.php
php artisan config:cache
php artisan route:cache
php artisan view:cache
chown -R nginx:nginx storage bootstrap/cache
exec supervisord -n -c /harness/supervisord.conf
