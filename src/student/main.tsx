import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { armAudioUnlock } from '../board/Narrator.ts';
import { StoreProvider } from '../lib/store.tsx';
import { StudentApp } from './StudentApp.tsx';
import '../styles/base.css';
import '../styles/board.css';
import './student.css';
import './arcade/arcade.css';
import './lessons/lessons.css';

declare global {
  interface Window {
    __ssMounted?: boolean;
  }
}

armAudioUnlock(); // the first tap anywhere lets the lessons speak, even ones that start from a link
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <StudentApp />
    </StoreProvider>
  </StrictMode>,
);
window.__ssMounted = true;
