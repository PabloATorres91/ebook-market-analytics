import Fastify from 'fastify';
import cors from '@fastify/cors';
import pool, { testConnection } from './config/database.js';

const app = Fastify({
  logger: true
});

// Habilitar CORS
app.register(cors, {
  origin: true,
  credentials: true
});

// Ruta de prueba
app.get('/ping', async () => {
  return { message: 'pong' };
});

const PORT = 3000;

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
    
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();