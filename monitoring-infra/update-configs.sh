#!/bin/sh
set -e


source .env

echo "Preparing Grafana files.."

sed -e 's/%%INFLUXDB_INIT_ORG%%/'${DOCKER_INFLUXDB_INIT_ORG}'/g' \
    -e 's/%%INFLUXDB_INIT_BUCKET%%/'${DOCKER_INFLUXDB_INIT_BUCKET}'/g' \
    -e 's/%%INFLUXDB_INIT_ADMIN_TOKEN%%/'${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN}'/g' \
    grafana/provisioning/datasources/influx.yml.template \
  > grafana/provisioning/datasources/influx.yml