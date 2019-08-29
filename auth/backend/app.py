"""
Auth server for [eno.zone](https://eno.zone) / [fans656.me](https://fans656.me)
"""
#import os
#import re
import hashlib
#import datetime
import binascii

import jwt
from fastapi import FastAPI, Body, HTTPException
from starlette.responses import Response, PlainTextResponse
from starlette.staticfiles import StaticFiles
from pydantic import BaseModel

import conf


USERNAME_REGEX = '[a-zA-Z0-9][-_.a-zA-Z0-9]*'

FANS656 = 'fans656'
FANS656_HASHED_PWD = 'bc8860834b82c80b142e9f3918a41a6b20c65106e578ed4a08d51996727a5ae2'.encode()
FANS656_SALT = '78bab7e4b93a1c4112a03bdb9de0a21a66c354a8f7df6fbc68b0393191a10f2d'.encode()


class ResponseModel(BaseModel):

    token: str


app = FastAPI(title='Auth server', description=__doc__)


@app.get('/api/pubkey', name='Public key')
def pubkey():
    """
    Get the OpenSSH public key content, which can be used to verify issued JWT token.
    """
    return PlainTextResponse(conf.PUBKEY)


@app.post('/api/login', response_model=ResponseModel)
def login(
        *,
        username: str = Body(
            ...,
            min_length=3,
            max_length=32,
            regex=USERNAME_REGEX,
            embed=True,
        ),
        password: str = Body(
            ...,
            min_length=3,
            max_length=32,
            embed=True,
        ),
        response: Response,
):
    """
    Response will have `set-cookie` header with `token=<token>`
    """
    if username != FANS656:
        raise HTTPException(404, 'user not found')
    hashed_pwd = hash_password(password.encode(), FANS656_SALT)
    if hashed_pwd != FANS656_HASHED_PWD:
        raise HTTPException(400, 'wrong password')
    token = jwt.encode({'username': username}, conf.PRIKEY, algorithm='RS512')
    response.set_cookie(
        key='token',
        value=token.decode(),
        domain='fans656.me',
        max_age=3600*12*90,
    )
    return {'token': token}


app.mount('/', StaticFiles(directory='../frontend/out', html=True))


#def do_register(username, password):
#    if dbutil.get_user(username):
#        raise Error('user already exists')
#
#    salt = generate_salt()
#    hashed_password = hash_password(password, salt)
#    user = {
#        'username': username,
#        'ctime': utc_now_as_str(),
#        'salt': salt,
#        'hashed_password': hashed_password,
#    }
#    if not dbutil.create_user(user):
#        raise InternalError()
#
#    return token_response(dbutil.get_user_for_token(username))
#
#
#def generate_salt():
#    return binascii.hexlify(os.urandom(32))


def hash_password(password, salt, iterations=100000):
    hashed_pwd = hashlib.pbkdf2_hmac('sha256', password, salt, iterations)
    return binascii.hexlify(hashed_pwd)


#def utc_now_as_str():
#    return datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
