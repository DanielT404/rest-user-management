import { ResourceActionScope } from "@infrastructure/jwt/interfaces/IUserScope";

export interface IUserQuery {
    _id?,
    username?: string,
    password?: string,
    hash?: string,
    salt?: string,
    roles?: Array<string>,
    permissions?: ResourceActionScope[]
}