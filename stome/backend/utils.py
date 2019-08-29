import os
import json
import uuid
import hashlib
import functools

import jwt
import aiofiles
from starlette.requests import ClientDisconnect
from fastapi import HTTPException

import conf


def get_user(request):
    token = request.cookies.get('token')
    if token:
        try:
            return jwt.decode(token, conf.PUBKEY, algorithm='RS512')
        except Exception:
            pass
    return {'username': ''}


def meta_path(path):
    if path.startswith('/'):
        path = path[1:]
    return os.path.join(conf.META_DIR, path)


def inode_path(path):
    if path.startswith('/'):
        path = path[1:]
    return os.path.join(conf.INODE_DIR, path)


def save_json(data, path):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, sort_keys=True)


def load_json(path, default_data=None):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default_data or {}


async def load_stream(path):
    async with aiofiles.open(path, 'rb') as f:
        while True:
            chunk = await f.read(conf.CHUNK_SIZE)
            if not chunk:
                break
            yield chunk


async def save_stream(stream, transfer):
    fpath = os.path.join(conf.TEMP_DIR, str(uuid.uuid4()))
    hasher = hashlib.md5()
    async with aiofiles.open(fpath, 'wb') as f:
        try:
            async for chunk in stream:
                if transfer:
                    await transfer.receive(chunk)
                await f.write(chunk)
                hasher.update(chunk)
        except ClientDisconnect:
            raise HTTPException(499, 'Disconnected')
    return fpath, hasher.hexdigest()
