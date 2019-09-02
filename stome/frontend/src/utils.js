import { message, notification } from 'antd';

export function noop() {
  // noop
}

export function error(message, text) {
  try {
    text = JSON.stringify(JSON.parse(text), null, 2);
  } catch (e) {
    // noop
  }
  notification.error({
    message: message,
    description: (
      <pre style={{
        fontSize: '.9em',
        fontFamily: 'Consolas; Courier New',
      }}>{text}</pre>
    ),
  });
}

export const api = {
  get: function(path) {
    return _request('GET', path);
  },

  post: function(path, data) {
    return _request('POST', path, data);
  },
};

function _request(method, path, data) {
  return new Promise(async (resolve) => {
    const options = {
      method: method,
    };
    if (data) {
      options.body = JSON.stringify(data);
    }
    const res = await fetch(path, options);
    if (res.status === 200) {
      const text = await res.text();
      try {
        resolve(text.length ? JSON.parse(text) : {});
      } catch (e) {
        console.log(e);
        error('Parse error', text);
      }
    } else {
      error(`${method} ${path} (${res.status})`, await res.text());
    }
  });
}
