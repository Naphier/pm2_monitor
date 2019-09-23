import React, { Component } from 'react'
import './ReloadMessage.css'

export default class ReloadMessage extends Component {
    render() {
        if (!this.props.data)
            return (<div></div>)

        return(
        <div id='blocker'>
        <div id='reload-message'>
            {this.props.data}
        </div>
        </div>)
    }
}