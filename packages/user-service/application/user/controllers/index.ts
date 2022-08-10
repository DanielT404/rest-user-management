import { clearLocalTxtTmpKey, config, unsetTmpXAuthKey } from "@config/index";
import { IUserDTO } from '@domain/user/interfaces/IUserDTO';
import { IUser, RoleEnum } from "@domain/user/interfaces/IUser";
import { IUserQuery } from "@domain/user/interfaces/IUserQuery";
import { validateUser } from "@domain/user";

import { DIContainer } from '@infrastructure/dependencies/DIContainer';
import { IUserRepository, UserRepository } from "@infrastructure/repositories/user/UserRepository";
import { ActionScope, ResourceActionScope } from '@infrastructure/jwt/interfaces/IUserScope';
import { UserScope } from '@infrastructure/jwt/UserScope';
import { verifyJWTToken } from '@infrastructure/jwt';
import { hashPassword } from '@infrastructure/passwords';

class UserController {
    protected userRepository: IUserRepository = new UserRepository();

    public getAllUsers = (async (req, res) => {
        this.userRepository.findAll().then((users) => {
            return res.status(200).send({ success: true, data: users });
        });
    })

    public getUserById = ((req, res) => {
        if (req.params.id.length !== 24) return res.status(400).send({ success: false, message: 'Invalid requeste.' });
        const user: IUserQuery = { _id: req.params.id };
        this.userRepository.findOneById(user).then((data) => {
            if (data == null) return res.status(400).send({ success: false, message: 'Invalid request.' });
            return data;
        }).then((userData) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...user } = userData;
            return res.status(200).json({ success: true, data: user });
        });

    });

    public createUser = (async (req, res) => {
        const { username, password, incomingRoles, incomingPermissions } = req.body;
        if (username == null || username.length == 0) return res.status(403).send({ success: false, message: 'Username is empty.' });
        if (password == null || password.length == 0) return res.status(403).send({ success: false, message: 'Password is empty.' });
        const userDTO: IUserDTO = { username: username, password: password, roles: [], permissions: [] }
        const resourceActionScope: UserScope = new UserScope(userDTO as IUser);
        const userExists = await this.userRepository.exists(userDTO)
        if (userExists) return res.status(401).send({ success: false, message: 'Username already exists.' });
        const error = await validateUser(userDTO);
        if (error.field.length > 0) return res.status(400).send({ success: false, message: error.message });
        if (req.header("X-Auth-Token")) {
            if (req.get("X-Auth-Token") == null) return res.status(418).send({ success: false, message: 'Started to brew coffee.' });
            const diContainer: DIContainer = DIContainer.getInstance();
            const xAuthToken = diContainer.getDependency("config.docker.http.xauth")();
            if (req.get("X-Auth-Token").length !== 50) {
                return res.status(418).send({ success: false, message: 'Started to brew coffee.' });
            }
            if (req.get("X-Auth-Token") !== xAuthToken) {
                return res.status(418).send({ success: false, message: 'Started to brew coffee.' });
            }
            userDTO.roles = [RoleEnum.Admin];
            resourceActionScope.setAdminResourceActionScope(userDTO as IUser);
            clearLocalTxtTmpKey();
            unsetTmpXAuthKey(config);
        } else if (req.header("Authorization")) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, token] = req.get("Authorization").split(" ");
            const userDTO: IUserDTO = { username: username, password: password, roles: [], permissions: [] }
            const resourceActionScope: UserScope = new UserScope(userDTO as IUser);
            try {
                const requestIssuer: IUserQuery = await verifyJWTToken(token);
                if (requestIssuer.roles.indexOf(RoleEnum.Admin) == -1) {
                    return res.status(403).send({ success: false, message: 'Forbidden access.' });
                } else if (requestIssuer.permissions.length > 0 && incomingPermissions && incomingPermissions.length > 0) {
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
        return res.status(200).send({ success: true, data: createdUser });
    });

    public updateUserById = (async (req, res) => {
        if (req.body._id.length !== 24) return res.status(400).send({ success: false, message: 'Invalid request.' });
        const user: IUserQuery = { _id: req.body._id };
        const { username, password } = req.body;
        if (username && username.length > 0) {
            const userExist = await this.userRepository.exists({ username: username });
            if (userExist) return res.status(401).json({ success: false, message: 'Username already exists. ' });
            const filter = { $set: { username: username } };
            const result = await this.userRepository.updateOne(user, filter);
            return res.status(200).json({ success: true, message: 'Your username has been changed succesfully.', data: result });
        }
        if (password) {
            if (password.length < 8) return res.status(401).json({ success: false, message: 'Password must have atleast 8 characters.' });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = await hashPassword(password);
            const data = await this.userRepository.updateOne(user, { $set: { hash: result.hash, salt: result.salt } });
            return res.status(200).json({ success: true, message: 'Your password has been changed succesfully.', data: data });
        }
        return res.status(403).json({ success: false, message: 'Unknown action.' });
    });

    public deleteUserById = (async (req, res) => {
        if (req.body._id.length !== 24) return res.status(400).send({ success: false, message: 'Invalid request.' });
        const user: IUserQuery = { _id: req.body._id };
        const result = await this.userRepository.deleteOne(user);
        if (result.deletedCount > 0) {
            return res.status(200).json({ success: true, message: 'The user has been deleted.', data: result });
        }
        return res.status(401).json({ success: false, message: 'Unknown operation', data: result });
    });

}

const userController = new UserController();
export { userController }