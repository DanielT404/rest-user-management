const checkAuthorizationHeaders = (req) => {
    return new Promise((resolve) => {
        if (!req.header("Authorization")) resolve('Authorization header missing.');
        const [bearer, token] = req.header("Authorization").split(" ");
        if (!bearer) resolve('Invalid Authorization header.');
        if (token && token.length === 0) resolve('Empty Authorization Bearer token.');
        resolve([bearer, token]);
    })
};

export { checkAuthorizationHeaders }
