import React from 'react';
import App from '../src/App';

if (process.browser) {
  document.title = 'Stome';
}

export default function() {
  return (
    <App/>
  );
}
