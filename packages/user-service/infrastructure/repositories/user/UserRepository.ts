import { ObjectId } from "mongodb";
import { config } from "@config/index";
import { IUserQuery } from "@domain/user/interfaces/IUserQuery";
import { IUserDTO } from "@domain/user/interfaces/IUserDTO";
import { MongoDb } from "@infrastructure/database/mongodb";
import { hashPassword } from "@infrastructure/passwords";

export interface IUserRepository {
    exists(user: IUserQuery),
    findAll(),
    findOneByUsername(user: IUserQuery),
    findOneById(user: IUserQuery),
    create(user: IUserQuery),
    updateOne(user: IUserQuery, filter: { $set: Record<string, unknown> }),
    deleteOne(user: IUserQuery)
}

export class UserRepository {
    private _db_name = config.docker.mongodb.db_name;
    private _collection = "users";

    async exists(user: IUserQuery) {
        const client = new MongoDb();
        const connection = await client.openConnection();
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        const query: IUserQuery = { username: user.username };
        const dbUser = await collection.findOne(query);
        client.closeConnection();
        return dbUser !== null ? true : false;
    }

    async findAll() {
        const client = new MongoDb();
        const connection = await client.openConnection();
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        const data = collection.find({}).toArray();
        return data;
    }

    async findOneByUsername(user: IUserQuery) {
        const client = new MongoDb();
        const connection = await client.openConnection()
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        const data = await collection.findOne({ username: user.username });
        client.closeConnection();
        return data;
    }

    async findOneById(user: IUserQuery) {
        const client = new MongoDb();
        const connection = await client.openConnection();
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        const data = await collection.findOne({ _id: new ObjectId(user._id) });
        client.closeConnection();
        return data;
    }

    async create(user: IUserDTO) {
        if (!user.username || !user.password || !user.roles || !user.permissions) return false;
        const client = new MongoDb();
        const connection = await client.openConnection();
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await hashPassword(user.password.toString())
        const query: IUserQuery = { username: user.username, hash: result.hash, salt: result.salt, roles: user.roles, permissions: user.permissions };
        const dbUser = await collection.insertOne(query);
        client.closeConnection();
        return dbUser;
    }

    async updateOne(user: IUserQuery, filter = { $set: {} }) {
        const client = new MongoDb();
        const connection = await client.openConnection();
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        const data = await collection.updateOne({ _id: new ObjectId(user._id) }, filter);
        client.closeConnection();
        return data;
    }

    async deleteOne(user: IUserQuery) {
        const client = new MongoDb();
        const connection = await client.openConnection();
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        const query: IUserQuery = { _id: new ObjectId(user._id) };
        const result = await collection.deleteOne(query);
        client.closeConnection();
        return result;
    }
}