import { config } from '@config/index';

async function generateRandomSalt(): Promise<string> {
    const { randomBytes } = await import('node:crypto');
    return new Promise((resolve, reject) => {
        randomBytes(config.passwords.byte_length, (err, buf) => {
            if (err) reject(err);
            resolve(buf.toString('hex'));
        });
    })
}

export async function hashPassword(password: string) {
    const { scrypt } = await import('node:crypto');
    const salt = await generateRandomSalt();
    return new Promise((resolve) => {
        scrypt(password, salt, config.passwords.byte_length, (err, derivedKey) => {
            if (err) throw err;
            resolve({ hash: derivedKey.toString('hex'), salt: salt });
        });
    })
}

export async function checkPassword(password: string, existingHash: string, existingSalt: string) {
    const { scrypt } = await import('node:crypto');
    return new Promise((resolve) => {
        scrypt(password, existingSalt, config.passwords.byte_length, (err, hash) => {
            if (err) return false;
            resolve(hash.toString('hex') === existingHash);
        })
    });
}
