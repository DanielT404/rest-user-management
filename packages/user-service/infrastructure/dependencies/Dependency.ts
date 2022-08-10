import { DIContainer } from "./DIContainer";

export interface IDependencyDTO {
    lib: string,
    origin: CallableFunction
}
export class Dependency {
    public lib;
    public origin;
    constructor(lib: string, origin: CallableFunction) {
        this.lib = lib;
        this.origin = origin;
        const diContainer = DIContainer.getInstance();
        diContainer.addDependency({ lib: lib, origin: origin });
    }
}