import { ResourceActionScope } from "@infrastructure/jwt/interfaces/IUserScope";
import { RoleEnum } from "./IUser";

export interface IUserDTO {
    username: string,
    password: string,
    hash?: string,
    salt?: string,
    roles: Array<RoleEnum>,
    permissions: ResourceActionScope[],
    refresh_token: string,
    blacklisted: boolean,
    created_at: string,
    updated_at?: string
}