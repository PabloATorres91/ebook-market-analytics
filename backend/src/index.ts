// src/index.ts

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { testConnection } from './config/database.js';
import { adRoutes } from './routes/AdRoutes.js';

const app = Fastify({
  logger: true
});

// Habilitar CORS
app.register(cors, {
  origin: true,
  credentials: true
});

// Registrar rutas de anuncios
app.register(adRoutes);

// Ruta de prueba
app.get('/ping', async () => {
  return { message: 'pong' };
});

// Ruta raíz
app.get('/', async () => {
  return {
    name: 'Ebook Market Analytics API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      ping: '/ping',
      search: '/api/ads/search?keyword=libro&country=AR',
      trends: '/api/ads/trends',
      sync: '/api/ads/sync (POST)',
      stats: '/api/ads/stats/AR'
    }
  };
});

const PORT = parseInt(process.env.PORT || '3000');

// Iniciar el servidor
const start = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.log('⚠️  Servidor iniciado pero sin conexión a la base de datos');
    } else {
      console.log('✅ Base de datos conectada correctamente');
    }
    
    // Iniciar el servidor
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Documentación: http://localhost:${PORT}/`);
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();