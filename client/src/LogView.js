import React, { Component } from 'react'
import BottomScrollListener from 'react-bottom-scroll-listener';
import './LogView.css'

export default class LogView extends Component {
    constructor(props){
        super(props)
        this.socketHandler = props.socketHandler
        this.closeLogs = props.closeLogs
        this.state = {
            processName: props.processName,
            log: props.log,
            errorLog: props.errorLog,
            showErrorLog: false,
            autoScroll: true,
        }

        this.didFirstScroll = false
    }

    scrollToBottom = () => {
        if (this.state.autoScroll){
            var scrollMethod = 'auto'
            
            if (this.didFirstScroll){
                scrollMethod = 'smooth'    
            }

            setTimeout(() => {
                if (this.bottom)
                    this.bottom.scrollIntoView({ behavior: scrollMethod })    
            }, 0);
        }
    }

    componentDidMount() {
        this.socketHandler.onPm2Log(data =>{
			this.setState({
                processName: data.processName,
                log: data.log,
                errorLog: data.errorLog
			})
        })
        
        this.interval = setInterval(() => {
            if (this.state.processName) {
                this.socketHandler.requestLogs(this.state.processName)
            }
        }, 5000)

        if (this.state.processName)
            this.scrollToBottom();
    }   

    componentDidUpdate(){
        if (this.props.processName !== this.state.processName){
            this.setState({
                processName: this.props.processName, 
                showErrorLog: false
            })
        }

        if (this.state.processName)
            this.scrollToBottom()
    }
    
    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval)
    }

    toggleAutoScroll = () => {
        this.didFirstScroll = true
        this.setState({ autoScroll: !this.state.autoScroll })
    }

    render() {
        if (!this.state.processName) {
            this.didFirstScroll = false
            return (<div id={'logview-div-empty'}></div>)
        }

        var errorLogsOn = () => {
            this.didFirstScroll = false
            this.setState({showErrorLog: true})
        }

        var errorLogsOff = () => {
            this.didFirstScroll = false
            this.setState({showErrorLog: false})
        }

        var logButtonClass = ''
        var errorLogButtonClass = ''
        if (this.state.showErrorLog){
            errorLogButtonClass = 'Selected'
        } else {
            logButtonClass = 'Selected'
        }

        return (<div id={'logview-div'}>
            <div id={'header-div'}>
                <h1>{this.state.processName}</h1>
                <button onClick={this.closeLogs}>X</button>
                <button onClick={errorLogsOn} className={errorLogButtonClass}>Errors</button>
                <button onClick={errorLogsOff} className={logButtonClass}>Log</button>
                <button onClick={this.toggleAutoScroll}>
                    {this.state.autoScroll ? 'Scroll Lock' : 'Autoscroll'}
                </button>
            </div>
            <div>
                {
                    this.state.showErrorLog ? 
                    <pre>{this.state.errorLog}</pre>:
                    <pre>{this.state.log}</pre>
                }
                <div id={'bottom'}
                    ref={(el) => {this.bottom = el}}>
                </div>
                <BottomScrollListener onBottom={() => {this.didFirstScroll = true}} />
            </div>
        </div>)
    }
}