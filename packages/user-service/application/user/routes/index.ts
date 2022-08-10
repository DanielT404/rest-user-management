import { config } from "@config/index";
import { userController } from "@application/user/controllers";
import { authUserController } from "@application/user/controllers/auth";
import { Dependency } from "@infrastructure/dependencies/Dependency";

interface IRouter {
    get(path: string, cb: CallableFunction): void,
    post(path: string, cb: CallableFunction): void,
    put(path: string, cb: CallableFunction): void,
    delete(path: string, cb: CallableFunction): void
}

const getUserRoutes = (DependencyRouter, apiVersion: number, path = 'users') => {
    new Dependency("config.docker.http.xauth", () => config.docker.http.xauth);
    const router = DependencyRouter();
    router.get(`/v${apiVersion}/${path}/`, authUserController.authGetAllUsers, userController.getAllUsers)
    router.get(`/v${apiVersion}/${path}/:id`, authUserController.getActionScopes, userController.getUserById);
    router.post(`/v${apiVersion}/${path}/`, authUserController.getActionScopes, userController.createUser);
    router.put(`/v${apiVersion}/${path}/`, authUserController.getActionScopes, userController.updateUserById);
    router.delete(`/v${apiVersion}/${path}/`, authUserController.getActionScopes, userController.deleteUserById);
    return router;
}

const getAuthenticationRoutes = (DependencyRouter, apiVersion: number, path = 'users') => {
    const router: IRouter = DependencyRouter();
    router.post(`/v${apiVersion}/${path}/login`, authUserController.login);
    router.post(`/v${apiVersion}/${path}/jwt`, authUserController.jwtToken);
    return router;
}
export { getUserRoutes, getAuthenticationRoutes }