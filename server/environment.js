var defaultConsoleLog = console.log
var defaultConsoleError = console.error
console.log = (obj, opts) => {
    var d = new Date()
    var timestamp = `[${d.toISOString()}]`
    if (typeof obj === 'string') {
        if (opts)
            defaultConsoleLog(`${timestamp} ${obj}`, opts)
        else
            defaultConsoleLog(`${timestamp} ${obj}`)
    }
    else {
        defaultConsoleLog(timestamp)
        if (opts)
            defaultConsoleLog(obj, opts)
        else
            defaultConsoleLog(obj)
    }
}

console.error = (obj, opts) => {
    var d = new Date()
    var timestamp = `[${d.toISOString()}]`
    if (typeof obj === 'string'){
        if (opts)
            defaultConsoleError(`${timestamp} ${obj}`, opts)
        else
            defaultConsoleError(`${timestamp} ${obj}`)
    }
    else {
        defaultConsoleError(timestamp)

        if (opts)
            defaultConsoleError(obj, opts)
        else
            defaultConsoleError(obj)
    }
}

const fs = require('fs')
const package = JSON.parse(fs.readFileSync('package.json', 'utf8'))
if (!package){
    console.error('Could not find or parse package.json file.')
    process.exit(1)
}
else if (!package.name) {
    console.error(`Your package.json is missing the 'name' property...`)
    process.exit(1)
}
else if (!package.version) {
    console.error(`Your package.json is missing the 'version' property...`)
    process.exit(1)
}

require('dotenv').config()
const port = process.env.PORT
if (!port){
    console.error(`process.env.PORT not found. Please ensure this is defined in '.env' file.\n` +
                  'Or start with PORT=XXXX node server.js.')
    process.exit(1)
}

let node_env = process.env.NODE_ENV
if (!node_env){
    console.log('No NODE_ENV defined in .env. Assuming development environment.')
    node_env = 'development'
}

var log = console.log
if (node_env.toLowerCase() === 'production'){
    console.log = () => {}
    console.log('This message should not appear!')
}

var credentialsRaw = process.env.CREDENTIALS
var credentials = null
const credentialsErrorMsg = 'Please define credentials in .env like so: [{"user": "username1", "pwd": "pw1"}, {"user": "username2", "pwd": "pw2"}, ...]'

if (!credentialsRaw){
    console.error('No credentials found: ' + credentialsErrorMsg)
    process.exit(1)
}
else {
    try{
        credentials = JSON.parse(credentialsRaw)
    }
    catch (err){
        console.error(err)
        console.error('Count not parse credentials: ' + credentialsErrorMsg)
        process.exit(1)
    }

    for (var c of credentials){
        if (!c.user || !c.pwd || c.user.length === 0 || c.pwd.length === 0){
            console.error('Missing user or pwd for for credentials:  ' + credentialsErrorMsg)
            process.exit(1)
        }
    }
}


module.exports = {
    package, port, node_env, log, credentials
}