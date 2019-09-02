#!/bin/sh
docker stop stome.fme
docker run -d --rm -p 4431:80 \
    -v $(realpath /data):/data \
    --name stome.fme stome.fme
