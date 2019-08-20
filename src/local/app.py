import os
import json
import queue
import threading

import uvicorn
from fastapi import FastAPI
from starlette.requests import Request
from starlette.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler


LOCAL_DIR = os.path.join(os.path.expanduser('~'), 'eno-activities/local/')
CURRENT_FNAME = '_current.md'


class CurrentContentWatcher(FileSystemEventHandler):

    def __init__(self):
        super()
        self.watching = True
        self.queues = {}
        self.content = ''
        self.queues_lock = threading.Lock()

    def create_queue(self):
        que = queue.Queue()
        with self.queues_lock:
            self.queues[que] = que
        return que

    def remove_queue(self, que):
        with self.queues_lock:
            del self.queues[que]

    def on_modified(self, ev):
        if self.watching and os.path.basename(ev.src_path) == CURRENT_FNAME:
            with open(os.path.join(LOCAL_DIR, CURRENT_FNAME)) as f:
                content = f.read()
            if content != self.content:
                self.content = content
                with self.queues_lock:
                    for que in self.queues:
                        que.put(content)


app = FastAPI(openapi_prefix='/api')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://ub',
        'http://ub:6560',
        'https://fans656.me',
    ],
    allow_methods=['*'],
    allow_headers=['*'],
)
g = {}


@app.on_event('startup')
def on_startup():
    watcher = g['watcher'] = CurrentContentWatcher()
    observer = g['observer'] = Observer()
    observer.schedule(watcher, LOCAL_DIR)
    observer.start()


@app.on_event('shutdown')
def on_shutdown():
    observer = g['observer']
    observer.stop()
    observer.join()


@app.put('/current')
def put_current(note: dict):
    g['id'] = note['id']
    fpath = os.path.join(LOCAL_DIR, CURRENT_FNAME)
    ln_fpath = os.path.join(LOCAL_DIR, 'current')
    watcher = g['watcher']
    with open(fpath, 'w') as f:
        watcher.watching = False
        f.write(note['content'])
        watcher.watching = True
    os.system(f'ln -fs {fpath} {ln_fpath}')


@app.get('/current-content-change-event')
def current_content_change_event(request: Request):
    async def gen():
        observer = g['observer']
        watcher = g['watcher']
        que = watcher.create_queue()
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    content = que.get(timeout=1)
                except queue.Empty:
                    yield ':\n\n'  # ping
                else:
                    yield 'data: {}\n\n'.format(json.dumps({
                        'id': g['id'],
                        'content': content,
                    }))
        finally:
            watcher.remove_queue(que)
    return StreamingResponse(gen(), media_type='text/event-stream')


if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=6560)
