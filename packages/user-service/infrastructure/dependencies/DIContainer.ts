import { IDependencyDTO } from "./Dependency";
import { IDIContainer } from "./interfaces";

export class DIContainer implements IDIContainer {
    private static instance: DIContainer;
    protected injectedDependencies = new Map();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() { }

    public static getInstance(): DIContainer {
        if (!DIContainer.instance) {
            DIContainer.instance = new DIContainer();
        }
        return DIContainer.instance;
    }

    public getDependencies() {
        return this.injectedDependencies;
    }

    public getDependency(name: string) {
        return this.injectedDependencies.get(name);
    }

    public addDependency(dependency: IDependencyDTO) {
        this.injectedDependencies.set(dependency.lib, dependency.origin);
        return this;
    }

    public removeDependency(name: string) {
        this.injectedDependencies.delete(name);
        return this;
    }

    public existsDependency(name: string) {
        return this.injectedDependencies.has(name);
    }
}