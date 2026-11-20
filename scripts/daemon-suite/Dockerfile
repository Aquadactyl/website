FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata shadow coreutils \
    && addgroup -g 988 benchmark \
    && adduser -D -H -u 988 -G benchmark aquadactyl \
    && useradd -M -N -o -u 988 -g 988 pterodactyl \
    && cp /bin/busybox /usr/local/bin/busybox
COPY manta /usr/local/bin/manta
COPY wings /usr/local/bin/wings
COPY runner /usr/local/bin/benchmark-runner
