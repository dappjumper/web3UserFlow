const factory = require('./factory');
const db = require('./db');
const isLoggedIn = (user,callback)=> {
	if(user) {
		callback(1)
	} else {
		callback(0)
	}
}

var users = {
	get: {

	},
	post: {
		register: (req, res)=>{
			if(req.headers['public-key']) {
				if(req.headers['public-key'][1] == 'x' && req.headers['public-key'].length == 42) {
					res.send({error: "SUCCESS_BUT_WIP"})
				} else {
					res.send({error: "PUBKEY_INVALID"})
				}
			} else {
				res.send({error: "PUBKEY_HEADER_MISSING"})
			}
		}
	}
}

users.setup = (router,callback)=>{
	console.log('Initializing API endpoints (user)')
	try {
		router.get('/api/user/:endpoint', async (req, res) => {
		  var endpoint = req.params.endpoint;
		  try {
		  	users.get[endpoint](req, res)
		  } catch(e){
		  	res.code(500).header('Content-Type', 'text/plain; charset=utf-8').send({error:"API_ENDPOINT_NOT_FOUND"})
		  }
		})

		router.get('/api/user/:address/nonce', async (req, res) => {
		  try {
		  	res.send({address: req.params.address, nonce: false})
		  } catch(e){
		  	res.send(e)
		  }
		})

		router.post('/api/user/:endpoint', async (req, res) => {
		  try {
		  	users.post[req.params.endpoint](req, res)
		  } catch(e){
		  	res.code(500).header('Content-Type', 'text/plain; charset=utf-8').send({error:"API_ENDPOINT_NOT_FOUND"})
		  }
		})
		console.log("API endpoints (user) now available!")
		callback(1)
	} catch(e){
		callback(0)
	}
}

module.exports = users;