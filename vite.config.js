import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => works on GitHub Pages for any repository name.
export default defineConfig({ base: './', plugins: [react()] });
