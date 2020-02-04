try{
var insertIntoENV = require('./.env');
for(var v in insertIntoENV) {
	process.env[v] = insertIntoENV[v];
}
}catch(e){console.info(e)}; //Use .env if exist
const fastify = require('fastify')()
global.fastify = fastify;
const helmet = require('fastify-helmet')
const path = require('path')
global.d97 = {}

d97.boot = (e)=>{
	var tick = (me, e)=>{
		var m = e.shift();
		if(m) {
			console.info("Starting module "+(m.name ? m.name : "without name"))
			if(m.slug) d97[m.slug] = m
			m.boot(me,e)
		} else {
			fastify.listen(process.env.PORT || 3000, '0.0.0.0', function (err, address) {
			  if (err) {
			    console.info(err)
			    process.exit(1)
			  }
			  console.log(`Now dapping on ${address}`)
			})
		}
	}
	tick(tick, e);
}

d97.boot(
	[
		require('./core/database'),
		require('./core/router'),
		require('./core/auth'),
		require('./core/user')
	]
);