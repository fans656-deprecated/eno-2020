#!/bin/sh
IMAGE_NAME=auth.eno.zone-frontend
DATA=/data
DATA_OUT=$DATA/out
CODE_OUT=/code/out
docker build -t $IMAGE_NAME .
docker run -d --rm -v $PWD:$DATA $IMAGE_NAME cp -r $CODE_OUT $DATA_OUT
