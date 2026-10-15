ARG RUNTIME_IMAGE=aquadactyl:test
FROM ${RUNTIME_IMAGE}
WORKDIR /bench
ENV COMPOSER_ALLOW_SUPERUSER=1
COPY panel/composer.json panel/composer.lock ./
RUN --mount=type=cache,target=/tmp/benchmark-composer \
    COMPOSER_CACHE_DIR=/tmp/benchmark-composer composer install \
    --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist --no-progress
COPY panel/ ./
COPY harness/ /harness/
RUN composer dump-autoload --no-dev --optimize --no-scripts \
    && mkdir -p bootstrap/cache storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views \
    && chown -R nginx:nginx storage bootstrap/cache \
    && cp /harness/nginx.conf /etc/nginx/nginx.conf \
    && cp /harness/php-fpm.conf /usr/local/etc/php-fpm.conf
EXPOSE 80
ENTRYPOINT ["/bin/sh", "/harness/entrypoint.sh"]
