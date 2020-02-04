const registrationString = "I wish to register an account on dappjump.io"
const loginString = "Login with nonce: "

const getNonce = (req, res)=>{
	d97.db.collection('users').findOne({address: req.headers['public-key']},(err, user)=>{
		if(!err && user) {
			res.send({address:user.address,nonce:user.nonce, signatureRequest: loginString+user.nonce})
		} else {
			//Send registration string in case user wants to create a new account
			res.send({error:"USER_NOT_FOUND",signatureRequest: registrationString})
		}
	})
}

const register = (req, res)=>{
	if(req.body['signature'] && req.headers['public-key']) {
		d97.auth.decodeSignature(req.body['signature'], registrationString, (result)=>{
			if(!result.error) {
				if(result.address == req.headers['public-key']) {
					d97.db.collection('users').findOne({address: req.headers['public-key']},(err, user)=>{
						if(!err && user) {
							res.send({error:"USER_ALREADY_EXISTS"})
						} else {
							var servernonce = new Date().getTime();
							d97.db.collection('users').insertOne({
								address: req.headers['public-key'],
								nonce: servernonce
							},(err, newUser)=>{
								if(!err) {
									res.send({signatureRequest: loginString+servernonce})
								} else {
									res.send({error:"USER_CREATION_FAILED"})
								}
							})
						}
					})
				} else {
					res.send({error:"SIGNATURE_INVALID"})
				}
			} else {

			}
		})
	} else {
		res.send({error:"PARAMETERS_MISSING"})
	}
}

const authorized = {
	information: (req, res)=>{
		res.send(req.user);
	}
}

const login = (req, res)=>{
	if(req.body['signature'] && req.headers['public-key']) {
		d97.db.collection('users').findOne({address: req.headers['public-key']},(err, user)=>{
			if(!err && user) {
				d97.auth.decodeSignature(req.body['signature'],loginString+user.nonce,(result)=>{
					if(!result.error && result.address == req.headers['public-key']) {
						d97.db.collection('users').updateOne({address: result.address},{$set:{nonce:parseInt(user.nonce)+1}},(err, loggedUser)=>{
							var newNonce = parseInt(user.nonce)+1;
							d97.auth.toToken(''+user.address+newNonce,(result)=>{
								if(!result.error) {
									res.send({token:result})
								} else {
									res.send({error:"FAILED"})
								}
							})
						})
					} else {
						res.send({error:"SIGNATURE_INVALID"})
					}
				})
			} else {
				res.send({error:"USER_NOT_FOUND"})
			}
		})
	} else {
		res.send({error:"PARAMETERS_MISSING"})
	}
}

const addAPI = (url, fn, isPost)=>{
	d97.router.add('/api/user/'+url,function(req,res){
		try {
			fn(req,res);
		} catch(e) {
			res.send({error:"API_FAILED"})
		}
	}.bind({fn:fn}), (isPost ? 'post' : 'get') );
}

const APIEndpoint = (req, res) =>{
	var api = req.params.endpoint;
	try {
		d97.auth.fromToken(req.headers['token'],(done, so)=>{
			if(!done.error) {
				var address = done.string.slice(0,42);
				var nonce = done.string.slice(42);
				d97.db.collection('users').findOne({address:address, nonce:parseInt(nonce)},(err, user)=>{
					req.user = err || user;
					if(!err && user) {
						authorized[api](req,res);
					} else {
						res.send({error:"UNAUTHORIZED_ACCESS"})
					}
				})
			} else {
				res.send({error:"INVALID_REQUEST"})
			}
		})
	} catch(e){
		res.send({error:"INVALID_REQUEST"})
	}
}

module.exports = {
	name: "D97 Users",
	slug: "users",
	boot: (b,e)=>{
		addAPI('nonce',getNonce);
		addAPI('register',register,true);
		addAPI('login',login,true);
		addAPI('private/:endpoint',APIEndpoint,true);		
		b(b,e);	
	}
}