from typing import List

from pydantic import BaseModel


class Target(BaseModel):

    paths: List[str]


class StorageModel(BaseModel):

    name: str
    template_id: str


class SyncModal(BaseModel):

    path: str
    storage_id: str
