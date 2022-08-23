import { MongoClient } from 'mongodb';
import { config } from '@config/index';
import { connectClient } from './utils';

export class MongoDb {
    private _connection;

    public getConnection() {
        return this._connection;
    }
    public async openConnection() {
        this._connection = await connectClient(new MongoClient(config.docker.mongodb.connectionUri, {
            socketTimeoutMS: 300000,
            maxPoolSize: 20000,
            loggerLevel: 'debug',
            keepAlive: true,
            connectTimeoutMS: 300000,
        }));
        return this._connection;
    }
    public closeConnection() {
        this._connection.close();
        return true;
    }
}