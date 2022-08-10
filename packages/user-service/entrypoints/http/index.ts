import { config, generateTmpXAuthKey, setTmpXAuthKey, writeTmpKeyToLocalTxtFile, clearLocalTxtTmpKey } from '@config/index';
import { addMockUsersToDatabase } from '@infrastructure/database/mocks';
import { bootstrap } from './bootstrap'
import { Framework } from './interfaces'

(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addMockUsersToDatabase(config.users.mockNumber).then((result: any) => {
        const { successCounter, failureCounter, duration, userCount } = result;
        console.info(`[MOCK] Finished adding ${userCount} mock users to database. Duration: ${duration}s | Success attempts: ${successCounter} | Failure attempts: ${failureCounter}`);
    });
    await clearLocalTxtTmpKey();
    const key = await generateTmpXAuthKey();
    await writeTmpKeyToLocalTxtFile(key);
    await setTmpXAuthKey(config, key);
    console.info(`[MOCK] Started adding ${config.users.mockNumber} mock users to database.`);
    console.info("[INFO] Succesfully generated a random key to create the default admin user.")
    console.info("[INFO] Get the random key from `/tmp/x-auth-token.txt` and use it in the `X-Auth-Token` request header value to the POST /users from your client of choice.")
    console.info("[INFO] Once the random key has been used, it will no longer be available.")
    await bootstrap(Framework.Express);
})();


