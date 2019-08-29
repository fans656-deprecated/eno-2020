import os


DATA_DIR = os.path.abspath(os.path.join(os.path.expanduser('~'), 'eno-graph'))
DATA_JSON = os.path.join(DATA_DIR, 'data.json')
NOTES_DIR = os.path.join(DATA_DIR, 'notes')

with open('./data/enozone.pub') as f:
    PUBKEY = f.read().strip()
