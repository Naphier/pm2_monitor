#!/bin/sh
npm install --prefix ./server
npm install --prefix ./client
cp server/.env.default server/.env
cp client/.env.default client/.env
echo Configure server/.env and client/.env as needed then run with 'run-dev.sh'
echo When finished testing setup, build the react app and deploy.