import os
import traceback

from fastapi import FastAPI, Path, Query, Body, HTTPException
from starlette.requests import Request
from starlette.responses import FileResponse, StreamingResponse
from starlette.staticfiles import StaticFiles

from node import Node, File, Dir, NodeType
from utils import get_user
from model import Target, StorageModel, SyncModel, MoveModel
from transfer import Transfer


app = FastAPI(
    title='stome',
    openapi_url='/api/openapi.json',
    docs_url='/api/docs',
    redoc_url='/api/redoc',
)


@app.get('/api/file/{path:path}')
async def download_file(path, request: Request):
    f = File(path)
    ensure_existed(f)
    ensure_not_type(f, NodeType.Dir)
    inode = f.inode
    return StreamingResponse(inode.stream, media_type=inode.mime)


@app.post('/api/file/{path:path}')
async def upload_file(
        *,
        path,
        force: bool = Query(
            False,
            title='Force create even existed, old file will be deleted',
        ),
        transfer_id: str = Query(
            None,
            alias='transfer',
            title='Transfer UUIDv4',
        ),
        request: Request,
):
    ensure_me(request)
    f = File(path)
    ensure_not_type(f, NodeType.Dir)
    if f and not force:
        raise HTTPException(409, 'Existed')
    if transfer_id:
        transfer = Transfer(transfer_id, int(request.headers['content-length']))
    else:
        transfer = None
    await f.create(request.stream(), transfer=transfer)


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


@app.post('/api/meta/{path:path}')
def update_meta(path, request: Request):
    ensure_me(request)


@app.get('/api/dir/{path:path}')
def list_directory(path):
    node = Dir(path)
    ensure_existed(node)
    meta = node.meta
    dirs, files = node.list()
    meta['dirs'] = [dict(d) for d in dirs]
    meta['files'] = [dict(f) for f in files]
    return meta


@app.post('/api/dir/{path:path}')
def create_directory(path, request: Request = None):
    ensure_me(request)
    d = Dir(path)
    if d:
        raise HTTPException(409, 'Conflict')
    d.create(request)


@app.post('/api/mv')
def move(spec: MoveModel, request: Request):
    """
    1. Rename
        {
            "src_paths": [
                ("/foo.jpg", "/bar.jpg"),
                ("/big.flv", "/giant.flv"),
            ],
        }
    2. Move to directory
        {
            "src_paths": ["/1.jpg", "/2.jpg"],
            "dst_path": '/img',
        }
    """
    ensure_me(request)
    errors = []
    for src_path, dst_path in normalized_move_paths(spec):
        src = Node(src_path)
        dst = Node(dst_path)
        if not src:
            errors.append({
                'err': 'not found',
                'src': src_path,
            })
        if dst:
            errors.append({
                'err': 'existed',
                'src': src_path,
                'dst': dst_path,
            })
        try:
            src.move(dst)
        except OSError:
            errors.append({
                'err': 'exception',
                'detail': traceback.format_exc(),
                'src': src_path,
                'dst': dst_path,
            })
    return {'errors': errors}


@app.post('/api/rm')
def delete(target: Target, request: Request):
    ensure_me(request)
    for path in target.paths:
        node = Node(path)
        if not node:
            raise HTTPException(404, 'Not found')
        node.delete()


@app.get('/api/storages')
def get_storages(request: Request):
    ensure_me(request)
    return {
        'data': [
            {
                'name': 's3',
                'id': '1',
                'template_id': '1',
                'size': '19.3GB',
            },
            {
                'name': 's3 2019',
                'id': '2',
                'template_id': '1',
                'size': '213MB',
            },
            {
                'name': 'dropbox',
                'id': '3',
                'template_id': '2',
                'size': '0',
            },
        ],
    }


@app.post('/api/storages')
def create_storage(storage: StorageModel, request: Request):
    ensure_me(request)
    print(dict(storage))


@app.get('/api/storage-templates')
def get_storage_templates():
    return {
        'data': [
            {
                'name': 'Amazon S3',
                'id': '1',
            },
            {
                'name': 'Dropbox',
                'id': '2',
            },
            {
                'name': 'Github',
                'id': '3',
            },
        ],
    }


@app.post('/api/sync-to-storage')
def sync_to_storage(sync: SyncModel, request: Request):
    ensure_me(request)
    print('sync_to_storage', dict(sync))
    return sync


@app.post('/api/sync-from-storage')
def sync_from_storage(sync: SyncModel, request: Request):
    ensure_me(request)
    print('sync_from_storage', dict(sync))


@app.get('/api/transfer-event-source')
def transfer_event_source(request: Request):
    """
    SSE (Server Sent Event) endpoint for transfer events.
    """
    return StreamingResponse(Transfer.stream(request), media_type='text/event-stream')


app.mount('/_next', StaticFiles(directory='../frontend/out/_next', html=True))


@app.get('/{path:path}')
async def path(path, request: Request):
    node = Node(path)
    if not node:
        raise HTTPException(404, 'Not found')
    if node.type == NodeType.Dir:
        return FileResponse('../frontend/out/index.html')
    else:
        return await download_file(path, request)


def ensure_existed(node):
    if not node:
        raise HTTPException(404, 'Not found')


def ensure_not_type(node, node_type):
    if node.type == node_type:
        raise HTTPException(400, f'Is {node_type.value}')


def ensure_type(node, node_type):
    if node.type != node_type:
        raise HTTPException(400, f'Is not {node_type.value}')


def ensure_me(request):
    user = get_user(request)
    if user['username'] != 'fans656':
        raise HTTPException(401, 'require fans656 login')


def normalized_move_paths(spec):
    move_paths = []
    for src_path in spec.src_paths:
        if isinstance(src_path, tuple):
            src_path, dst_path = src_path
        else:
            fname = os.path.basename(src_path)
            dst_path = os.path.join(spec.dst_path, fname)
        move_paths.append((src_path, dst_path))
    return move_paths
