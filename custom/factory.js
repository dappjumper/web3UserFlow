var common = {
	generateSlug: (entity)=>{
		var slug = entity.name;
		const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
		const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
		const p = new RegExp(a.split('').join('|'), 'g')

		return slug.toString().toLowerCase()
			.replace(/\s+/g, '-')
			.replace(p, c => b.charAt(a.indexOf(c)))
			.replace(/&/g, '-and-')
			.replace(/[^\w\-]+/g, '')
			.replace(/\-\-+/g, '-')
			.replace(/^-+/, '')
			.replace(/-+$/, '')
	},
	about: (entity)=>{
		return {
			name: entity.name,
			slug: entity.slug,
			contact: entity.contact
		}
	}
}

const templates = {
	person: {
		name: "",
		slug: "",
		contact: {
			email: ""
		},
		data: {}
	},
	company: {
		name: "",
		slug: "",
		members: {},
		data: {},
		contact: {
			email: ""
		},
		payment: {
			type: "ETH",
			deposit: "",
			balance: 0,
			accrued: 0
		},
		data: {}
	},
	company_functions: {
		isFunded: (company)=>{
			return (company.payment.balance >= company.payment.accrued)
		}
	}
}

const factory = (id)=>{
	var fromTemplate = {};
	try {
		fromTemplate = JSON.parse(JSON.stringify(templates[id]))
	}catch(e){
		fromTemplate = false
	}
	return fromTemplate
}

var exportThis = {
	getTemplate: (id)=>{
		return factory(id);
	},
	getTemplateFunctions: (id)=>{
		var fromTemplate = {
			specific: [],
			common: []
		};
		try {
			for(var key in templates[id+'_functions']) {
				fromTemplate.specific.push(key)
			}
		} catch(e){
			console.log(e)
			fromTemplate = false
		}
		for(var key in common) {
			fromTemplate.common.push(key)
		}
		return fromTemplate
	}
}

exportThis.getFullTemplate = (id)=>{
	return {
		template: exportThis.getTemplate(id),
		functions: exportThis.getTemplateFunctions(id)
	}
}

module.exports = exportThis;