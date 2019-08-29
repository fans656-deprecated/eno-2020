#!/bin/sh
docker run -d --rm -p 4490:80 \
    -v $(realpath ~/eno-graph):/root/eno-graph \
    -v $(realpath ~/.ssh):/root/.ssh \
    --name graph.fme graph.fme
