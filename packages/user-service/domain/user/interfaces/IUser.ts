import { ResourceActionScope } from "@infrastructure/jwt/interfaces/IUserScope";

export enum RoleEnum {
    Admin = "admin",
    Guest = "guest"
}
export interface IUser {
    username: string,
    hash: string,
    salt: string,
    roles: Array<RoleEnum>,
    permissions: ResourceActionScope[]
}