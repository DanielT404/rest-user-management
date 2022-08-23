import { bootstrap } from './bootstrap'
import { Framework } from './interfaces'
import { redisClient } from '@infrastructure/redis';
import { clearLocalTxtTmpKey, generateTmpXAuthKey, writeTmpKeyToLocalTxtFile } from '@config/index';

export async function generateHttpXAuthToken() {
    await clearLocalTxtTmpKey();
    await redisClient.connect().catch(() => true);
    await redisClient.del('x-auth-token');
    const tokenExists = await redisClient.exists('x-auth-token') === 1;
    if (!tokenExists) {
        await clearLocalTxtTmpKey();
        const token = await generateTmpXAuthKey();
        await redisClient.set('x-auth-token', token);
        await writeTmpKeyToLocalTxtFile(token).catch(() => process.exit(1));
    }
    await redisClient.disconnect();
}

(async () => {
    await generateHttpXAuthToken();
    await bootstrap(Framework.Express, process.env.SERVICE_PORT);
})();