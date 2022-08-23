import cluster from 'cluster';
import process from 'process';
import { getAuthenticationRoutes, getUserRoutes } from '@application/user/routes';
import { DynamicImport } from '@infrastructure/dependencies/utils/DynamicImport';
import { Dependency } from '@infrastructure/dependencies/Dependency';
import { Framework } from './interfaces';

async function startHttp(framework: Framework, port, RESTVersion: number, callback?: CallableFunction) {
    if (cluster.isPrimary) {
        const numCPUs = 2;
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }
        cluster.on('exit', () => {
            process.exit(1);
        });
    } else {
        const express = await DynamicImport(framework);
        new Dependency(framework, express);
        const app = express.default();
        const bodyParser = await DynamicImport('body-parser');
        const cookieParser = await DynamicImport('cookie-parser');
        app.disable('x-powered-by');
        app.use(bodyParser.json());
        app.use(cookieParser.default());
        app.use('/api', getUserRoutes(express.Router, RESTVersion));
        app.use('/api', getAuthenticationRoutes(express.Router, RESTVersion));
        app.get('*', (req, res) => {
            res.status(404).send({ success: false, message: 'Not found.' })
        })
        app.listen(port, callback(port, process.pid));
    }
}

export { startHttp }