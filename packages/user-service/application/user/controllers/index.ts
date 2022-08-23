
import { IUser, RoleEnum } from "@domain/user/interfaces/IUser";
import { IUserQuery } from "@domain/user/interfaces/IUserQuery";
import { validateUser } from "@domain/user";

import { IUserRepository, UserRepository } from "@infrastructure/repositories/user/UserRepository";

import { ActionScope, ResourceActionScope } from '@infrastructure/jwt/interfaces/IUserScope';
import { UserScope } from '@infrastructure/jwt/UserScope';
import { verifyJWTToken } from '@infrastructure/jwt';

import { clearLocalTxtTmpKey } from "@config/index";
import { IUserDTO } from '@domain/user/interfaces/IUserDTO';
import { hashPassword } from '@infrastructure/passwords';
import { redisClient } from "@infrastructure/redis";

class UserController {
    protected userRepository: IUserRepository = new UserRepository();

    public getCurrentUser = (async (req, res) => {
        if (!req.cookies.access_token) return res.status(400).send({ success: false, message: 'User is not logged in.' });
        const user: IUserQuery = await verifyJWTToken(req.cookies.access_token);
        if (!user) return res.status(400).send({ success: false, message: 'Invalid token.' });
        if (user.blacklisted) return res.status(400).send({ success: false, message: 'User is blacklisted.' });
        return res.status(200).send({ success: true, user: user });
    });

