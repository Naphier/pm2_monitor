import React, { Component } from 'react'
import './ModalWindow.css'

export default class ModalWindow extends Component {
    render() {
        const {title, message, buttons} = this.props;
        if (!title && !message){
            return (<div></div>)
        }
        
        var renderButtons = [];
 
        if (buttons){
            for(var b of buttons){
                renderButtons.push( <button 
                                        key={`modal-button-${b.label}`} 
                                        onClick={b.onClick}>{b.label}
                                    </button>)
            }
        }
        if ((title || message) && renderButtons.length === 0){
            var close = () =>{
                this.setState({show: !this.state.show})
            }

            renderButtons.push(<button key='modal-close-button' onClick={close}>Close</button>)
        }
        
        return (
            <div id='modal-blocker'>
                <div id='modal-panel'>
                    {title ? <div id='modal-title' >{title}</div> : null }
                    {message ? <div id='modal-message'>{message}</div> : null }
                    {renderButtons ? <div id='modal-buttons'>{renderButtons}</div> : null}
                </div>
            </div>
        )
    }
}