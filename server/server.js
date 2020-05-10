/*
* pm2 monitor server
*/

// Get config and validate.
const { package, port, node_env, log } = require('./environment')
const reporting_interval = process.env.REPORTING_INTERVAL || 5000
var allowed = process.env.ALLOWED || ''
const allowedOrigins = allowed.split(' ')
const thisPid = process.pid

const fs = require('fs')
const express = require('express')
const socket_io = require('socket.io')
const http = require('http')  //TODO - allow https via .env vars.
const pm2 = require('pm2')
const app = express()

// Limit connections from other servers.
app.use((req, res, next) =>{
    
    var origin = req.headers.origin
    if (allowedOrigins.indexOf(origin) > -1){
        res.setHeader('Access-Control-Allow-Origin', origin)    
    }  
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Methods', 'privatekey');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    
    return next();
})

// Requests to this page are not welcomed
app.get('/*', (req, res) =>{
    res.send('Page not found').status(404)
})

const server = http.createServer(app)

// Restrict access to socket
var socket_allowed_origins = ''
allowedOrigins.forEach(origin => {
    var protocol = ''
    var protocolSplit = origin.split('://')
    if (protocolSplit.length > 1)
        protocol = protocolSplit[0] + '://'
    
    var hostname = origin.replace(protocol, '').split('/')[0]

    if (!hostname.includes(':')){
        var path = origin.replace(protocol + hostname, '')
        origin =  `${protocol}${hostname}:*${path}`
    }
    socket_allowed_origins += origin + ' '
})

const io = socket_io(server, {
    origins: socket_allowed_origins
})


const emitPm2Info = async socket => {
    getPm2List(
        result => {
            var friendlyList = makeProcessListFriendly(result)
                
            var d = new Date()
            var pm2processes = JSON.stringify(friendlyList)
            var payload = {
                time: d.toString(),
                processList: pm2processes
            }
            //console.log(payload)
            socket.emit('pm2_info', payload)
        },
        err => {
            console.error(err)
        }
    )
}

function getPm2List(onSuccess, onError){
    if (!onError) onError = () => {}
    if (!onSuccess) onSuccess = () => {}

    try {
        pm2.list((err, result) =>{
            if (err){
                console.error(err)
                onError(err)
            }
            else {
                onSuccess(result)
            }
        })
        
    }
    catch(err) {
        console.error(err)
        onError(err)
    }
}

function makeProcessListFriendly(processList) {
    if (!processList){
        console.error('makeProcessListFriendly received null or undef processList')
        return
    }

    var friendly = []
    processList.forEach(process => {
        friendly.push({
            name: process.name,
            id: process.pm_id,
            version: (process.pm2_env ? process.pm2_env.version : 'unk'),
            mode: (process.pm2_env ? process.pm2_env.exec_mode.replace(/_mode/, '') : 'unk'),
            pid: process.pid,
            status: (process.pm2_env ? process.pm2_env.status : 'unk'),
            restart: (process.pm2_env ? process.pm2_env.restart_time : 0),
            uptime_ms: (process.pm2_env ? (new Date()).getTime() - process.pm2_env.pm_uptime : 0),
            cpu: (process.monit ? process.monit.cpu : 0),
            mem: (process.monit ? process.monit.memory : 0),
            user: (process.pm2_env ? process.pm2_env.username : 'unk'),
            watching: (process.pm2_env ? process.pm2_env.watch : false)
        })
    });

    return friendly
}

const reloadActionHandler = async (socket, process) => {
    console.log(`Firing reloadActionHandler for process: ${process}`)

    //verify process name and reload
    var response = {
        processName: process,
        didReload: false,
    }

    if (process === 'all'){
        getPm2List(
            (processes) => {
                var isPidInAllApps = false
                for (var p of processes){
                    if (p.pid !== thisPid){
                        isPidInAllApps = true
                        break
                    }
                }

                if (isPidInAllApps){
                    response.didReload = true
                    socket.emit('did_reload', response)
                }
                            
                pm2.reload('all', (err) => {
                    if (err){
                        console.error(err)
                        response.didReload = false
                    } else {
                        console.log('reloaded all')
                        response.didReload = true
                    }
        
                    if (!isPidInAllApps)
                        socket.emit('did_reload', response)
                })
            }, 
            (err) => {
                console.error(err)
                response.error = err
                socket.emit('did_reload', response)
            }
        )
    }
    else {
        getPm2List(
            (processes) => {
                var found = false
                for (var p of processes){
                    if (p.name === process || p.pid === process){
                        found = true
                        break
                    }
                }
                
                if (found){
                    console.log('Reloading: ' + process)
                    pm2.reload(process, (err) => {
                        if (err){
                            console.error(err)
                            response.error = err
                            socket.emit('did_reload', response)
                        }
                        else {
                            console.log('Restarted: ' + process)
                            response.didReload = true
                            socket.emit('did_reload', response)
                        }
                    })
                }
                else {
                    
                    response.error = `Could not reload process '${process}' as it was not found!`
                    console.error(response.error)
                    socket.emit('did_reload', response)
                }

            },
            (err) => {
                console.error(err)
                response.error = err
                socket.emit('did_reload', response)
            }
        )
    }
}

