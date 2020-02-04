const ethereum = require('ethereumjs-wallet')
const hdkey = require('ethereumjs-wallet/hdkey')
const db = require('./db');
const admin = (process.env.WALLET_SLUG || "root");
const request = require('request');


const eth = {
	getBalance: (address, callback) => {
		var url = "https://api.etherscan.io/api?module=account&action=balance&address="+address+"&tag=latest&apikey="+process.env.ETHERSCAN_APIKEY
		request(url, { json: true }, (err, res, body) => {
			if (!err) {
				callback(body.result)
			} else {
				console.log(err);
				callback(false);
			}
		});
	},
	setWallet: (source,callback)=>{
		eth.wallet = ethereum.fromV3(source, process.env.ENCRYPT_KEY);
		eth.address = eth.wallet.getAddressString();
		console.log("Main server wallet "+admin+" => "+eth.address+" is now live!")
		console.log("Checking wallet balance...")
		eth.getBalance(eth.address, (balance)=>{
			if(balance) {
				eth.balance = parseInt(balance);
				console.log("Wallet "+admin+" has "+(eth.balance ? eth.balance / 1000000000000000000 : 0)+" eth")
			} else {
				eth.balance = 0;
			}
			callback();
		})
	},
	createOrGetWallet: (callback)=>{
		console.log("Searching for encrypted wallet")
		db.client.collection('ethereum').findOne({slug:admin},(err, result)=>{
			if(!err && result) {
				console.log("Wallet found! Decrypting...")
				eth.setWallet(result.encryptedWallet,()=>{callback(true)});
			} else {
				console.log("Creating new Ethereum wallet")
				var wallet = ethereum.generate().toV3(process.env.ENCRYPT_KEY);
				eth.setWallet(wallet,()=>{
					db.client.collection('ethereum').insertOne({"creator":"root","slug":admin,encryptedWallet:JSON.stringify(wallet)},(err, success)=>{
						if(!err && success) {
							console.log("Wallet successfully created!")
							callback(1)
						} else {
							console.log("Wallet creation failed!")
							callback(0)
						}
					})
				});
			}
		})
	}
}

module.exports = eth;