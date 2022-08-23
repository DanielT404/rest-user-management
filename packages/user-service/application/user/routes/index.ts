import { userController } from "@application/user/controllers";
import { authUserController } from "@application/user/controllers/auth";

interface IRouter {
    get(path: string, cb: CallableFunction): void,
    post(path: string, cb: CallableFunction): void,
    put(path: string, cb: CallableFunction): void,
    delete(path: string, cb: CallableFunction): void
}
const getUserRoutes = (DependencyRouter, apiVersion: number, path = 'users') => {
    const router = DependencyRouter();
    router.get(`/v${apiVersion}/${path}/me`, authUserController.getActionScopes, userController.getCurrentUser);
    router.get(`/v${apiVersion}/${path}`, authUserController.authGetAllUsers, userController.getAllUsers)
    router.get(`/v${apiVersion}/${path}/:id`, authUserController.getActionScopes, userController.getUserById);
    router.post(`/v${apiVersion}/${path}`, authUserController.getActionScopes, userController.createUser);
    router.patch(`/v${apiVersion}/${path}/:id`, authUserController.getActionScopes, userController.updateUserById);
    router.delete(`/v${apiVersion}/${path}/:id`, authUserController.getActionScopes, userController.deleteUserById);
    return router;
}

const getAuthenticationRoutes = (DependencyRouter, apiVersion: number) => {
    const router: IRouter = DependencyRouter();
    router.get(`/v${apiVersion}/refresh/jwt`, authUserController.refreshJwt);
    router.post(`/v${apiVersion}/login`, authUserController.login);
    return router;
}
export { getUserRoutes, getAuthenticationRoutes }