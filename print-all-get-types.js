var uniq = require('array-unique');

var aDs = require('./action-definitions.json');

module.exports = uniq(aDs.actions.reduce(function(memo, action) {
  try {
  memo = memo.concat(Object.keys(action.context.get).map(function(name) {
    return action.context.get[name].type;
  }).filter(function(t) { return !!t; }));
} catch(e) {}
return memo;
}, []));
