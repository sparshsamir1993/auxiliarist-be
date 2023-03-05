# NodeJS Boiler plate

This repository is a boiler plate for nodejs projects

## Features

1. Docker build
2. Sequelize included
3. Passport included
4. Handled Cors
5. Redis installed
6. User authentication handled
7. User login, signup and admin role update handled
8. Migration file to add User
9. JWT authentication

## Instructions to run the project

1. ### When building the first time

    docker-compose build

2. ### Start the service

    docker-compose up

    Few things to take care of -
    1. Turn on MySQL server of the system. In mac check in system preferences, else it'll give a connection refused error.

3. ### Stop the service

    docker-compose down

## Changes required when using this for future applications (check for comments)

1. docker-compose.yml
2. config/config.js
