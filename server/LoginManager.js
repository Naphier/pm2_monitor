const { credentials } = require('./environment')

class LoginManager {
	handleLogin (socket, credsIn) {
		try {
			var pwOk = false
			var userOk = false
			if (credsIn){
				for (var c of credentials){
					if (c.user === credsIn.user){
						userOk = true
						if (c.pwd === credsIn.pwd){
							pwOk = true
						}
						break
					}
				}
			}
			else {
				console.error('Null credentials passed')
			}
	
			if (!userOk || !pwOk)
				console.error(`Failed login attempt by user: '${credsIn.user}'`)
	
			socket.emit('login', {userOk: userOk, pwOk: pwOk})
		}
		catch (err){
			console.error(err)
		}
	}
}

module.exports.LoginManager = LoginManager;
