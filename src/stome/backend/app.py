import traceback

from fastapi import FastAPI, Path, Query, Body, HTTPException
from starlette.requests import Request
from starlette.responses import StreamingResponse

from node import Node, File, Dir, NodeType
from utils import get_user


app = FastAPI(title='stome')


@app.get('/api/file/{path:path}')
async def download_file(path, request: Request):
    f = File(path)
    ensure_existed(f)
    ensure_not_type(f, NodeType.Dir)
    inode = f.inode
    return StreamingResponse(inode.stream(), media_type=inode.mime)


@app.put('/api/file/{path:path}')
async def upload_file(
        *,
        path,
        force: bool = Query(
            False,
            title='Force create even existed, old file will be deleted',
        ),
        request: Request,
):
    ensure_me(request)
    f = File(path)
    ensure_not_type(f, NodeType.Dir)
    if f.existed and not force:
        raise HTTPException(409, 'Existed')
    await f.create(request.stream())


@app.delete('/api/file/{path:path}')
def delete_file(path):
    ensure_me(request)
    p = File(path)
    if not p:
        raise HTTPException(404, 'Not found')
    p.delete()


@app.get('/api/meta/{path:path}')
async def get_meta(path, request: Request):
    node = Node(path)
    ensure_existed(node)
    meta = node.meta
    meta.update({
        'path': '/' + node.path,
        'type': node.type,
    })
    return meta


@app.put('/api/meta/{path:path}')
def update_meta(path, request: Request):
    ensure_me(request)


@app.get('/api/dir/{path:path}')
def list_directory(path):
    node = Dir(path)
    ensure_existed(node)
    meta = node.meta
    meta['children'] = node.list()
    return meta


@app.put('/api/dir/{path:path}')
async def create_directory(path, request: Request = None):
    ensure_me(request)
    dir = Dir(path)
    if dir:
        raise HTTPException(409, 'Existed')
    dir.create(request)


@app.delete('/api/dir/{path:path}')
def delete_directory(path):
    ensure_me(request)
    p = Path(path)
    if not p:
        raise HTTPException(404, 'Not found')
    p.delete()


@app.post('/api/mv')
def move(src_path, dst_path, request: Request):
    ensure_me(request)


def ensure_existed(node):
    if not node:
        raise HTTPException(404, 'Not found')


def ensure_not_type(node, node_type):
    if node.type == node_type:
        raise HTTPException(400, f'Is {type}')


def ensure_type(node, node_type):
    if node.type != node_type:
        raise HTTPException(400, f'Is not {type}')


def ensure_me(request):
    user = get_user(request)
    if not user['username'] == 'fans656':
        raise HTTPException(401, 'require fans656 login')
