#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
CERT_DIR="$ROOT_DIR/docker/dev/certs"
CERT_PATH="$CERT_DIR/local.findnmeet.ru.pem"
KEY_PATH="$CERT_DIR/local.findnmeet.ru-key.pem"

mkdir -p "$CERT_DIR"

if [ -f "$CERT_PATH" ] && [ -f "$KEY_PATH" ]; then
  exit 0
fi

if ! command -v mkcert >/dev/null 2>&1; then
  echo "mkcert is required for local HTTPS. Install it and run 'mkcert -install' once." >&2
  exit 1
fi

mkcert -cert-file "$CERT_PATH" -key-file "$KEY_PATH" local.findnmeet.ru
