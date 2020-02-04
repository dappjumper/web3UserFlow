var cache = {}
cache.data = {}
var CMC_TTL = 86400 / process.env.CMC_MAX_DAILY;

const readyForLive = (timestamp, seconds)=>{
	return ((new Date().getTime() - timestamp) / 1000>=seconds)
}

cache.getData = (key)=>{
	try {
		if(readyForLive((cache.data[key].last),cache.data[key].delay)) {
			return 0
		} else {
			return cache.data[key].value;
		}
	}catch(e){
		console.log(e)
		return 0
	}
}
cache.setData = (key,value)=>{
	if(!cache.data[key]) {
		cache.data[key]={}
	}
	cache.data[key].value = value;
	cache.data[key].last = new Date().getTime();
}
cache.createCache = (keys)=>{
	for(var key in keys) {
		cache.data[key] = {
			value: false,
			delay: 0,
			last: 0
		}
		if(keys[key]) {
			cache.data[key].delay = keys[key];
		}
	}
}

module.exports = cache;