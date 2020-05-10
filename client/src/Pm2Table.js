import React, { Component } from 'react'
import './Pm2Table.css'
import slashedEye from './eye-slashed-red.svg'
import eyeWhite from './eye-white.svg'
import eyeGreen from './eye-green.svg'
import powerWhite from './power-button-white.svg'
import powerRed from './power-button-red.svg'
import powerGreen from './power-button-green.svg'
import clock from './clock-white.svg'
import processor from './processor-white.svg'
import ram from './ram-white.svg'
import refresh from './refresh-white.svg'
import logWhite from './log-white.svg'
import { formatBytes, formatCpu, formatRestarts, formatUptimeMs } from './Pm2DataFormatters.js'

export default class Pm2Table extends Component {
    constructor(props) {
        super(props)

        this.updateDimensions = this.updateDimensions.bind(this)

        this.getHeader = this.getHeader.bind(this)
        this.getRowsData = this.getRowsData.bind(this)
        this.getKeys = this.getKeys.bind(this)
        this.hideableColIds = []
        this.nonHideableKeys = [
            'name', 'status', 'uptime', 'button1', 'button2'
        ]
        this.allColIds = []
    }

    componentDidMount(){
        this.updateDimensions()
        window.addEventListener('resize', this.updateDimensions)
    }

    componentWillUnmount(){
        window.removeEventListener('resize', this.updateDimensions)
    }

    getAnyOOB() {
        for (let i = this.allColIds.length -1; i >= 0; i--){
            let id = '#' + this.allColIds[i]
            let el = document.querySelectorAll(id)
        
            for(var elem of el){

                if (elem.tagName === 'TH'){
                    var bounding = elem.getBoundingClientRect()
                    if (bounding.right > 
                        (window.innerWidth || document.documentElement.clientWidth))
                    {
                        return true
                    }
                }
            }
        }

        return false
    }

    updateDimensions() {
        
       for(let i = this.hideableColIds.length - 1; i >= 0; i--){
            let id = '#' + this.hideableColIds[i]
            
            let el = document.querySelectorAll(id)
            if (el && el.length > 0){
                el.forEach(elem => {
                    elem.style.display = ''
                })
            }
        }

        // iterate through all ids and see if any out of bounds
        // if so then hide and repeat for total # of ALL IDs
        // if still oob occurs then display alt layout

        let i = this.hideableColIds.length - 1;
        this.allColIds.forEach(() => {
            
            if (this.getAnyOOB()){
                let id = '#' + this.hideableColIds[i]
                let el = document.querySelectorAll(id)
                el.forEach(elem => {
                    elem.style.display = 'none'
                })
                i--
                if (i < 0)
                    i = this.hideableColIds.length - 1
            }
            
        })

        if (this.getAnyOOB()){
            console.log('Still someone oob, need alt layout')
        }
    }

    getKeys = function() {
        if (!this.props || !this.props.data || !this.props.data[0]){
            return [];
        }

        return Object.keys(this.props.data[0])
    }

    getHeader = function() {
        var keys = this.getKeys()
        return keys.map(key => {
            var header = key
            if (key.includes('button')){
                header = ''
            }
            else if (key === 'restart'){
                header = <img src={refresh} title='Restarts' alt='restarts'/>
            }
            else if (key === 'uptime_ms'){
                header = <img src={clock} title='Uptime' alt='uptime'/>
            }
            else if (key === 'cpu') {
                header = <img src={processor} title='CPU' alt='cpu'/>
            } 
            else if (key === 'watching'){
                header = <img src={eyeWhite} title='Watching' alt='watching'/>
            }
            else if (key === 'status'){
                header = <img src={powerWhite} title='Status' alt='status'/>
            } 
            else if (key === 'mem'){
                header = <img src={ram} title='Memory' alt='memory'/>
            }

            if (!this.hideableColIds.includes(key+'-col') && 
                !this.nonHideableKeys.includes(key)) 
            {
                
                this.hideableColIds.push(key+'-col')
            }

            if (!this.allColIds.includes(key+'-col'))
                this.allColIds.push(key+'-col')

            return <th key={ key } id={key + '-col'}>{ header }</th>
        })
    }

