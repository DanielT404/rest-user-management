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
            if (!userExists) return false;
            const dbUser = await this.userRepository.findOneByUsername({ username: user.username });
            if (dbUser == null) return false;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const validCredentials: any = await checkPassword(user.password, dbUser.hash, dbUser.salt);
            if (!validCredentials) return false;
            const jwtToken = await generateJWTToken(dbUser);
            return jwtToken;
        } catch (error) {
            return error;
        }
    }

    async isValidToken(token: string) {
        const value = await verifyJWTToken(token);
        return value;
    }
}