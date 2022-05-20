#!/bin/sh
set -e

git pull
docker compose up --force-recreate --build -d
docker image prune -f