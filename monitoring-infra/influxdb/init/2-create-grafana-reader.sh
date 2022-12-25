#!/bin/sh

# see https://github.com/docker-library/docs/blob/master/influxdb/README.md#custom-initialization-scripts for details
set -e

NEW_BUCKET_ID=$(influx bucket find --name=${INFLUXDB_TELEGRAF_BUCKET} --org-id ${DOCKER_INFLUXDB_INIT_ORG_ID} --hide-headers | cut -f 5)

echo $NEW_BUCKET_ID
influx user create \
  --org-id ${DOCKER_INFLUXDB_INIT_ORG_ID} \
  --password ${INFLUXDB_GRAFANA_PASSWORD} \
  --name ${INFLUXDB_GRAFANA_USER}

influx auth create \
  --org-id ${DOCKER_INFLUXDB_INIT_ORG_ID} \
  --write-bucket ${NEW_BUCKET_ID} \
  --user ${INFLUXDB_GRAFANA_USER}