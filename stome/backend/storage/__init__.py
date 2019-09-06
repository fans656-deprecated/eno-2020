import os
import json

import conf

from .storage import Storage


TEMPLATES = [
    {
        'name': 'Amazon S3',
        'id': 'amazon-s3',
    },
    {
        'name': 'Dropbox',
        'id': 'dropbox',
    },
    {
        'name': 'Github',
        'id': 'github',
    },
]
ID_TO_TEMPLATE = {template['id']: template for template in TEMPLATES}


def create(data):
    assert data.template_id in ID_TO_TEMPLATE
    storages = _load_storages()
    assert data.name not in storages.name_to_storage
    storages.add(storage)


def _load_storages():
    if not os.path.exists(conf.STORAGE_META):
        _save_storages(_DEFAULT_STORAGE_META)
    with open(conf.STORAGE_META) as f:
        meta = json.load(f)
    return _Storages(meta)


def _save_storages(meta):
    with open(conf.STORAGE_META, 'w') as f:
        json.dump(meta, f, indent=2)


class _Storages:

    def __init__(self, meta):
        self.meta = meta
        self.storages = [Storage(s) for s in meta['storages']]
        self.name_to_storage = [s.name for s in self.storages]

    def add(self, storage_meta):
        self.storages.append(Storage(storage_meta))
        self.meta['storages'].append(storage_meta)
        _save_storages(self.meta)


_DEFAULT_STORAGE_META = {
    'storages': [],
}