    getRowsData = function() {
        var items = this.props.data        
        var keys = this.getKeys()
        return items.map((row, index) => { 
            return  <tr key={ index }>
                        <RenderRow 
                            key={index} 
                            data={row} 
                            keys={keys} 
                            showDetailsFunction={this.props.showDetailsFunction}
                            onReloadClicked={this.props.onReloadClicked}
                            onStopStartClicked={this.props.onStopStartClicked}/>
                    </tr>
        })
    }

    render() {
        var rowData = this.getRowsData();
        if (!rowData || rowData.length === 0){
            return (
                <div>
                <div id={'pm2table-div'}>
                    No PM2 processes found. 
                    Please ensure PM2 is running and managing at least one process.
                </div>
                <div id = 'reload-all'>
                    <button onClick={() => {window.location.reload()}}>
                        REFRESH
                    </button>
                </div>
                </div>
            );
        }

        return (
            <div>
                <div id={'pm2table-div'}>
                    <table>
                        <thead>
                            <tr>{ this.getHeader() }</tr>
                        </thead>
                        <tbody>
                            { rowData }
                        </tbody>
                    </table>
                </div>
                <div id='reload-all'>
                    <button onClick={() => {this.props.onReloadAllClicked()}}>RELOAD ALL</button>
                </div>
            </div>
        )
    }
}

const RenderRow = (props) => {
    return props.keys.map(key => {
        var data = props.data[key]

        var processName = props.data['name']
        var tdKey = processName + key
        
        var tdId = key + '-col'

        if (key === 'name'){
            return <td key={ tdKey } id={tdId} onClick={
                        () => {props.showDetailsFunction(processName)}
                    } style={{cursor: 'pointer'}} title='click to see details'>
                        { data }
                    </td>
        }
        else if (key === 'status'){
            var titleTxt = data + ' click to '
            var img = <img src={powerRed} title={titleTxt + 'reload ' + processName} alt='status'></img>
            if (data === 'online')
                img = <img src={powerGreen} title={titleTxt + 'stop ' + processName} alt='status'></img>

            return  <td key={ tdKey } id={tdId} onClick={
                            () => {props.onStopStartClicked(processName)}}>
                        {img}
                    </td>
        }
        else if (key === 'restart'){
            return  <td key={ tdKey } id={tdId}>
                        { formatRestarts(data, 2) }
                    </td>
        }
        else if (key === 'uptime_ms'){
            return  <td key={ tdKey } id={tdId}>
                        { formatUptimeMs(data, 1) }
                    </td>
        }
        else if (key === 'cpu'){
            return  <td key={ tdKey } id={tdId}>
                        { formatCpu(data) }
                    </td>
        }
        else if (key === 'mem'){
            return  <td key={ tdKey } id={tdId}>
                        { formatBytes(data) }
                    </td>
        }
        else if (key === 'watching'){
            var inner = null
            if (props.data[key]){
                inner = <img src={eyeGreen} title={'watching enabled' + processName} alt='watching'/>
            }
            else {
                inner = <img src={slashedEye} title={'watching disabled on ' + processName} alt='watching'/>
            }
            return  <td key={ tdKey } id={tdId}>
                        { inner }
                    </td>
        }
        else if (key.includes('button')){
            var buttonLabel = data.name
            var onClick = data.action

            if (buttonLabel === 'restart'){
                onClick = () =>{
                    if (props.onReloadClicked)
                        props.onReloadClicked(processName)
                    data.action()
                }
                buttonLabel = <img src={refresh} title={'reload ' + processName} alt='reload'/>
            } else if (buttonLabel === 'logs'){
                buttonLabel = <img src={logWhite} title={processName + ' logs'} alt='logs'/>
            }

            return  <td key={ tdKey } id={tdId}>
                        <button onClick={onClick}>
                            { buttonLabel }
                        </button>
                    </td>
        } 
        else {
            return <td key={ tdKey } id={tdId}>{ data }</td>
        }
    })
}

