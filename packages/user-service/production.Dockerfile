FROM node:lts
WORKDIR /user-service
# install dependencies
COPY ["package.json", "yarn.lock*", "./"]
RUN yarn install
COPY . .
RUN sh -c 'cd entrypoints/http && yarn install'
RUN sh -c 'cd infrastructure && yarn install'
# generate RSA SHA-512 key pairs for JWT
WORKDIR /user-service/config/jwt
RUN ssh-keygen -t rsa -b 4096 -m PEM -E SHA512 -f pem.key
RUN openssl rsa -in pem.key -pubout -outform PEM -out pub.key
# do some let's encrypt automation to get private key and certificate for HTTPS express instance
# ......
# ......
CMD yarn start
