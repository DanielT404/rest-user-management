import { ResourceActionScope } from "@infrastructure/jwt/interfaces/IUserScope";
import { RoleEnum } from "./IUser";

export interface IUserDTO {
    username: string,
    password: string,
    hash?: string,
    salt?: string,
    roles: Array<RoleEnum>,
    permissions: ResourceActionScope[]
}