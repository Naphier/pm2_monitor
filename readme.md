# PM2 Monitor
Simple web interface for monitoring [PM2](http://pm2.keymetrics.io/), a node.js process manager.

Backend is a simple Express server utilizing the [PM2's API](http://pm2.keymetrics.io/docs/usage/pm2-api/) and should likely be managed by PM2.

Frontend is React and could be anything, but I wanted to learn some React stuff :wink:.

## Features
- Shows basic stats for all running apps (name, version, status, restarts, uptime, memory load, cpu load) ![main](repo_images/pm2_monit_main.jpg)
- Displays logs and error logs
![logs](repo_images/pm2_monit_logs.jpg)
- Start / stop any process
![reload](repo_images/pm2_monit_reload.jpg)
- Reload any process or all at once
- Basic login example included


## Installation
Clone this repo then run `install.sh` from bash.

Edit `server/.env` and `client/.env` as needed for your environment.

Run with `run-dev.sh`. Ctrl+C should kill both the react app and the server, but if the server doesn't die then its pid should be in `server.pid`.

Or run the server by cd into server/ then `npm start` (or `pm2 start server.js --name="PM2_Monitor" --watch` :smiley_cat:).

And run the react app by cd into client/ then `npx react-scripts start`.

## Notes
Only tested on CentOS 7.

`.env` files need to have certain parameters. Make sure to check `.env.default` in both server/ and client/ directories. 
It's important the the client's `ENDPOINT` parameter points to the server app!

## Contributing
Please do! Currently looking to improve the log reporting process so that the entire log isn't sent every cycle. Would also be nice to implement some generics for metrics for the app's DetailView.
