import { randomBytes } from 'crypto';
import { IUser } from "@domain/user/interfaces/IUser";
import { IUserQuery } from "@domain/user/interfaces/IUserQuery";
import { UserScope } from "@infrastructure/jwt/UserScope";
import { IUserRepository, UserRepository } from "@infrastructure/repositories/user/UserRepository";

function between(min, max) {
    return Math.floor(
        Math.random() * (max - min) + min
    )
}

export async function addMockUsersToDatabase(userCount: number): Promise<object> {
    const started = performance.now();
    const userRepository: IUserRepository = new UserRepository();
    const availableRoles = ['guest', 'admin'];
    let successCounter = 0;
    let failureCounter = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (let i = 0; i < userCount; i++) {
        const user: IUserQuery = { username: '', password: '', roles: [], permissions: [] };
        const userScope: UserScope = new UserScope(user as IUser);
        const randomUsername = randomBytes(2);
        user.username = randomUsername.toString('hex');
        const randomRole = availableRoles[between(0, availableRoles.length)];
        user.roles = [randomRole];
        if (between(0, 5001) % 2 === 0) {
            userScope.setAdminResourceActionScope(user as IUser);
        } else {
            userScope.setGuestResourceActionScope(user as IUser);
        }
        const randomPassword = randomBytes(4);
        user.password = randomPassword.toString('hex');
        await userRepository.create(user).then((data) => {
            data.acknowledged ? successCounter++ : failureCounter++;
        });
    }
    const finished = performance.now();
    const duration = (finished - started) / 1000;
    return { successCounter, failureCounter, duration, userCount };
}