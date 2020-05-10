#!/bin/sh
cd server
npm install
cd ../client
npm install
cd ..
cp server/.env.default server/.env
cp client/.env.default client/.env
echo Configure server/.env and client/.env as needed then run with 'run-dev.sh'
echo When finished testing setup, build the react app and deploy. 
echo Make sure to set .env NODE_ENV=production in the server/.env to quiet logging.
