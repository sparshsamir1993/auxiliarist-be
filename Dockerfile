FROM node:22.14.0 as dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -al
ENV NODE_ENV=development
CMD ls -ltr && npm install && npx sequelize db:create && npx sequelize db:migrate && npm run server