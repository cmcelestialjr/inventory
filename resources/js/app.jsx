import React from 'react';
import ReactDOM from 'react-dom/client';
import RouterApp from './router';

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(
  <React.StrictMode>
    <RouterApp />
  </React.StrictMode>
);
