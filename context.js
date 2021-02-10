var ActionDefs = require('./action-definitions.json');
var HttpContext = require('./httpContext');
var GenericContext = require('./genericContext');
var fixtures = require('./fixtures');

module.exports = function(actionName, callback) {
  var newContext = new GenericContext();
  var def = ActionDefs.actions.reduce(function(match, action) {
    return action.action === actionName ? action : match;
  }, null);
  if (!def || !def.context) {
    throw new Error('Action context definition for ' + actionName + ' not found.');
  }
  var get = def.context.get;
  if (get) {
    Object.keys(get).forEach(function(k) {
      var v = get[k];
      if (v.return && v.return.type) {
        newContext.get[k] = function() {
          return fixtures.get(v.return.type);
        };
      } else if (v.type) {
        newContext.get[k] = fixtures.get(v.type);
      }
    });
  }
  var exec = def.context.exec;
  if (exec) {
    Object.keys(exec).forEach(function(k) {
      var v = exec[k];
      var functionBody = v.parameters.map(function(p) {
        return "assert.equal(typeof " + p.name + ", '" + p.type + "', 'Expected type of `" + p.name + "` to be \"" + p.type +"\".');";
      }).join('\n');
      var argumentsList = v.parameters.map(function(p) {
        return p.name;
      });
      newContext.exec[k] = Function.apply(null, argumentsList.concat(functionBody));
    });
  }

  newContext.apiContext.tenantId = 1234

  switch (def.context.type) {
      case 'mozu.actions.context.api.filter':
      case 'mozu.actions.context.storefront.filter':
      case 'mozu.actions.context.http':
          return new HttpContext(newContext, callback);
      default:
          return newContext;
  }

}
