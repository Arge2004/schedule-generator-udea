import { createClient } from 'redis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

let redisClient = null;
let isConnected = false;

async function getClient() {
  if (redisClient && isConnected) {
    return redisClient;
  }

  try {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis conectado');
      isConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error);
    return null;
  }
}

export async function get(key) {
  try {
    const client = await getClient();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error('Error obteniendo de caché:', error);
    return null;
  }
}

export async function set(key, value, ttl = 3600) {
  try {
    const client = await getClient();
    if (!client) return false;

    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error guardando en caché:', error);
    return false;
  }
}

export async function del(key) {
  try {
    const client = await getClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error('Error eliminando de caché:', error);
    return false;
  }
}

export async function clear() {
  try {
    const client = await getClient();
    if (!client) return false;

    await client.flushDb();
    return true;
  } catch (error) {
    console.error('Error limpiando caché:', error);
    return false;
  }
}
