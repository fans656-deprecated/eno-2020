import pytest
from starlette.testclient import TestClient

from ._utils import *
import app
from fs import File


@pytest.fixture
def client():
    return TestClient(app.app)


@pytest.fixture
def authed():
    orig_get_user = app.get_user
    app.get_user = lambda *args, **kwargs: {'username': 'fans656'}
    yield
    app.get_user = orig_get_user


class TestUploadFile:

    def test_auth(self, client):
        assert client.put('/api/file/').status_code == 401
        assert client.put('/api/file/' + EXISTED_DIR).status_code == 401
        assert client.put('/api/file/' + NOT_EXISTED_DIR).status_code == 401
        assert client.put('/api/file/' + EXISTED_FILE).status_code == 401
        assert client.put('/api/file/' + NOT_EXISTED_FILE).status_code == 401

    def test_dir(self, client, filesystem, authed):
        assert client.put('/api/file/').status_code == 400
        assert client.put('/api/file/' + EXISTED_DIR).status_code == 400

    def test_existed(self, client, filesystem, authed):
        assert client.put('/api/file/' + EXISTED_FILE).status_code == 409

    def test_create(self, client, filesystem, authed):
        path = NOT_EXISTED_FILE
        res = client.put('/api/file/' + path, data=NEW_CONTENT)
        assert res.status_code == 200
        assert File(path).content == NEW_CONTENT

    def test_overwrite(self, client, filesystem, authed):
        path = EXISTED_FILE
        assert File(path).content == EXISTED_FILE_CONTENT
        res = client.put(
            '/api/file/' + path,
            params={'force': 'true'},
            data=NEW_CONTENT,
        )
        assert res.status_code == 200
        assert File(path).content == NEW_CONTENT
