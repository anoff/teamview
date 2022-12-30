# monitoring stack

1. create `.env` file
1. run `update-configs.sh` to generate config files (`./telegraf.conf` and `./grafana/grafana/provisioning/datasources/influx.yml`)
1. run `docker-compose up -d`
1. check the generated influx auth tokens to use for grafana: `docker exec tv-influxdb influx auth`
