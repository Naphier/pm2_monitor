import React, { Component } from 'react'
import { CSSTransition } from 'react-transition-group';

import './App.css'
import Pm2Table from './Pm2Table'
import LogView from './LogView'
import DetailView from './DetailView'
import LoginView from './LoginView'
import ReloadMessage from './ReloadMessage'
import ModalWindow from './ModalWindow'

import SocketHandler from './SocketHandler'

class App extends Component {
	constructor() {
		super()
		
		// Log in is turned off during development, but you should
		// turn it on manually to do your testing if needed.
		this.autoLogin = process.env.NODE_ENV === 'development'
		this.autoLogin = false
		
		// Log out after 30 minutes of inactivity.
		this.maxInactivity = 1000 * 60 * 30

		this.state = {	
			loggedin: this.autoLogin,
			loginMessage: '',
			pm2InfoResponse: false,
			endpoint: process.env.REACT_APP_ENDPOINT_URL, 
			logViewState: {show: false, content: false},
			appDetailsState: { show: false, content: false},
			reloadMessageState: { show: false, reloadState: 0, message: false },
			modalWindowState: { show: false, title: false, message: false, 
				buttons: [ {label: false, onClick: () => {} } ]
			},
		}

		
		this.updateModalWindowState = this.updateModalWindowState.bind(this)
		this.clearModalWindowState = this.clearModalWindowState.bind(this)
		this.reloadMessageHandler = this.reloadMessageHandler.bind(this)
		this.clearReloadMessageState = this.clearReloadMessageState.bind(this)
		this.reloadResponHandler = this.reloadResponHandler.bind(this)
		this.updateReloadMessageState = this.updateReloadMessageState.bind(this)
		this.reloadWaitTimeOut = null
		this.onReloadClicked = this.onReloadClicked.bind(this)
		this.onReloadAllClicked = this.onReloadAllClicked.bind(this)

		this.socketHandler = new SocketHandler(this.state.endpoint, this.onReloadClicked)
		
		this.updateLogViewState = this.updateLogViewState.bind(this)

		this.showDetails = this.showDetails.bind(this)
		this.updateAppDetailsState = this.updateAppDetailsState.bind(this)
		this.updateAppDetails = this.updateAppDetails.bind(this)
		this.clearAppDetailsState = this.clearAppDetailsState.bind(this)	

		this.updateLastClickTimer = this.updateLastClickTimer.bind(this)
		this.updateLastClickTimer()		

		this.onStopStartClicked = this.onStopStartClicked.bind(this)
	}	

	updateLastClickTimer(e){
		if (!this.lastClickTime){
			setInterval(() => {
				if (!this.state.loggedin || this.autoLogin)
					return
	
				var now = Date.now()
				var inactiveTime = now - this.lastClickTime;
				if (inactiveTime > this.maxInactivity) { 
					this.setState({
						loggedin: false,
						loginMessage: `You've been logged out due to inactivity`
					})
				}
			}, 1000)
		}
		this.lastClickTime = Date.now()
	}

	componentDidMount() {	
		document.addEventListener('click', this.updateLastClickTimer); 

		this.socketHandler.onPm2Info(data => {
			this.setState({
				pm2InfoResponse: {
					processList: data.processList,
					time: data.time	}
				}
			)

			if (this.state.appDetailsState.show){
				this.updateAppDetails(this.state.appDetailsState.content.name)
			}
		})

		this.socketHandler.onPm2ReloadResponse(this.reloadResponHandler)

		this.socketHandler.onPm2Log(data =>{
			if (this.state.logViewState.content)
				return
			this.updateLogViewState({show: true, content: data})
		})

		this.socketHandler.onLoginResult(result => {
			var loggedin = false
			var message = ''
			if (result.userOk && result.pwOk){
				loggedin = true
			} else {
				if (!result.userOk){
					message = 'That user is not registered'
				}
				else if (!result.pwOk){
					message = 'Incorrect password'
				}
				else {
					message = 'unhandled error!'
				}
			}

			this.setState({
				loggedin: loggedin,
				loginMessage: message
			})
		})
	}

	updateLogViewState = function(states){
		var current = this.state.logViewState
		if (typeof states.show !== 'undefined')
			current.show = states.show
		if (typeof states.content !== 'undefined')
			current.content = states.content

		this.setState({logViewState: current})
	}

