const request = require('request')
const apikey = "HP72XIMRA6IKDR8ZCJ33S9GQD6EFKZ5BU1";
const BigNumber = require('bignumber.js')

module.exports = {
	name: "Etherscan API",
	slug: "etherscan",
	getBurned: (req, res, callback)=>{
		request('https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x5b7e386b636abff1e83fc7101c33282acba8e1a5&address=0x0000000000000000000000000000000000000000&tag=latest&apikey='+apikey,(err,e,result)=>{
			if(!err && result) {
				callback(JSON.parse(result).result)
			} else {
				callback({error:"API_FAILED"})
			}
		})
	},
	getSupply: (req, res, callback)=>{
		request('https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x5b7e386b636abff1e83fc7101c33282acba8e1a5&apikey=HP72XIMRA6IKDR8ZCJ33S9GQD6EFKZ5BU1',(err, response, result)=>{
			if(!err && result) {
				callback(JSON.parse(result).result)
			} else {
				callback({error:"API_FAILED"})
			}
		})
	},
	boot: (b,e)=>{
		d97.router.add('/supply',(req,res)=>{
			d97.etherscan.getSupply(req,res,(supplyData)=>{
				if(!supplyData.error) {
					d97.etherscan.getBurned(req,res,(burnedData)=>{
						if(!burnedData.error) {
							res.send(new BigNumber(parseFloat(supplyData) - parseFloat(burnedData)).toFixed())
						} else {
							res.send(supplyData)
						}
					})
				} else {
					res.send(supplyData)
				}
			})
		})
		b(b,e);
	}
}