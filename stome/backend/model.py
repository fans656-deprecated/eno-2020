from typing import List, Union, Tuple

from pydantic import BaseModel, Schema


class Target(BaseModel):

    paths: List[str]


class SyncModel(BaseModel):

    path: str
    storage_id: str


class SyncModel(BaseModel):

    path: str
    storage_id: str


class MoveModel(BaseModel):

    src_paths: List[Union[str, Tuple[str, str]]]
    dst_path: str = None


class StorageModel(BaseModel):

    name: str = Schema(..., min_length=1, max_length=128)
    template_id: str
