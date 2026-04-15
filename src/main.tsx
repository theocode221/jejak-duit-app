import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installEnterKeyFocusNext } from '@/utils/enterKeyFocusNext';
import './index.css';

installEnterKeyFocusNext();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
