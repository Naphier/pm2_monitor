import socketIOClient from 'socket.io-client'

export default class SocketHandler {
    constructor(endpoint, onReloadClicked){
        this.socket = socketIOClient(endpoint)
        this.onReloadClicked = onReloadClicked
    }

    requestReload(processName){
        this.socket.emit('reload', {processName: processName})
    }

    requestStop(processName){
        this.socket.emit('stop_app', {processName: processName})
    }

    // deprecated
    /*
    requestGracefulReload(processName){
        this.socket.emit('gracefulreload', {processName: processName})
    }
    */

    requestLogs(processName) {
        this.socket.emit('logs', {processName: processName})
    }

    onPm2ReloadResponse(reloadResponseCallback){
        this.socket.on('did_reload', data => reloadResponseCallback(data))
    }

    onPm2Info(pm2InfoCallback) {
        this.socket.on('pm2_info', data => {

            data.processList = pm2ProcessListTranslator(data.processList, this.onReloadClicked, this)
            pm2InfoCallback(data)
        })   
    }

    onPm2Log(pm2LogCallback) {
        this.socket.on('pm2_log', data => pm2LogCallback(data))
    }

    onLoginResult(result){
        this.socket.on('login', data => result(data))
    }

    logIn(credentials){
        this.socket.emit('credentials', {credentials: credentials})
    }
}

function pm2ProcessListTranslator(processList, onReloadClicked, sockeHandler){
    if (typeof processList === 'string')
        processList = JSON.parse(processList)

    processList.forEach(process => {
        // add buttons and actions here
        process.button1 = {
            name: 'restart',
            action: () =>{
                onReloadClicked(process.name)
            }
        }

        process.button2 = {
            name:'logs',
            action: () =>{
                sockeHandler.requestLogs(process.name)
            }
        }

        delete process.id
        delete process.mode
        delete process.pid
        delete process.user
    });

    return processList
}
