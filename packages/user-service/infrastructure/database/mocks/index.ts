import { IUser, RoleEnum } from "@domain/user/interfaces/IUser";
import { IUserQuery } from "@domain/user/interfaces/IUserQuery";
import { UserScope } from "@infrastructure/jwt/UserScope";
import { IUserRepository, UserRepository } from "@infrastructure/repositories/user/UserRepository";

export async function addMockUsersToDatabase(userCount: number, cb: CallableFunction): Promise<object> {
    const util = await import('util');
    const { randomBytes } = await import('crypto');
    const fsRandomBytes = util.promisify(randomBytes);
    const date = new Date().toISOString();
    const started = performance.now();
    const userRepository: IUserRepository = new UserRepository();
    let successCounter = 0;
    let failureCounter = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (let i = 0; i < userCount; i++) {
        const user: IUserQuery = { username: '', password: '', roles: [], permissions: [], blacklisted: false, created_at: date, updated_at: null };
        const userScope: UserScope = new UserScope(user as IUser);
        user.username = await (await fsRandomBytes(2)).toString('hex');
        user.password = await (await fsRandomBytes(4)).toString('hex');
        user.refresh_token = await (await fsRandomBytes(5)).toString('hex');
        user.roles = [RoleEnum.Guest];
        userScope.setGuestResourceActionScope(user as IUser);
        await userRepository.create(user).then((data) => {
            data.acknowledged ? successCounter++ : failureCounter++;
        });
    }
    const finished = performance.now();
    const duration = (finished - started) / 1000;
    return cb({ successCounter, failureCounter, duration, userCount });
}