	updateAppDetailsState = function(states){
		var current = this.state.appDetailsState
		if (typeof states.show !== 'undefined'){
			current.show = states.show
		}
		if (typeof states.content !== 'undefined'){
			current.content = states.content
		}

		this.setState({appDetailsState: current})
	}

	clearAppDetailsState = function() {
		this.setState({appDetailsState: {show: false, content: false}})
	}

	updateAppDetails = function (appName) {
		const {pm2InfoResponse} = this.state
		if (!pm2InfoResponse || !pm2InfoResponse.processList){
			console.error('Response or processList not ready')
			return
		}

		var details = null

		for (var process of pm2InfoResponse.processList){
			if (process.name === appName){
				details = process
				break
			}
		}

		this.updateAppDetailsState({content: details})

		return details;
	}

	showDetails = function(appName){
		this.updateAppDetailsState({show: true})
		
		var details = this.updateAppDetails(appName)

		if (!details) {
			console.error(`Could not find app details for '${appName}'`)
			return
		}
	}

	onStopStartClicked = function(appName){
		if (!this.state.pm2InfoResponse)
			return
		
		var found = false
		var isRunning = false
		for (var pm2process of this.state.pm2InfoResponse.processList){
			if (pm2process.name === appName){
				found = true
				isRunning = pm2process.status === 'online'
			}
		}

		if (!found){
			console.error(`Could not find process ${appName} to stop/start`)
			return
		}


		if (isRunning){
			//request stop
			console.log(`${appName} is already running, not implemented yet`)
			var close = () => {
				this.updateModalWindowState({show: false})
			}
			this.updateModalWindowState({
				show: true,
				title: 'Stop ' + appName,
				message: `Would you like to stop ${appName}?`,
				buttons: [
					{label: 'OK', onClick: () => {
						close()
						this.socketHandler.requestStop(appName)
						
					}},
					{label: 'Cancel', onClick: close}
				]
			})
		}
		else {
			this.onReloadClicked(appName)
		}
	}

	onReloadAllClicked = function(){
		var close = () => {
			this.updateModalWindowState({show: false})
		}
		this.updateModalWindowState({
			show: true,
			title: 'Reload all',
			message: `Would you like to reload all apps?`,
			buttons: [
				{label: 'OK', onClick: () => {
					close()
					this.socketHandler.requestReload('all')
					this.reloadMessageHandler('all')
				}},
				// deprecated
				/*
				{label: 'Graceful Reload', onClick: () => {
					close()
					this.socketHandler.requestGracefulReload(appName)
					this.reloadMessageHandler(appName)
				}},*/
				{label: 'Cancel', onClick: close}
			]
		})
	}

	onReloadClicked = function(appName){
		var close = () => {
			this.updateModalWindowState({show: false})
		}
		this.updateModalWindowState({
			show: true,
			title: 'Reload',
			message: `Would you like to reload '${appName}'?`,
			buttons: [
				{label: 'OK', onClick: () => {
					close()
					this.socketHandler.requestReload(appName)
					this.reloadMessageHandler(appName)
				}},
				// deprecated
				/*
				{label: 'Graceful Reload', onClick: () => {
					close()
					this.socketHandler.requestGracefulReload(appName)
					this.reloadMessageHandler(appName)
				}},*/
				{label: 'Cancel', onClick: close}
			]
		})
	}

	updateModalWindowState = function(states){
		var current = this.state.modalWindowState
		if (typeof states.show !== 'undefined')
			current.show = states.show
		if (typeof states.title !== 'undefined')
			current.title = states.title
		if (typeof states.message !== 'undefined')
			current.message = states.message
		if (typeof states.buttons !== 'undefined')
			current.buttons = states.buttons

		this.setState({modalWindowState: current})
	}

	clearModalWindowState = function(){
		this.setState({
			modalWindowState: {	show: false, title: false, message: false, buttons: false }	})
	}

	updateReloadMessageState = function(states){
		var current = this.state.reloadMessageState
		if (typeof states.show !== 'undefined')
			current.show = states.show
		if (typeof states.reloadState !== 'undefined')
			current.reloadState = states.reloadState
		if (typeof states.message !== 'undefined')
			current.message = states.message
		
		this.setState({reloadMessageState: current})
	}

