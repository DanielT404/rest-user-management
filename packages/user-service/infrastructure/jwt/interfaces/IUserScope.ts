export enum ResourceScope {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE"
}
export enum ActionScope {
    Self = "self",
    All = "all"
}
export interface ResourceActionScope {
    action: ActionScope
    resource: ResourceScope,
    path: string
}
export interface IUserScope {
    scope: Array<ResourceActionScope>
}