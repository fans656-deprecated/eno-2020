import os

import pytest

from ._utils import *
from inode import Inode


CONTENT = b'CONTENT'
MIME = 'MIME'
MIME2 = 'MIME2'
MD5 = 'MD5'


@pytest.mark.asyncio
async def test_create(filesystem):
    # first create should give inode with correct content, ref_count and mime
    inode = await Inode.create(gen_content(CONTENT), MIME)
    await assert_inode(inode)
    # second create will merely increase the ref_count, not changing content and mime
    inode = await Inode.create(gen_content(CONTENT), MIME2)
    await assert_inode(inode, ref_count=2)
    # so as third create
    inode = await Inode.create(gen_content(CONTENT), MIME2)
    await assert_inode(inode, ref_count=3)


@pytest.mark.asyncio
async def test_get_inode(filesystem):
    # non existed inode eval to False
    assert not Inode(MD5)
    # existed inode has correct content, ref_count and mime
    inode = await Inode.create(gen_content(CONTENT), MIME)
    inode = Inode(inode.md5)
    await assert_inode(inode)


@pytest.mark.asyncio
async def test_set_mime(filesystem):
    # mime can be changed afterwards
    inode = await Inode.create(gen_content(CONTENT), MIME)
    await assert_inode(inode)
    inode.mime = MIME2
    await assert_inode(Inode(inode.md5), mime=MIME2)


@pytest.mark.asyncio
async def test_ref_unref(filesystem):
    # ref should increase the ref count
    inode = await Inode.create(gen_content(CONTENT), MIME)
    await assert_inode(inode)
    inode.ref()
    await assert_inode(Inode(inode.md5), ref_count=2)
    inode.ref()
    await assert_inode(Inode(inode.md5), ref_count=3)
    # unref should decrease the ref count
    inode.unref()
    await assert_inode(Inode(inode.md5), ref_count=2)
    inode.unref()
    await assert_inode(Inode(inode.md5), ref_count=1)
    # last unref should remove the inode
    inode.unref()
    assert not inode
    assert not Inode(inode.md5)


async def assert_inode(inode, ref_count=1, mime=MIME):
    assert inode
    assert inode.mime == mime
    assert inode.ref_count == ref_count
    assert await get_content(inode.stream) == CONTENT
