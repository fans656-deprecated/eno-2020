from fastapi import FastAPI, Path, Query, Body, HTTPException
from starlette.requests import Request
from starlette.responses import StreamingResponse

from fs import Node, File, Dir
import conf


app = FastAPI(title='stome')


def check_me(request):
    token = request.cookies.get('token')
    if token:
        try:
            user = jwt.decode(token, conf.PUBKEY, algorithm='RS512')
            if user.get('username') == 'fans656':
                return
        except Exception:
            pass
    raise HTTPException(401, 'require fans656 login')


@app.get('/api/file/{path:path}')
async def download_file(path, request: Request):
    node = Node(path, check_exist=True)
    if not node.is_dir():
        raise HTTPException(400, 'Is directory')
    node.check_access(request)
    return StreamingResponse(f.stream(), media_type=f.mime_type)


@app.put('/api/file/{path:path}')
async def upload_file(
        path: str = Path(...),
        force: bool = Query(
            False,
            title='Force create even existed, old file will be deleted',
        ),
        request: Request = None,
):
    check_me(request)
    file = File(path)
    if file:
        if not force:
            raise HTTPException(409, 'Existed')
        file.delete()
    await file.create(request)


@app.delete('/api/file/{path:path}')
def delete_file(path: str = Path(...)):
    check_me(request)
    p = Path(path)
    if not p:
        raise HTTPException(404, 'Not found')
    p.delete()


@app.get('/api/meta/{path:path}')
async def get_meta(path, request: Request):
    node = Node(path)
    ensure_existed(node)
    ensure_readable(node, request)
    return node.meta


@app.put('/api/meta/{path:path}')
def update_meta(path):
    node = Node(path, check_exist=True)
    node.check_access(request)
    return node.meta


@app.get('/api/dir/{path:path}')
def list_directory(path):
    node = Node(path, check_exist=True)
    node.check_access(request)
    return node.list()


@app.put('/api/dir/{path:path}')
async def create_directory(path: str = Path(...), request: Request = None):
    check_me(request)
    dir = Dir(path)
    if dir:
        raise HTTPException(409, 'Existed')
    dir.create(request)


@app.delete('/api/dir/{path:path}')
def delete_directory(path: str = Path(...)):
    check_me(request)
    p = Path(path)
    if not p:
        raise HTTPException(404, 'Not found')
    p.delete()


@app.post('/api/mv')
def move(
        src_path: str,
        dst_path: str,
):
    check_me(request)


@app.post('/api/cp')
def copy(
        src_path: str,
        dst_path: str,
):
    check_me(request)


def ensure_existed(node):
    if not node:
        raise HTTPException(404, 'Not found')


def ensure_readable(node, request):
    if node.is_private():
        check_me(request)
