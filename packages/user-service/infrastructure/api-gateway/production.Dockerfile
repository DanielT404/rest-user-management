FROM node:lts
WORKDIR /api-gateway
# install dependencies
COPY ["package.json", "yarn.lock*", "./"]
RUN yarn install
COPY . .
# add some letsencrypt automation to generate HTTPS certs
# ......
CMD yarn start
