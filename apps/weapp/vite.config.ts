import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
