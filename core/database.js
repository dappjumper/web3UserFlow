const mongo = require('mongodb').MongoClient;

module.exports = {
	name: "D97 Database handler",
	slug: "db",
	boot: (b,e)=>{
		mongo.connect(process.env.DBURI, {
			useNewUrlParser: true
		}, function(err, client) {
			d97.db = client.db();
			b(b,e);
		});
	}
};