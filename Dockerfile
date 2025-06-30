FROM node:alpine
WORKDIR /myapp2

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .
CMD node server