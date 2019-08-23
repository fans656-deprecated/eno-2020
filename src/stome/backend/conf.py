import os


ROOT_DIR = os.path.abspath(os.environ.get('ROOT', '/data/root'))
META_DIR = os.path.join(ROOT_DIR, 'meta')
INODE_DIR = os.path.join(ROOT_DIR, 'inode')
INODE_META_DIR = os.path.join(ROOT_DIR, 'inode-meta')

with open('/data/enozone.pub') as f:
    PUBKEY = f.read().strip()

for path in (ROOT_DIR, META_DIR, INODE_DIR):
    if not os.path.exists(path):
        os.makedirs(path)
