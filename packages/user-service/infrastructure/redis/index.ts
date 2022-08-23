import { createClient } from 'redis';
const redisClient = createClient({ url: 'redis://redis:6379' });
const connectRedisClient = async (client) => {
    client.on('error', () => process.exit());
    await client.connect();
}

export { redisClient, connectRedisClient }
