var fs = require('fs');
var chalk = require('chalk');
var assert = require('assert');
var client = require('mozu-node-sdk').client(null, { plugins: [require('mozu-node-sdk/plugins/fiddler-proxy')]});
var typeGetters = require('./type-getters');
var printAllGetTypes = require('./print-all-get-types');

var typeJson = {};

assert(client.context.tenant && client.context.site, "Please provide a mozu.config.json file that specifies a tenant and site.");

console.log('Downloading fixture objects from tenant ' + client.context.tenant);
Promise.all(Object.keys(typeGetters).map(function(type) {
  console.log(' Requesting ' + type);
  return typeGetters[type](client).then(function(result) {
    typeJson[type] = result;
    console.log(' >> ' + type + " downloaded!");
  })
})).then(function() {
  fs.writeFileSync('./type-fixtures.json', JSON.stringify(typeJson, null, 2), 'utf8');


  var missingTypes = printAllGetTypes.filter(function(type) {
    return !typeJson[type];
  });

  if (missingTypes && missingTypes.length > 0) {
    console.error(chalk.bold.red("\nThe fixtures collection is missing the types: \n\n ") + chalk.red(missingTypes.join('\n ')) + chalk.bold.red("\n\nThese will be required in unit tests.\n"));
    //process.exit(1);
  } else {
    console.log(chalk.bold.green('\nSimulator fixtures built successfully!\n'))
  }

}).catch(function(e) {
  console.error(e);
  process.exit(1);
});
