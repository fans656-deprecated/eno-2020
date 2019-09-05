import { assert } from 'chai';
import Uploader from '../src/uploader';

const FILE = {name: 'test'};

describe('Uploader', () => {
  it('pass sanity check', () => {
    const uploader = new Uploader();
    uploader.onScheduled((uploads, _uploader) => {
      assertUploads(uploads);
      assert.equal(_uploader, uploader);
    });
    let uploads = uploader.upload('', [FILE]);
    assertUploads(uploads);
    assertUploads(uploader.uploads);
  });
});

describe('Uploader', () => {
  describe('#upload', () => {
    it('should accept single file', () => {
    });
    it('should accept a list of files', () => {
    });
    it('should return a list of `Upload`', () => {
    });
  });
});

function assertUploads(uploads) {
  assert(Array.isArray(uploads));
  assert(uploads.length > 0);

  const upload = uploads[0];
  assert.isFunction(upload.start);
  assert.isFunction(upload.abort);
}
