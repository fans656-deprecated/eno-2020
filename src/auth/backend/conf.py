import os


with open(os.path.join('./secret/enozone')) as f:
    PRIKEY = f.read().strip()

with open(os.path.join('./secret/enozone.pub')) as f:
    PUBKEY = f.read().strip()
