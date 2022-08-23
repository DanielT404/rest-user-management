import jwt from 'jsonwebtoken';
import { readFile } from 'fs/promises';
import { config } from '@config/index';

export async function verifyJWTToken(token: string) {
    return new Promise((resolve, reject) => {
        readFile(config.jwt.pub_key_path).then((publicKey) => {
            jwt.verify(token, publicKey, { algorithms: ['RS512'] }, function (err, decoded) {
                if (err) reject(err.message);
                resolve(decoded);
            });
        })
    })
}

export async function generateJWTToken(payload) {
    return new Promise((resolve, reject) => {
        readFile(config.jwt.private_key_path).then((privateKey) => {
            jwt.sign(payload, privateKey, { algorithm: 'RS512', expiresIn: '1m' }, function (err, token) {
                if (err) reject(err);
                resolve(token);
            });
        })
    })
}

export async function generateRefreshToken(): Promise<string> {
    const { randomBytes } = await import('node:crypto');
    return new Promise((resolve) => {
        randomBytes(64, (err, buf) => {
            resolve(buf.toString('hex'));
        });
    });
}

