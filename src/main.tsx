import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n/config';

// Apply stored theme synchronously to prevent flash
try {
  const stored = localStorage.getItem('qurandec-theme');
  document.documentElement.dataset.theme = stored === 'light' ? 'light' : 'dark';
} catch { /* noop */ }

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
