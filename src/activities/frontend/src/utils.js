import _ from 'lodash';

export function noop() {
}

export function truncatedTitle(title) {
  return _.truncate(title, {length: 20});
}
