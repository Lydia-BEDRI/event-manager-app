import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './observability/sentry';
import { configureMatomo } from './observability/matomo';

configureMatomo();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
