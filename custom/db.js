const mongo = require('mongodb').MongoClient;
const factory = require('./factory')

var db = {}

db.connect = (config, callback)=>{
	console.log('Connecting to database');
	mongo.connect(config.url, {
		useNewUrlParser: true
	}, function(err, client) {
		console.log((err ? 'Database not connected!' : 'Database connected!'));
		db.client = client.db();
		if(typeof callback == 'function') callback((err ? 0 : 1));
	});
}

module.exports = db;