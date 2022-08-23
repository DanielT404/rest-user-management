import { IUserError } from "@infrastructure/errors/IUserError";
import { IUserQuery } from "./interfaces/IUserQuery";

export interface IValidateUser {
    error: {
        field: string,
        message: string
    }
}

const validateUser = async (user: IUserQuery): Promise<IUserError> => {
    const error: IUserError = { field: '', message: '' };
    if (user.password.length < 8) {
        error.field = 'password';
        error.message = `Password field is less than 8 characters.`;
        return error;
    } else if (!Array.isArray(user.roles)) {
        error.field = 'roles';
        error.message = `Roles field must be of type Array<string>. Received ${typeof user.roles} instead.`;
        return error;
    } else if (!Array.isArray(user.permissions)) {
        error.field = 'permissions';
        error.message = `Permissions field must be of type ResourceActionScope[]. Received ${typeof user.permissions} instead.`;
        return error;
    }
    return error;
}
export { validateUser }