from ._utils import *
from node import Node, Dir, File, NodeType


def test_existed(filesystem):
    assert Node(EXISTED_DIR)
    assert Node(EXISTED_FILE)


def test_not_existed(filesystem):
    assert not Node(NOT_EXISTED_DIR)
    assert not Node(NOT_EXISTED_FILE)


def test_type(filesystem):
    assert Node(EXISTED_DIR).type == NodeType.Dir
    assert Node(EXISTED_FILE).type == NodeType.File
