const config = {
    cors: {
        origin: '*',
        methods: 'GET, POST, PATCH, DELETE',
        exposed_headers: 'X-Auth-Token',
        allowed_headers: 'Content-Type'
    },
    rate_limiter: {
        window_frame_in_minutes: 25,
        max_requests: 300,
        standard_headers: true,
        legacy_headers: false
    },
    morgan: {
        type: 'dev'
    },
    https: {
        key_path: '/api-gateway/localhost-key.pem',
        cert_path: '/api-gateway/localhost.pem'
    }
};

export { config }