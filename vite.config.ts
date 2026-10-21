import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' يجعل الموقع يعمل من أي رابط في GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: './',
});
