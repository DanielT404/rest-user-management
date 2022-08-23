import cluster from 'cluster';
import { readFileSync } from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import https from 'https';
import express from 'express';
import rateLimit from 'express-rate-limit'
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';

if (cluster.isPrimary) {
    const numCPUs = 4;
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', () => {
        // eslint-disable-next-line no-undef
        process.exit(1);
    });
} else {
    const app = express();
    app.disable('x-powered-by');
    const limiter = rateLimit({
        windowMs: config.rate_limiter.window_frame_in_minutes * 60 * 1000,
        max: config.rate_limiter.max_requests,
        standardHeaders: config.rate_limiter.standard_headers,
        legacyHeaders: config.rate_limiter.legacy_headers,
    });
    app.use(limiter);
    app.use(cors({
        origin: config.cors.origin,
        methods: config.cors.methods,
        exposedHeaders: config.cors.exposed_headers,
        allowedHeaders: config.cors.allowed_headers
    }))
    app.use(morgan(config.morgan.type));
    app.use(helmet());
    app.use('/api', createProxyMiddleware(
        {
            // eslint-disable-next-line no-undef
            target: process.env.LBUrl,
            changeOrigin: true,
        })
    );
    app.get('*', (req, res) => {
        res.status(404).send({ success: false, message: 'Not found.' })
    })
    const httpsOptions = {
        key: readFileSync(config.https.key_path),
        cert: readFileSync(config.https.cert_path)
    };
    https
        .createServer(httpsOptions, app)
        .listen(3000, () => "API Gateway started on port 3000.");
}