import { config } from "@config/index";
import { Framework } from "./interfaces";
import { startHttp } from "./start";

export async function bootstrap(framework: Framework, RESTVersion = 1) {
    const httpPort = config.docker.http.port;
    const xauth = config.docker.http.xauth;
    await startHttp(
        framework,
        httpPort,
        xauth,
        RESTVersion,
        () => console.info(`[INFO] HTTP server started on port ${httpPort}. REST API Version: ${RESTVersion}`)
    );
}