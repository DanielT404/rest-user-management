import { Framework } from "@entrypoints/http/interfaces";
import { IDependencyDTO } from "./Dependency";

export interface IDIContainer {
    getDependency(name: Framework): Map<Framework, CallableFunction>,
    addDependency(dependency: IDependencyDTO): void,
    removeDependency(name: string): void,
    existsDependency(name: string): boolean,
}
