import pytest
from starlette.testclient import TestClient

from ._utils import *
import app
from node import File


@pytest.fixture
def client():
    return TestClient(app.app)


@pytest.fixture
def authed():
    orig_get_user = app.get_user
    app.get_user = lambda *args, **kwargs: {'username': 'fans656'}
    yield
    app.get_user = orig_get_user


# aborted upload shouldn't result in a partial file


class TestUploadFile:

    def test_auth(self, client):
        # upload require auth
        assert client.post('/api/file/').status_code == 401
        assert client.post('/api/file/' + EXISTED_DIR).status_code == 401
        assert client.post('/api/file/' + NOT_EXISTED_DIR).status_code == 401
        assert client.post('/api/file/' + EXISTED_FILE).status_code == 401
        assert client.post('/api/file/' + NOT_EXISTED_FILE).status_code == 401

    def test_dir(self, client, filesystem, authed):
        # can not target root
        assert client.post('/api/file/').status_code == 400
        # can not target existed dir
        assert client.post('/api/file/' + EXISTED_DIR).status_code == 400

    def test_existed(self, client, filesystem, authed):
        # can not target existed file if not forced
        assert client.post('/api/file/' + EXISTED_FILE).status_code == 409

    #@pytest.mark.asyncio
    #async def test_overwrite(self, client, filesystem, authed):
    #    # can target existed file if forced
    #    path = EXISTED_FILE
    #    assert await get_content(File(path).inode.stream) == EXISTED_FILE_CONTENT
    #    res = client.post(
    #        '/api/file/' + path,
    #        params={'force': 'true'},
    #        data=NEW_CONTENT,
    #    )
    #    assert res.status_code == 200
    #    assert await get_content(File(path).inode.stream) == NEW_CONTENT

    #@pytest.mark.asyncio
    #async def test_create(self, client, filesystem, authed):
    #    # can target existed file
    #    path = NOT_EXISTED_FILE
    #    res = client.post('/api/file/' + path, data=NEW_CONTENT)
    #    assert res.status_code == 200
    #    assert await get_content(File(path).inode.stream) == NEW_CONTENT

    def test_same_content(self):
        # upload two files that
        #   1. has same content
        #   2. at different path
        # then delete one should not affect the other one
        pass
