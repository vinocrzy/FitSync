import fastify from 'fastify';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
import syncRoutes from './routes/sync';
import authRoutes from './routes/auth';

dotenv.config();

const server = fastify();

server.register(cors, {
  origin: '*', // Allow all for dev, restrict in prod
});

server.register(syncRoutes);
server.register(authRoutes);

server.get('/', async (request, reply) => {
  return { status: 'ok', server: 'FitSync Backend' };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
