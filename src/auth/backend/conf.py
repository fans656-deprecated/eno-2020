import os


with open(os.path.join('/data/enozone')) as f:
    PRIKEY = f.read().strip()

with open(os.path.join('/data/enozone.pub')) as f:
    PUBKEY = f.read().strip()
