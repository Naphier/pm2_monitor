import React, { Component } from 'react'
import './LoginView.css'

export default class LoginView extends Component {
    constructor(props) {
        super(props)

        this.state = {user: '', pwd: ''}
        this.socketHandler = props.socketHandler
        this.loginMessage = props.loginMessage

        this.handleChangeUser = this.handleChangeUser.bind(this)
        this.handleChangePw = this.handleChangePw.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleChangeUser(event){
        this.setState({user: event.target.value})
    }

    handleChangePw(event){
        this.setState({pwd: event.target.value})
    }

    handleSubmit(event){
        const {user , pwd}  = this.state
        event.preventDefault()

        this.socketHandler.logIn({user: user, pwd: pwd})
    }

    render() {
        return(
            <div id='login-view'>
                { this.props.loginMessage ? <h2>{this.props.loginMessage}</h2> : ''}
                <form id='login-form' onSubmit={this.handleSubmit}>
                    <label>
                        User:<br/> 
                        <input 
                            type='text' 
                            value={this.state.user} 
                            onChange={this.handleChangeUser}
                            autoComplete='username'/>
                    </label><br/>
                    <label>
                        Password:<br/>
                        <input 
                            type='password' 
                            value={this.state.pwd}
                            onChange={this.handleChangePw}
                            autoComplete='current-password'
                            />
                    </label><br/>
                    <input 
                        type="submit" value="Submit"/>
                </form>
            </div>
        )
    }
}