const logRequestHandler = async (socket, processName) => {
    console.log(`Firing logRequestHandler for process: ${processName}`)

    // verify process name
    // load log files into payload
    // emit back to client
    var response = {
        processName: processName,
        errorLog: '',
        log: '',
        error: ''
    }

    getPm2List(
        processes => {
            var process = false
            for (var p of processes){
                console.log('Searching for match found: ' + p)
                if (p.name === processName || p.pid === processName){
                    process = p
                    console.log('Match found!')
                    break
                }
            }

            if (!process){
                response.error = `Could not get logs for process '${processName}' as it was not found!`
                console.error(response.error)
                socket.emit('pm2_log', response)
                return
            }

            var logFilePath = process.pm2_env ? 
                process.pm2_env.pm_out_log_path : 'pm2_env undefined'
            var errorLogFilePath = process.pm2_env ? 
                process.pm2_env.pm_err_log_path : 'pm2_env undefined'
            console.log('checking if log files exist')
            var pass = true
            if (!fs.existsSync(logFilePath)){
                pass = false
                response.error += `Failed to find logFilePath: ${logFilePath} `
            }
    
            if (!fs.existsSync(errorLogFilePath)){
                pass = false
                response.error += `Failed to find errorLogFilePath: ${errorLogFilePath} `
            }
    
            if (!pass){
                response.log = 'No logs found!'
                response.errorLog = response.log
                socket.emit('pm2_log', response)
                response.error = `Failed getting logs for process: '${processName}' ` +
                    response.error
                console.error(response.error)
                return
            }
    
            response.log = fs.readFileSync(logFilePath).toString()
            if (!response.log || response.log.length === 0)
                response.log = 'Nothing logged'
            response.errorLog = fs.readFileSync(errorLogFilePath).toString()
            if (!response.errorLog || response.errorLog.length === 0)
                response.errorLog = 'Wow, no errors. Good for you!'
            socket.emit('pm2_log', response)
        },
        err => {
            response.error = err
            response.log = 'No logs found!'
            response.errorLog = response.log
            socket.emit('pm2_log', response)
            console.error(response.error)
        }
    )
}

const {LoginManager} = require('./LoginManager')
//const loginManager = new LoginManager();

loginHandler = (new LoginManager()).handleLogin;

const stopAppHandler = (socket, process) =>{
    var response = {
        processName: process,
        errorLog: '',
        log: '',
        error: ''
    }
    getPm2List(
        (processes) => {
            var found = false
            for (var p of processes){
                if (p.name === process || p.pid === process){
                    found = true
                    break
                }
            }
            
            if (found){
                console.log('Stopping: ' + process)
                pm2.stop(process, (err) => {
                    if (err){
                        console.error(err)
                        response.error = err
                        socket.emit('did_stop', response)
                    }
                    else {
                        console.log('Sopped: ' + process)
                        response.didReload = true
                        socket.emit('did_stop', response)
                    }
                })
            }
            else {
                
                response.error = `Could not stop process '${process}' as it was not found!`
                console.error(response.error)
                socket.emit('did_stop', response)
            }

        },
        (err) => {
            console.error(err)
            response.error = err
            socket.emit('did_reload', response)
        }
    )
}

let emitPm2Interval;
io.on('connection', socket => {
    const referer = (new URL(socket.handshake.headers.referer)).hostname
    console.log(`Client connected from: ${referer}`)
    //console.log(socket)

    if (emitPm2Interval)
        clearInterval(emitPm2Interval)

    emitPm2Info(socket)
    emitPm2Interval = setInterval(() => { emitPm2Info(socket) }, reporting_interval)
    socket.on('disconnect', () => {
        console.log(`Client ${referer} disconnected`)
    })

    socket.on('reload', data => {
        console.log(`Received reload request. Data: `)
        console.log(data)
        reloadActionHandler(socket, data.processName)
    })

    socket.on('logs', data => {
        console.log(`Received logs request. Data: `)
        console.log(data)

        logRequestHandler(socket, data.processName)
    })

    socket.on('credentials', data => {
        console.log('Received credentials')
        //console.log(data.credentials)
        loginHandler(socket, data.credentials)
    })

    socket.on('stop_app', data => {
        console.log('Recieved stop app request. Data: ')
        console.log(data)
        stopAppHandler(socket, data.processName)
    })
})

server.listen(port, 
    () => {
        var startMsg = 
            `${package.name} v${package.version} (${node_env}) started on port: ${port} ` + 
            `pid: ${process.pid}`

        log('='.repeat(startMsg.length))
        log(startMsg)
        fs.writeFileSync('../server.pid', `${process.pid}\r\n`)
    }
)