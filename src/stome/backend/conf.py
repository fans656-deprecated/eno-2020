import os


ROOT_DIR = os.path.abspath(os.environ.get('ROOT', '/data/root'))
META_DIR = os.path.join(ROOT_DIR, 'meta')
TEMP_DIR = os.path.join(ROOT_DIR, 'temp')
INODE_DIR = os.path.join(ROOT_DIR, 'inode')
INODE_META_DIR = os.path.join(ROOT_DIR, 'inode-meta')

META_DIR_PREFIX_LENGTH = len(META_DIR)

with open('/data/enozone.pub') as f:
    PUBKEY = f.read().strip()

for path in (ROOT_DIR, META_DIR, INODE_DIR):
    if not os.path.exists(path):
        os.makedirs(path)
