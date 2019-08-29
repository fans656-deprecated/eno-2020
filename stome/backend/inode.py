import os
import typing

import conf
from transfer import Transfer
from utils import save_json, load_json, save_stream, load_stream


class Inode:

    @staticmethod
    async def create(
        stream: typing.AsyncGenerator[bytes, None],
        mime: str,
        transfer: Transfer = None,
    ) -> 'Inode':
        fpath, md5 = await save_stream(stream, transfer)
        inode = Inode(md5)
        inode._use(fpath, mime)
        return inode

    def __init__(self, md5: str):
        self.md5 = md5
        self.data_path = os.path.join(conf.INODE_DATA_DIR, md5)
        self.meta_path = os.path.join(conf.INODE_META_DIR, md5)
        if self:
            self._load_meta()

    def __bool__(self):
        return os.path.isfile(self.meta_path)

    @property
    def mime(self) -> str:
        return self.meta['mime']

    @mime.setter
    def mime(self, mime: str):
        self.meta['mime'] = mime
        self._save_meta()

    @property
    def ref_count(self) -> int:
        return self.meta['ref_count']

    @property
    def stream(self) -> typing.AsyncGenerator[bytes, None]:
        return load_stream(self.data_path)

    def ref(self):
        self.meta['ref_count'] += 1
        self._save_meta()

    def unref(self):
        self.meta['ref_count'] -= 1
        if self.meta['ref_count'] <= 0:
            self._remove()
        else:
            self._save_meta()

    def _load_meta(self):
        self.meta = load_json(self.meta_path)

    def _save_meta(self):
        save_json(self.meta, self.meta_path)

    def _use(self, fpath, mime):
        try:
            if self:
                self.ref()
            else:
                save_json({
                    'ref_count': 1,
                    'mime': mime,
                }, self.meta_path)
                os.rename(fpath, self.data_path)
                self._load_meta()
        finally:
            if os.path.exists(fpath):
                os.remove(fpath)

    def _remove(self):
        if os.path.exists(self.data_path):
            os.remove(self.data_path)
        if os.path.exists(self.meta_path):
            os.remove(self.meta_path)

    def __repr__(self):
        return f'Inode(md5={self.md5}, mime={self.mime})'
