import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';

const root = document.getElementById('standards-explorer-root');

if (!root) throw new Error('Missing standards explorer root element.');

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
