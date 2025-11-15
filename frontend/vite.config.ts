import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Read backend port from file (written by backend on startup)
function getBackendPort() {
  try {
    const portFile = path.resolve(__dirname, '../backend/.backend-port');
    if (fs.existsSync(portFile)) {
      return fs.readFileSync(portFile, 'utf-8').trim();
    }
  } catch (e) {
    console.warn('Could not read backend port file, using default');
  }
  return '3001';
}

// Auto-detect available port for frontend
async function getAvailablePort(startPort: number): Promise<number> {
  const net = await import('net');

  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as any).port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(getAvailablePort(startPort + 1));
    });
  });
}

export default defineConfig(async ({ mode }) => {
  const frontendPort = await getAvailablePort(3000);
  const backendPort = getBackendPort();

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(`http://localhost:${backendPort}`),
    },
  };
});