	reloadResponHandler = function(data){
		var waited = Date.now() - this.reloadTimeStart
			var initialWait = 2000 - waited

		if (initialWait < 0)
			initialWait = 0

		setTimeout(() => {
			if (this.reloadWaitTimeOut)
				clearTimeout(this.reloadWaitTimeOut)
			
			var message = 'Uh oh?'
			if (data){
				if (data.didReload)
					message = `Reloaded: ${data.processName}`
				else
					message = `Failed to reload: ${data.processName} (no response)`
			}
			
			this.updateReloadMessageState({message: message})
			
			setTimeout(() => {
				this.updateReloadMessageState({show: false})
				
			}, 2000)
		}, initialWait)
	}

	reloadMessageHandler = function(appName){
		this.updateReloadMessageState(
			{show: true, reloadState: 1, message: `Reloading '${appName}'...`})

		if (this.reloadWaitTimeOut)
			clearTimeout(this.reloadWaitTimeOut)

		this.reloadTimeStart = Date.now()
		this.reloadWaitTimeOut = setTimeout(() => {
			const state = this.state.reloadMessageState.reloadState;
			if (state === 0 || state === 1){
				this.updateReloadMessageState(
					{reloadState: 2, message: `Failed to reload ${appName} (timeout)`})
				
				setTimeout(() => {
					this.updateReloadMessageState({show: false})
				}, 2000)
			}
		}, 10000)
	}

	clearReloadMessageState = function(){
		this.setState({	reloadMessageState: { show: false, reloadState: 0, message: false } })
	}

	render() {
		if (!this.state.loggedin){
			return (<LoginView 
						socketHandler={this.socketHandler}
						loginMessage={this.state.loginMessage}
					/>)
		}

		const { appDetailsState, pm2InfoResponse, reloadMessageState,
				logViewState, modalWindowState } = this.state

		var tableData = (pm2InfoResponse ? pm2InfoResponse.processList : undefined)

		var logcontentsSafe = logViewState.content
		if (!logViewState.content) {
			logcontentsSafe = {
				processName: false,
				log: false,
				errorLog: false
			}
		}

		return (
			<div>
				{tableData ? 
					<Pm2Table 
						data={tableData} 
						showDetailsFunction={this.showDetails} 
						onReloadClicked={this.onReloadClicked}
						onReloadAllClicked={this.onReloadAllClicked}
						onStopStartClicked={this.onStopStartClicked}/> 
					: <h2 id='loading'>Loading... </h2>}
				
				<CSSTransition
					in={logViewState.show}
					timeout={100}
					classNames="fade"
					onExited={() => {
						setTimeout(() => {
							this.updateLogViewState({show: false, content: false})
					}, 110)}}
				>
					<LogView 
						socketHandler={this.socketHandler} 
						processName={logcontentsSafe.processName}
						log={logcontentsSafe.log}
						errorLog={logcontentsSafe.errorLog}
						closeLogs={() => {this.updateLogViewState({show: false})}}
					/>
				</CSSTransition>
				
				<CSSTransition
					in={appDetailsState.show}
					timeout={100}
					classNames="fade"
					onExited={() => {
						setTimeout(() => {this.clearAppDetailsState()}, 110)}}
				>
					
					<DetailView
						data={appDetailsState.content}
						close={() => {this.updateAppDetailsState({show: false})}} />
				</CSSTransition>
				
				<CSSTransition
					in={reloadMessageState.show}
					timeout={100}
					classNames="fade"
					onExited={() => { setTimeout(this.clearReloadMessageState, 110) }}
				>
					<ReloadMessage data={
						(reloadMessageState.show ? reloadMessageState.message : null)} />
				</CSSTransition>

				<CSSTransition
					in={modalWindowState.show}
					timeout={100}
					classNames='fade'
					onExited={() => {
						setTimeout(() => {this.clearModalWindowState()}, 110) }}
				>
					<ModalWindow 
						title={modalWindowState.title} 
						message={modalWindowState.message}
						buttons={modalWindowState.buttons}/>
				</CSSTransition>
				<footer>
					<p>Last report: { pm2InfoResponse ? pm2InfoResponse.time : 'Not connected'}</p>
					<div id='icon-credit'>
						Icons made by
						<a href="https://www.flaticon.com/authors/freepik" title="Freepik"> Freepik </a> 
						from 
						<a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
					</div>
				</footer>
			</div>
		)
	}
}

export default App
