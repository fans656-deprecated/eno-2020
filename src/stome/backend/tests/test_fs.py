from ._utils import *
from fs import Node, Dir, File, NodeType


def test_existed(filesystem):
    assert Node(EXISTED_DIR).existed
    assert Node(EXISTED_FILE).existed


def test_not_existed(filesystem):
    assert not Node(NOT_EXISTED_DIR).existed
    assert not Node(NOT_EXISTED_FILE).existed


def test_type(filesystem):
    assert Node(EXISTED_DIR).type == NodeType.Dir
    assert Node(EXISTED_FILE).type == NodeType.File
