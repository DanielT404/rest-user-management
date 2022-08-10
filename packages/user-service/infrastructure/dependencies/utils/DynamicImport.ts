export const DynamicImport = async (path: string) => {
    const dependency = await import(path);
    return dependency;
}
