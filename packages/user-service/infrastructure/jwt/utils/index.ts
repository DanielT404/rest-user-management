const checkAuthorizationHeaders = (req): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!req.cookies.access_token) reject('JWT Token has expired. Please generate a new token.');
        resolve(req.cookies.access_token);
    })
};

export { checkAuthorizationHeaders }
