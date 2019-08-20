#!/bin/sh
docker run -d --rm -p 4490:80 -v $(realpath ~/eno-graph):/~/eno-graph --name graph.fme graph.fme
