import { addMockUsersToDatabase } from "@infrastructure/database/mocks";
import { Framework } from "./interfaces";
import { startHttp } from "./start";

export async function bootstrap(framework: Framework, port: string, RESTVersion = 1) {
    addMockUsersToDatabase(100, (results) => console.info(results));
    await startHttp(
        framework,
        port,
        RESTVersion,
        (port, workerPid) => console.info(`[INFO] User Service REST API started on port ${port}. \n\t REST API Version: ${RESTVersion} \n\t Worker thread pid: ${workerPid}`
        ));
}