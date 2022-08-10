import { DynamicImport } from '@infrastructure/dependencies/utils/DynamicImport';
import { Dependency } from '@infrastructure/dependencies/Dependency';
import { getAuthenticationRoutes, getUserRoutes } from '@application/user/routes';
import { Framework } from './interfaces';

async function startHttp(framework: Framework, port: number, xAuthKey: string, RESTVersion: number, callback?: CallableFunction) {
    const express = await DynamicImport(framework);
    new Dependency(framework, express);
    new Dependency("config.docker.http.xauth", () => xAuthKey);
    const app = express.default();
    const bodyParser = await DynamicImport('body-parser');
    app.use(bodyParser.json());
    app.use('/api', getUserRoutes(express.Router, RESTVersion));
    app.use('/api', getAuthenticationRoutes(express.Router, RESTVersion));
    app.listen(port, callback);
}
export { startHttp }