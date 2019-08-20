import os
import datetime
import subprocess

from fastapi import FastAPI

from model import Model
import conf


app = FastAPI(openapi_prefix='/api')


@app.get('/graph')
def get_graph():
    return Model(raw=True).data


@app.put('/graph')
def update_graph(delta: dict):
    Model().update(delta).save()


@app.get('/note/{note_id}')
def get_note(note_id):
    return Model().get_note(note_id)


@app.post('/commit')
def commit():
    now = datetime.datetime.utcnow()
    cmd = f'git add --all && git commit -m "{now}"'
    subprocess.run(cmd, shell=True, cwd=conf.DATA_DIR)


@app.post('/reset')
def reset():
    cmd = 'git stash && git stash drop'
    subprocess.run(cmd, shell=True, cwd=conf.DATA_DIR)


@app.get('/status')
def status():
    cmd = 'git status'
    out = subprocess.check_output(cmd, shell=True, cwd=conf.DATA_DIR)
    return {
        'content': out.decode('utf-8'),
    }
