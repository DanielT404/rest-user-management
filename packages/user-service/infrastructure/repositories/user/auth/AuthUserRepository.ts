import { IUserQuery } from "@domain/user/interfaces/IUserQuery";

import { generateJWTToken, verifyJWTToken } from "@infrastructure/jwt";
import { checkPassword } from "@infrastructure/passwords";
import { IUserRepository, UserRepository } from "@infrastructure/repositories/user/UserRepository";

export interface IAuthUserRepository {
    login(user: IUserQuery)
    isValidToken(token: string)
}

export class AuthUserRepository {
    protected userRepository: IUserRepository = new UserRepository();

    async login(user: IUserQuery) {
        try {
            const userExists = await this.userRepository.exists(user);
            if (!userExists) return Promise.reject("Invalid username or password.");
            const dbUser = await this.userRepository.findOneBy({ username: user.username });
            if (dbUser.blacklisted) return Promise.reject("User is blacklisted.");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validCredentials: any = await checkPassword(user.password, dbUser.hash, dbUser.salt);
            if (!validCredentials) return Promise.reject("Invalid username or password.")
            const accessToken = await generateJWTToken(dbUser);
            const refreshToken = dbUser.refresh_token;
            return { access_token: accessToken, refresh_token: refreshToken };
        } catch (error) {
            return error;
        }
    }

    async isValidToken(token: string) {
        const value = await verifyJWTToken(token);
        return value;
    }
}