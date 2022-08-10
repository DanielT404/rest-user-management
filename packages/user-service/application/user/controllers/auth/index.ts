import { IUserQuery } from "@domain/user/interfaces/IUserQuery";
import { checkAuthorizationHeaders } from "@infrastructure/jwt/utils";
import { ActionScope, ResourceActionScope, ResourceScope } from "@infrastructure/jwt/interfaces/IUserScope";
import { AuthUserRepository, IAuthUserRepository } from "@infrastructure/repositories/user/auth/AuthUserRepository";
import { IUserRepository, UserRepository } from "@infrastructure/repositories/user/UserRepository";

class AuthUserController {
    protected authUserRepository: IAuthUserRepository = new AuthUserRepository();
    protected userRepository: IUserRepository = new UserRepository();

    public login = (async (req, res) => {
        const { username, password } = req.body;
        if (username == null || username.length == 0) return res.status(403).send({ success: false, message: 'Username is empty.' });
        if (password == null || password.length == 0) return res.status(403).send({ success: false, message: 'Password is empty.' });
        const query: IUserQuery = { username: username, password: password }
        this.authUserRepository.login(query).then((token) => {
            if (token) return res.status(200).send({ success: true, token: token });
            return res.status(401).send({ success: false, message: 'Wrong credentials.' });
        });
    });

    public authGetAllUsers = (async (req, res, next) => {
        const authorizationHeader = await checkAuthorizationHeaders(req);
        if (!Array.isArray(authorizationHeader)) return res.status(403).json({ success: false, message: 'Invalid Authorization header syntax.' });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, token] = authorizationHeader;
        try {
            const user = await this.authUserRepository.isValidToken(token);
            const hasPermission = user.permissions.find((permission) => permission.action === ActionScope.All && permission.resource == ResourceScope.GET && permission.path == 'users');
            if (!hasPermission) return res.status(403).json({ success: false, message: 'Unauthorized request.' });
        } catch (err) {
            return res.status(403).json({ success: false, message: err });
        }
        next();
    })

    public getActionScopes = (async (req, res, next) => {
        if (req.method === "POST" && !req.header("Authorization")) {
            next();
        } else {
            if (!req.header("Authorization")) return res.status(401).send({ success: false, message: 'Authorization header missing.' });
            const [bearer, token] = req.header("Authorization").split(" ");
            if (!bearer) return res.status(401).send({ success: false, message: 'Invalid Authorization header.' });
            if (token && token.length === 0) return res.status(401).send({ success: false, message: 'Empty Authorization Bearer token.' });
            this.authUserRepository.isValidToken(token)
                .then((user) => {
                    if (user) {
                        user.permissions = Object.values(user.permissions).filter((object: ResourceActionScope) => object.resource === req.method && req.path.includes(object.path));
                    }
                    return user;
                })
                .then((user: IUserQuery) => {
                    const issuerPermissions = user.permissions[0]
                    if (user.roles.includes("guest") && issuerPermissions.action == ActionScope.Self) {
                        if (req.method === "GET" && (req?.params?.id !== user._id)) return false;
                        if (
                            req.method === "POST" &&
                            (req?.body?.roles || req?.body?.permissions)
                        ) return false;
                        if (req.method === "PUT" && (
                            (req?.body?.roles || req?.body?.permissions || (req?.body?._id !== user._id)))) return false;
                        if (req.method === "DELETE" && (
                            (req?.body?.roles || req?.body?.permissions || (req?.body?._id !== user._id)))) return false;
                    }
                    return true;
                })
                .then((permission) => {
                    if (!permission) return res.status(403).send({ success: false, message: 'Forbidden access.' });
                    next();
                })
                .catch((err) => res.status(401).send({ success: false, message: err }))
        }
    })

    public jwtToken = (async (req, res) => {
        if (!req.header("Authorization")) return res.status(401).send({ success: false, message: 'Authorization header missing.' });
        const [bearer, token] = req.header("Authorization").split(" ");
        if (!bearer) return res.status(401).send({ success: false, message: 'Invalid Authorization header.' });
        if (token && token.length === 0) return res.status(401).send({ success: false, message: 'Empty Authorization Bearer token.' });
        this.authUserRepository.isValidToken(token)
            .then((data) => {
                if (data) return res.status(200).send({ success: true, message: 'Valid JWT token.', decoded: data });
                return res.status(401).send({ success: false, message: 'Invalid JWT token.' });
            })
            .catch((err) => res.status(401).send({ success: false, message: err }));
    });

}

const authUserController = new AuthUserController();
export { authUserController }