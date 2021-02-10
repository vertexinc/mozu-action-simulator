var types = require('./type-fixtures.json');
module.exports = {
  get: function(type) {
  	var result;
  	switch(type.toLowerCase()) {
  		case "string" :
  			result = "testvalue";
  			break;
  		case "int" :
  		case "number" :
  			result = 1;
  			break;
  		case "bool" :
  			result = true;
  			break;
  		case "date" :
  		case "datetime":
  			result = new Date();
        break;
      case "object":
        result = {};
        break;
  		default :
  			result = JSON.parse(JSON.stringify(types[type]));
  			break;
  	}
  	return result;
  }
}
