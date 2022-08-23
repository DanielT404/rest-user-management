const config = {
    passwords: {
        byte_length: 64,
    },
    jwt: {
        pub_key_path: '/user-service/config/jwt/pub.key',
        private_key_path: '/user-service/config/jwt/pem.key',
        refresh_token_byte_length: 64
    },
    docker: {
        mongodb: {
            db_name: "test",
            container_name: "mongodb",
            auth: {
                username: "root",
                password: "example"
            },
            get connectionUri() {
                return `mongodb://${this.auth.username}:${this.auth.password}@${this.container_name}`;
            }
        }
    }
}

async function generateTmpXAuthKey(): Promise<string> {
    const { randomBytes } = await import('crypto');
    return new Promise((resolve, reject) => {
        randomBytes(25, (err, buf) => {
            if (err) reject();
            resolve(buf.toString('hex'));
        });
    })
}

async function clearLocalTxtTmpKey() {
    const { truncate } = await import('fs/promises');
    return Promise.resolve().then(() => truncate('/user-service/tmp/x-auth-token.txt', 0));
}

async function writeTmpKeyToLocalTxtFile(tmpKey: string) {
    const { writeFile } = await import('fs/promises');
    return new Promise((resolve, reject) => {
        writeFile('/user-service/tmp/x-auth-token.txt', tmpKey, { flag: 'a+', encoding: 'utf8' })
            .then((value) => {
                resolve(value);
            })
            .catch(() => reject())
    })
}

export { config, generateTmpXAuthKey, clearLocalTxtTmpKey, writeTmpKeyToLocalTxtFile }