import { IUser, RoleEnum } from "@domain/user/interfaces/IUser";
import { ActionScope, IUserScope, ResourceActionScope, ResourceScope } from "./interfaces/IUserScope";

export class UserScope {
    protected user: IUser;
    protected userScope: IUserScope;
    protected resourceActionScope: ResourceActionScope[] = [];

    constructor(user: IUser) {
        this.user = user;
    }

    public addUserRole(user: IUser, role: RoleEnum) {
        user.roles.push(role);
        return user;
    }

    public setGuestResourceActionScope(user: IUser, resourcePath = 'users') {
        this.addResourceActionScope(user, ResourceScope.GET, ActionScope.Self, resourcePath);
        this.addResourceActionScope(user, ResourceScope.POST, ActionScope.Self, resourcePath);
        this.addResourceActionScope(user, ResourceScope.PATCH, ActionScope.Self, resourcePath);
        this.addResourceActionScope(user, ResourceScope.DELETE, ActionScope.Self, resourcePath);
    }

    public setAdminResourceActionScope(user: IUser, resourcePath = 'users') {
        this.addResourceActionScope(user, ResourceScope.GET, ActionScope.All, resourcePath);
        this.addResourceActionScope(user, ResourceScope.POST, ActionScope.All, resourcePath);
        this.addResourceActionScope(user, ResourceScope.PATCH, ActionScope.All, resourcePath);
        this.addResourceActionScope(user, ResourceScope.DELETE, ActionScope.All, resourcePath);
    }

    public setCustomResourceActionScope(user: IUser) {
        for (const permission of user.permissions) {
            this.addResourceActionScope(user, permission.resource, permission.action, permission.path);
        }
        return user;
    }

    private addResourceActionScope(user: IUser, resource: ResourceScope, action: ActionScope, resourcePath: string) {
        const ResourceActionScope: ResourceActionScope = { action: action, resource: resource, path: resourcePath };
        user.permissions.push(ResourceActionScope);
        return this;
    }

    public getUserWithACL() {
        return this.user;
    }
}