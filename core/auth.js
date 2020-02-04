const path = require('path')
const EthUtil = require('ethereumjs-util')
const EthTx = require('ethereumjs-tx').Transaction
const jwt = require('fastify-jwt')

module.exports = {
	name: "D97 Authorizer",
	slug: "auth",
	decodeSignature: async (signature, content, callback)=>{
		var res = EthUtil.fromRpcSig(signature);
		var addr = EthUtil.bufferToHex(EthUtil.pubToAddress(EthUtil.ecrecover(EthUtil.hashPersonalMessage(Buffer.from(content)), res.v, res.r, res.s)));
		if(addr) {
			callback({address:addr})
		} else {
			callback({error:"DECODE_FAILED"})
		}
	},
	toToken: (object, callback)=>{
		if(typeof object != 'object') object = {string:object}
		callback(fastify.jwt.sign(object,{'expiresIn':'7d'}))
	},
	verify: (token, address, nonce, callback) => {
		d97.auth.fromToken(token,(string)=>{
			var addressVS = string.slice(0,42);
			var nonceVS = string.slice(42);
			if(address == addressVS && nonce == nonceVS) {
				callback(true)
			} else {
				callback(false)
			}
		})
	},
	fromToken: (token, callback)=>{
		fastify.jwt.verify(token,(err,tokenData)=>{
			callback(tokenData)
		})
	},
	boot: (b,e)=>{
		fastify.register(jwt, { secret: process.env.ENCRYPT_KEY || 'secret' })
		b(b,e);
	}
}