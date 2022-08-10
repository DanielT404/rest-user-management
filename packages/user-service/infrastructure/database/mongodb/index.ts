import { MongoClient } from 'mongodb';
import { config } from '@config/index';
import { connectClient } from './utils';

export class MongoDb {
    private _connection;

    public getConnection() {
        return this._connection;
    }
    public async openConnection() {
        this._connection = await connectClient(new MongoClient(config.docker.mongodb.connectionUri));
        return this._connection;
    }
    public closeConnection() {
        this._connection.close();
        return true;
    }
}