import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const appNodeModules = path.resolve(__dirname, 'node_modules');

export default defineConfig({
  server: {
    port: 3002,
    host: '0.0.0.0',
    fs: {
      allow: [path.resolve(__dirname, '..')]
    }
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['@logto/react'],
    exclude: ['@ouim/logto-authkit', '@ouim/logto-authkit/server', '@ouim/logto-authkit/bundler-config']
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      react: path.resolve(appNodeModules, 'react'),
      'react-dom': path.resolve(appNodeModules, 'react-dom'),
      '@ouim/logto-authkit': path.resolve(__dirname, '../src/index.ts'),
      '@ouim/logto-authkit/server': path.resolve(__dirname, '../src/server/index.ts'),
      '@ouim/logto-authkit/bundler-config': path.resolve(__dirname, '../src/bundler-config.ts')
    }
  }
});
