import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { telegram } from './lib/telegram.ts';
import './styles/base.css';
import './styles/shell.css';
import './styles/kids.css';
import './styles/academic.css';
import './styles/clarity.css';
import './styles/redesign.css';

declare global {
  interface Window {
    __ssMounted?: boolean;
  }
}

telegram.init();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
window.__ssMounted = true;
