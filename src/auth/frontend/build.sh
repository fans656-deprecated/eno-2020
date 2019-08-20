#!/bin/sh
IMAGE_NAME=auth.eno.zone-frontend
DATA_OUT=/data/out
CODE_OUT=/code/out
docker build -t $IMAGE_NAME .
docker run -d --rm -v $PWD:$CODE_OUT $IMAGE_NAME cp -r $CODE_OUT $DATA_OUT
