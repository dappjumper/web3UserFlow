const path = require('path')

module.exports = {
	name: "D97 Router",
	slug: "router",
	add: (url, handler, method)=>{
		fastify[method || 'get'](url.toLowerCase(),handler)
	},
	on404: (req,res)=>{
		res.redirect('/404/')
	},
	boot: (b,e)=>{
		fastify.register(require('fastify-static'), {
			  root: path.join(__dirname, '../public'),
			  prefix: '/',
			  wildcard: true,
			  ignoreTrailingSlash: true
			})
		fastify.setNotFoundHandler(d97.router.on404)
		b(b,e);
	}
}