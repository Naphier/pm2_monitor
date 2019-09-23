import React, { Component } from 'react'
import './DetailView.css'
import { formatBytes, formatCpu, formatRestarts, formatUptimeMs } from './Pm2DataFormatters.js'

export default class DetailView extends Component {
    render(){
        const {close} = this.props
        const appDetails = this.props.data

        if (!appDetails)
            return(<div></div>)

        return (
            <div id='detail-view'>
                <h1>{appDetails.name}</h1>
                <button onClick={close}>X</button>
                <ul>
                    <li><span className='leftSpan'>Version:</span> 
                        <span className='rightSpan'>{
                            appDetails.version}</span>
                    </li>
                    <li><span className='leftSpan'>Status:</span> 
                        <span className='rightSpan'> {
                            appDetails.status}</span>
                    </li>
                    <li><span className='leftSpan'>Restarts:</span> 
                        <span className='rightSpan'>{
                            formatRestarts(appDetails.restart, 2)}</span>
                    </li>
                    <li><span className='leftSpan'>Uptime:</span> 
                        <span className='rightSpan'>{
                            formatUptimeMs(appDetails.uptime_ms, 1)}</span>
                    </li>
                    <li><span className='leftSpan'>CPU:</span> 
                        <span className='rightSpan'>{
                            formatCpu(appDetails.cpu)}</span>
                    </li>
                    <li><span className='leftSpan'>Memory:</span> 
                        <span className='rightSpan'>{
                            formatBytes(appDetails.mem)}</span>
                    </li>
                    <li><span className='leftSpan'>Watching:</span> 
                        <span className='rightSpan'>{
                            appDetails.watching ? 'enabled': 'disabled'}</span>
                    </li>
                </ul>
            </div>
        )
    }
}