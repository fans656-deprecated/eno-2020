import os
import datetime
import subprocess

import jwt
from fastapi import FastAPI, HTTPException
from starlette.requests import Request

from model import Model
import conf


app = FastAPI()


def check_me(request):
    token = request.cookies.get('token')
    if token:
        try:
            user = jwt.decode(token, conf.PUBKEY, algorithm='RS512')
            print(user)
            if user.get('username') == 'fans656':
                return
        except Exception:
            pass
    raise HTTPException(401, 'require fans656 login')


@app.get('/api/graph')
def get_graph():
    return Model(raw=True).data


@app.get('/api/note/{note_id}')
def get_note(note_id):
    return Model().get_note(note_id)


@app.get('/api/status')
def status():
    cmd = 'git status'
    out = subprocess.check_output(cmd, shell=True, cwd=conf.DATA_DIR)
    return {
        'content': out.decode('utf-8'),
    }


@app.put('/api/graph')
def update_graph(delta: dict, request: Request):
    check_me(request)
    Model().update(delta).save()


@app.post('/api/commit')
def commit(request: Request):
    check_me(request)
    now = datetime.datetime.utcnow()
    cmd = f'git add --all && git commit -m "{now}" && git push'
    subprocess.run(cmd, shell=True, cwd=conf.DATA_DIR)


@app.post('/api/reset')
def reset(request: Request):
    check_me(request)
    cmd = 'git stash && git stash drop'
    subprocess.run(cmd, shell=True, cwd=conf.DATA_DIR)
