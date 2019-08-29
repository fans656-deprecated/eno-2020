import {
  message, notification,
} from 'antd';

export async function error(res, message) {
  let text = res;
  let status = 'Error';
  if (typeof(res) !== 'string') {
    status = res.status;
    try {
      text = JSON.stringify(JSON.parse(await res.text()), null, 2);
    } catch (e) {
      // noop
    }
  }
  notification.error({
    message: message || status,
    description: (
      <pre>{text}</pre>
    ),
  });
}

export const api = {
  post: function(path, data) {
    return new Promise(async (resolve) => {
      const res = await fetch(path, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.status === 200) {
        const text = await res.text();
        try {
          resolve(text.length ? JSON.parse(text) : {});
        } catch (e) {
          console.log(e);
          error(text, 'Parse error');
        }
      } else {
        error(res);
      }
    });
  },
};
