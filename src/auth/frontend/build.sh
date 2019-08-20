DATA_OUT=/data/out
CODE_OUT=/code/out
docker build -t auth.eno.zone .
docker run -d --rm -v $DATA_OUT:$CODE_OUT cp $CODE_OUT $DATA_OUT
