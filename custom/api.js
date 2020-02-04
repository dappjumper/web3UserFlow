const factory = require('./factory');
const db = require('./db');
const eth = require('ethereumjs-wallet');
const ethInterface = require('./eth')
const users = require('./user')
const request = require('request')
const cache = require('./cache')

var api = {
	get: {},
	post: {},
	user: users
};

api.setup = (router, callback)=>{
	console.log("Setting cache info");
	cache.createCache({
		"CMC_ZUC": process.env.CMC_MAX_DAILY || 330
	});
	console.log("Initializing API endpoints")
	try{

		router.get('/api/:endpoint', async (req, res) => {
		  var endpoint = req.params.endpoint;
		  try {
		  	api.get[endpoint](req, res)
		  } catch(e){
		  	res.code(500).header('Content-Type', 'text/plain; charset=utf-8').send({error:"API_ENDPOINT_NOT_FOUND"})
		  }
		})

		router.post('/api/:endpoint', async (req, res) => {
		  try {
		  	api.post[req.params.endpoint](req, res)
		  } catch(e){
		  	res.code(500).header('Content-Type', 'text/plain; charset=utf-8').send({error:"API_ENDPOINT_NOT_FOUND"})
		  }
		})

		console.log("API endpoints now available!")

		if(users) {
			users.setup(router,callback)
		} else {
			callback(1);
		}
	} catch(e){
		callback(0)
	}
}

api.get.time = async (req, res)=>{
	res.code(200).header('Content-Type', 'text/plain; charset=utf-8').send(''+new Date().getTime());
}

api.get.person = async (req, res)=>{
	var newPerson = factory.getFull('person');
	res.send(newPerson)
}

api.get.company = async (req, res)=>{
	var newCompany = factory.getFullTemplate('company');
	res.send(newCompany)
}

api.get.eth = async (req, res)=>{
	var newWallet = eth.generate();
	res.send({
		privateKey: newWallet.getPrivateKeyString(),
		publicKey: newWallet.getAddressString()
	})
}

api.get.zuc = async (req, res)=>{
	var data = cache.getData('CMC_ZUC');
	if(data) {
		res.send(data)
	} else {
		console.log("Refreshing cache")
		request.get({
		  headers: {'X-CMC_PRO_API_KEY':process.env.CMC_API},
		  url:     'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?id=4250'
		}, function(error, response, body){
		  if(!error) {
		  	body = JSON.parse(body).data["4250"];
		  	cache.setData('CMC_ZUC',body);
		  	res.send(body);
		  } else {
		  	res.send(error)
		  }
		});
	}
}

api.post.ethBalance = async (req, res) => {
	if(req.body) {
		if(req.body.address) {
			ethInterface.getBalance(req.body.address, (balance)=>{
				var returnThis = {address: req.body.address};
				if(parseInt(balance)) {
					if(balance) {
						returnThis.wei = parseInt(balance);
						returnThis.eth = returnThis.wei / 1000000000000000000;
					} else {returnThis.wei = 0; returnThis.eth = 0;}
				} else {
					returnThis.error = "RATE_LIMIT_REACHED"
				}
				res.send(returnThis);
			})
		} else {
			res.send({error:"UNSPECIFIED_REQUEST_PARAMETER"})
		}
	} else {
		res.send({error:"POST_REQUEST_REQUIRED"})
	}
}

module.exports = api;