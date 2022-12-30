#!/bin/sh

# see https://github.com/docker-library/docs/blob/master/influxdb/README.md#custom-initialization-scripts for details
set -e

NEW_BUCKET_ID=$(influx bucket find --name=${DOCKER_INFLUXDB_INIT_BUCKET} --org-id ${DOCKER_INFLUXDB_INIT_ORG_ID} --hide-headers | cut -f 5)

echo $NEW_BUCKET_ID

influx auth create \
  --org-id ${DOCKER_INFLUXDB_INIT_ORG_ID} \
  --read-bucket ${NEW_BUCKET_ID} \
  --user ${DOCKER_INFLUXDB_INIT_USERNAME}
  --description "Grafana token"