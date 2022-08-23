import { ObjectId } from "mongodb";
import { config } from "@config/index";
import { IUserQuery } from "@domain/user/interfaces/IUserQuery";
import { IUserDTO } from "@domain/user/interfaces/IUserDTO";
import { MongoDb } from "@infrastructure/database/mongodb";
import { hashPassword } from "@infrastructure/passwords";
import { generateRefreshToken } from "@infrastructure/jwt";

export interface IUserRepository {
    exists(user: IUserQuery),
    findAll(options: Record<string, number>, sort?: Record<string, number>),
    findOneBy(filter: Record<string, string>),
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

    async findAll(options = { page: 1, perPage: 25 }, sort?: Record<string, number>) {
        const client = new MongoDb();
        const connection = await client.openConnection();
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        const data = await collection.find({})
            .limit(options.perPage)
            .skip(options.perPage * (options.page - 1));
        if (sort) {
            const { by, order } = sort;
            const sortOptions = {
                [by]: [order]
            };
            if (by && order) return data.sort(sortOptions).toArray();
        }
        return data.toArray();
    }

    async findOneBy(filter) {
        const client = new MongoDb();
        const connection = await client.openConnection()
        const db = connection.db(this._db_name);
        const collection = db.collection(this._collection);
        if (filter._id) {
            filter._id = new ObjectId(filter._id);
        }
        const data = await collection.findOne(filter)
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
        const passwordSet: any = await hashPassword(user.password.toString())
        const refreshToken: string = await generateRefreshToken();
        const query: IUserQuery =
        {
            username: user.username,
            hash: passwordSet.hash,
            salt: passwordSet.salt,
            refresh_token: refreshToken,
            blacklisted: false,
            roles: user.roles,
            permissions: user.permissions,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
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