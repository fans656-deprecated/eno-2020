from typing import List, Union, Tuple

from pydantic import BaseModel


class Target(BaseModel):

    paths: List[str]


class StorageModel(BaseModel):

    name: str
    template_id: str


class SyncModel(BaseModel):

    path: str
    storage_id: str


class SyncModel(BaseModel):

    path: str
    storage_id: str


class MoveModel(BaseModel):

    src_paths: List[Union[str, Tuple[str, str]]]
    dst_path: str = None
