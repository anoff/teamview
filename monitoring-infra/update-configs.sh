#!/bin/bash
set -e


source .env

echo "Preparing Grafana files.."

sed -e 's/%%INFLUXDB_INIT_ORG%%/'${DOCKER_INFLUXDB_INIT_ORG}'/g' \
    -e 's/%%INFLUXDB_INIT_BUCKET%%/'${DOCKER_INFLUXDB_INIT_BUCKET}'/g' \
    -e 's/%%INFLUXDB_INIT_ADMIN_TOKEN%%/'${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN}'/g' \
    grafana/provisioning/datasources/influx.yml.template \
  > grafana/provisioning/datasources/influx.yml

# load postgres secrets
source ../.env

sed -e 's/%%POSTGRES_DB%%/'${POSTGRES_DB}'/g' \
    -e 's/%%POSTGRES_PORT%%/'${POSTGRES_PORT}'/g' \
    -e 's/%%POSTGRES_USER%%/'${POSTGRES_USER}'/g' \
    -e 's/%%POSTGRES_PASSWORD%%/'${POSTGRES_PASSWORD}'/g' \
    grafana/provisioning/datasources/postgres.yml.template \
  > grafana/provisioning/datasources/postgres.yml

echo "Preparing telegraf config.."
sed -e 's/%%INFLUXDB_INIT_ORG%%/'${DOCKER_INFLUXDB_INIT_ORG}'/g' \
    -e 's/%%INFLUXDB_INIT_BUCKET%%/'${DOCKER_INFLUXDB_INIT_BUCKET}'/g' \
    -e 's/%%INFLUXDB_INIT_ADMIN_TOKEN%%/'${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN}'/g' \
    telegraf.conf.template \
  > telegraf.conf