import { IUserQuery } from "@domain/user/interfaces/IUserQuery";

import { checkAuthorizationHeaders } from "@infrastructure/jwt/utils";
import { ActionScope, ResourceActionScope, ResourceScope } from "@infrastructure/jwt/interfaces/IUserScope";
import { AuthUserRepository, IAuthUserRepository } from "@infrastructure/repositories/user/auth/AuthUserRepository";
import { IUserRepository, UserRepository } from "@infrastructure/repositories/user/UserRepository";
import { generateJWTToken, generateRefreshToken } from "@infrastructure/jwt";

class AuthUserController {
    protected authUserRepository: IAuthUserRepository = new AuthUserRepository();
    protected userRepository: IUserRepository = new UserRepository();

    public login = (async (req, res) => {
        const { username, password } = req.body;
        if (username == null || username.length == 0) return res.status(403).send({ success: false, message: 'Username is empty.' });
        if (password == null || password.length == 0) return res.status(403).send({ success: false, message: 'Password is empty.' });
        const query: IUserQuery = { username: username, password: password }
        try {
            const result = await this.authUserRepository.login(query);
            if (result) {
                res.cookie('access_token', result.access_token, { expires: new Date(Date.now() + 60000), httpOnly: true, secure: true, sameSite: 'lax' });
                res.cookie('refresh_token', result.refresh_token, { httpOnly: true, secure: true, sameSite: 'lax' });
                return res.status(200).send({ success: true, message: `${username} has been authenticated succesfully.` });
            }
        } catch (err) {
            return res.status(403).json({ success: false, message: err });
        }
    });

    public refreshJwt = (async (req, res) => {
        if (!req.cookies.refresh_token) return res.status(400).send({ success: false, message: 'Invalid request.' });
        if (req.cookies.refresh_token.length !== 128) return res.status(400).send({ success: false, message: 'Invalid request.' });
        const user = await this.userRepository.findOneBy({ refresh_token: req.cookies.refresh_token });
        if (!user) return res.status(400).send({ success: false, message: 'Invalid request. ' });
        if (user.blacklisted) return res.status(403).send({ success: false, message: 'User is blacklisted.' });
        const jwtToken = await generateJWTToken(user);
        const refreshToken = await generateRefreshToken();
        await this.userRepository.updateOne(user, { $set: { refresh_token: refreshToken } });
        res.cookie('access_token', jwtToken, { expires: new Date(Date.now() + 60000), httpOnly: true, secure: true, sameSite: 'lax' });
        res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'lax' });
        return res.status(200).send({ success: true, message: 'JWT token has been refreshed succesfully.' });
    })

    public authGetAllUsers = (async (req, res, next) => {
        try {
            const jwtToken = await checkAuthorizationHeaders(req);
            const user = await this.authUserRepository.isValidToken(jwtToken);
            const hasPermission = user.permissions.find((permission) => permission.action === ActionScope.All && permission.resource == ResourceScope.GET && permission.path == 'users');
            if (!hasPermission) return res.status(403).json({ success: false, message: 'Unauthorized request.' });
        } catch (err) {
            return res.status(403).json({ success: false, message: err });
        }
        next();
    })

    public getActionScopes = (async (req, res, next) => {
        if (req.method === "POST" && (req.path.includes("login") || req.path.includes("users"))) {
            next();
        } else {
            try {
                const jwtToken = await checkAuthorizationHeaders(req);
                this.authUserRepository.isValidToken(jwtToken)
                    .then((user) => {
                        if (user) {
                            user.permissions = Object.values(user.permissions).filter((object: ResourceActionScope) => object.resource === req.method && req.path.includes(object.path));
                        }
                        return user;
                    })
                    .then((user: IUserQuery) => {
                        const issuerPermissions = user.permissions[0]
                        if (user.roles.includes("guest") && issuerPermissions.action == ActionScope.Self) {
                            if (req.method === "GET" && (req.params.id !== user._id)) return false;
                            if (req.method === "PATCH" && (
                                (req.body.roles || req.body.permissions || req.body.blacklisted || req.body.refresh_token || (req.params.id !== user._id)))) return false;
                            if (req.method === "DELETE" && (
                                (req.body.roles || req.body.permissions || req.body.blacklisted || req.body.refresh_token || (req.params.id !== user._id)))) return false;
                        }
                        return true;
                    })
                    .then((permission) => {
                        if (!permission) return res.status(403).send({ success: false, message: 'Forbidden access.' });
                        next();
                    })
                    .catch((err) => res.status(401).send({ success: false, message: err }))
            } catch (err) {
                return res.status(403).send({ success: false, message: err });
            }
        }
    })
}

const authUserController = new AuthUserController();
export { authUserController }