    public getAllUsers = (async (req, res) => {
        const { page, per_page, order_by, order_type } = req.query;
        if (page && typeof page !== 'string') {
            return res.status(400).send({ success: false, message: 'Invalid request. `page` query string accepts only string values.' });
        }
        if (page && (isNaN(page) || page == '' || page == ' ')) {
            return res.status(400).send({ success: false, message: 'Invalid request. `page` query string accepts only integer values.' });
        }
        if (per_page && typeof per_page !== 'string') {
            return res.status(400).send({ success: false, message: 'Invalid request. `per_page` query string accepts only string values.' });
        }
        if (per_page && (isNaN(per_page) || per_page == '' || per_page == ' ')) {
            return res.status(400).send({ success: false, message: 'Invalid request. `per_page` query string accepts only integer values.' });
        }
        if (order_by && typeof order_by !== 'string') {
            return res.status(400).send({ success: false, message: 'Invalid request. `order_by` accepts only string values.' });
        }
        if (order_type && !(order_type == "asc" || order_type == "desc")) {
            return res.status(400).send({ success: false, message: 'Invalid request. `order_type` query string accepts only `asc` or `desc` values.' });
        }
        const sortingOptions = { by: order_by, order: order_type == "asc" ? 1 : -1 };
        this.userRepository
            .findAll({ page: page ? parseInt(page) : 1, perPage: per_page ? parseInt(per_page) : 25 }, sortingOptions)
            .then((userData) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { hash, salt, refresh_token, ...users } = userData;
                return res.status(200).send({ success: true, data: users });
            });
    });

    public getUserById = ((req, res) => {
        if (req.params.id.length !== 24) return res.status(400).send({ success: false, message: 'Invalid request.' });
        this.userRepository.findOneBy({ _id: req.params.id }).then((data) => {
            if (data == null) return res.status(400).send({ success: false, message: 'Invalid request.' });
            return data;
        }).then((userData) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { hash, salt, refresh_token, ...user } = userData;
            return res.status(200).send({ success: true, data: user });
        });

    });

    public createUser = (async (req, res) => {
        if (JSON.stringify(req.body) === '{}') return res.status(400).send({ success: false, message: 'Invalid request. Request body is empty.' });
        const { username, password, incomingRoles, incomingPermissions } = req.body;
        if (username == null || username.length == 0) return res.status(400).send({ success: false, message: 'Username is empty.' });
        if (password == null || password.length == 0) return res.status(400).send({ success: false, message: 'Password is empty.' });
        const currentDate = new Date().toISOString();
        const userDTO: IUserDTO = {
            username: username,
            password: password,
            roles: [],
            permissions: [],
            blacklisted: false,
            refresh_token: null,
            created_at: currentDate,
            updated_at: null
        };
        const resourceActionScope: UserScope = new UserScope(userDTO as IUser);
        const userExists = await this.userRepository.exists(userDTO)
        if (userExists) return res.status(401).send({ success: false, message: 'Username already exists.' });
        const error = await validateUser(userDTO);
        if (error.field.length > 0) return res.status(400).send({ success: false, message: error.message });
        if (req.header("X-Auth-Token")) {
            if (req.get("X-Auth-Token") == null) return res.status(418).send({ success: false, message: 'Started to brew coffee.' });
            if (req.get("X-Auth-Token").length !== 50) {
                return res.status(418).send({ success: false, message: 'Started to brew coffee.' });
            }
            await redisClient.connect().catch(() => true);
            const xAuthToken = await redisClient.get('x-auth-token');
            if (req.get("X-Auth-Token") !== xAuthToken) {
                return res.status(418).send({ success: false, message: 'Started to brew coffee.' });
            }
            userDTO.roles = [RoleEnum.Admin];
            resourceActionScope.setAdminResourceActionScope(userDTO as IUser);
            clearLocalTxtTmpKey();
            await redisClient.del('x-auth-token');
            await redisClient.disconnect();
        } else if (req.cookies.access_token) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const token = req.cookies.access_token;
            const resourceActionScope: UserScope = new UserScope(userDTO as IUser);
            try {
                const requestIssuer: IUserQuery = await verifyJWTToken(token);
                if (!requestIssuer.roles.includes(RoleEnum.Admin)) {
                    return res.status(403).send({ success: false, message: 'Forbidden access.' });
                }
                if (requestIssuer.blacklisted) return res.status(403).send({ success: false, message: 'Forbidden access.' });
                if (requestIssuer.permissions.length > 0 && incomingPermissions && incomingPermissions.length > 0) {
                    const requestIssuerPermissions = Object.values(requestIssuer.permissions).filter((permission: ResourceActionScope) => {
                        permission.resource === req.method && req.path.includes(permission.path)
                    });
                    const currentRequestIssuerActionScope = requestIssuerPermissions[0].action;
                    if (currentRequestIssuerActionScope === ActionScope.Self) {
                        userDTO.roles = incomingRoles;
                        userDTO.permissions.map((permission) => {
                            if (permission.resource === requestIssuerPermissions[0].resource) {
                                permission.action = ActionScope.Self;
                            }
                        })
                    } else if (currentRequestIssuerActionScope === ActionScope.All) {
                        userDTO.roles = incomingRoles;
                        userDTO.permissions = incomingPermissions;
                        resourceActionScope.setCustomResourceActionScope(userDTO as IUser);
                    }
                }
            } catch (err) {
                return res.send(403).send({ success: false, message: err });
            }
        } else {
            userDTO.roles = [RoleEnum.Guest];
            resourceActionScope.setGuestResourceActionScope(userDTO as IUser);
        }
        const createdUser = await this.userRepository.create(resourceActionScope.getUserWithACL());
        return res.status(202).send({ success: true, data: createdUser });
    });

    public updateUserById = (async (req, res) => {
        if (JSON.stringify(req.body) === '{}') return res.status(400).send({ success: false, message: 'Invalid request. Request body is empty.' });
        if (!req.params.id) return res.status(400).send({ success: false, message: 'Invalid request.' });
        if (req.params.id.length !== 24) return res.status(400).send({ success: false, message: 'Invalid request.' });
        const { username, password, roles, permissions, blacklisted } = req.body;
        const currentDate = new Date().toISOString();
        const user: IUserQuery = { _id: req.params.id };
        const updatedFields = {};
        if (username) {
            const userExist = await this.userRepository.exists({ username: username });
            if (userExist) return res.status(401).json({ success: false, message: 'Username already exists.' });
            const query = { $set: { username: username, updated_at: currentDate } };
            await this.userRepository.updateOne(user, query);
            updatedFields["username"] = true;
        }
        if (password) {
            if (password.length < 8) return res.status(401).json({ success: false, message: 'Password must have atleast 8 characters.' });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = await hashPassword(password);
            const query = { $set: { hash: result.hash, salt: result.salt, updated_at: currentDate } };
            await this.userRepository.updateOne(user, query);
            updatedFields["password"] = true;
        }
        if (roles) {
            const query = { $set: { roles: roles, updated_at: currentDate } };
            await this.userRepository.updateOne(user, query);
            updatedFields["roles"] = true;
        }
        if (permissions) {
            const query = { $set: { permissions: permissions, updated_at: currentDate } };
            await this.userRepository.updateOne(user, query);
            updatedFields["permissions"] = true;
        }
        if (typeof blacklisted === 'boolean') {
            const query = { $set: { blacklisted: blacklisted, updated_at: currentDate } };
            await this.userRepository.updateOne(user, query);
            updatedFields["blacklisted"] = true;
        }
        return res.status(200).json({ success: true, message: 'Fields have been updated succesfully.', fields_updated: updatedFields });
    });

    public deleteUserById = (async (req, res) => {
        if (!req.params.id) return res.status(400).send({ success: false, message: 'Invalid request.' });
        if (req.params.id.length !== 24) return res.status(400).send({ success: false, message: 'Invalid request.' });
        const user: IUserQuery = { _id: req.params.id };
        const result = await this.userRepository.deleteOne(user);
        if (result.deletedCount > 0) {
            return res.status(200).json({ success: true, message: 'The user has been deleted.' });
        }
        return res.status(401).json({ success: false, message: 'Unknown action.' });
    });

}

const userController = new UserController();
export { userController }