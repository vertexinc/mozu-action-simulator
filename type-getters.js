var path = require('path');
var fs = require('fs');
// var orderId = "05b0729b21f6632830431e1c00002bfe";

// function getOrder(client) {
//   return client.commerce().order().getOrder({ orderId: orderId });
// }
//

function getCustomer(client) {
  return client.commerce().customer().customerAccount().getAccounts({
    pageSize: 1
  }).then(pickFirst);
}

function getProduct(client) {
  return client.commerce().catalog().storefront().product().getProducts({
    pageSize: 1
  }).then(pickFirst)
}

function getOrders(client, number) {
  return client.commerce().order().getOrders({
    pageSize: number || 1
  });
}

function pickFirst(collection) {
  return collection.items[0];
}

var firstOrderPromise;
function getFirstOrder(client) {
  if (firstOrderPromise) return firstOrderPromise;
  return firstOrderPromise = getOrders(client).then(pickFirst);
}

function getFirstOrderFirstItem(client) {
  return getFirstOrder(client).then(function(o) {
    return o.items[0];
  });
}

function addAnonShopperClaims(client) {
  return client.commerce().customer().customerAuthTicket().createAnonymousShopperAuthTicket().then(function(ticket) {
    client.context['user-claims'] = ticket.accessToken;
    return client;
  });
}

function createCartFromOrder(shopperClient, order) {
  var opts = {
  };
  var client = shopperClient.commerce().cart();
  return client.getOrCreateCart(null, opts).then(function(cart) {
    cart.items = order.items;
    return client.updateCart(cart, opts);
  });
}

var exampleCartPromise;
function getExampleCart(client) {
  if (exampleCartPromise) return exampleCartPromise;
  return exampleCartPromise = Promise.all([
   addAnonShopperClaims(client),
   getFirstOrder(client)
  ]).then(function(res) {
    return createCartFromOrder.apply(this, res);
  });
}

function getExampleCartItem(client) {
  return getExampleCart(client).then(function(cart) {
    return cart.items[0];
  });
}

function dotNetCamelCase(str) {
  if (!str || str.charAt(0) === str.charAt(0).toLowerCase()) return str;
  str = str.split('');
  for (var i = 0, j = 1; i < str.length; i++, j++) {
    if (i > 0 && j < str.length && str[j] === str[j].toLowerCase()) break;
    str[i] = str[i].toLowerCase();
  }
  return str.join('');
}

function convertCamelCase(obj, thing) {
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      obj.forEach(convertCamelCase);
    } else {
      Object.keys(obj).forEach(function(key) {
        var value = obj[key];
        var camelCased = 
        obj[dotNetCamelCase(key)] = value;
        delete obj[key];
        if (typeof value === "object") convertCamelCase(value);
      })
    }
  }
  return obj;
}

function promiseForStatic(type) {
  var p = Promise.resolve(convertCamelCase(require('./static-fixtures/' + type + '.json')));
  return function() { return p; };
}

module.exports = {
  'order': getFirstOrder,
  'customer': getCustomer,
  'api.commerce.order': getFirstOrder,
  'mozu.commerceRuntime.contracts.orders.order': getFirstOrder,
  'mozu.commerceRuntime.contracts.orders.orderItem': getFirstOrderFirstItem,
  'api.commerce.cart': getExampleCart,
  'mozu.commerceRuntime.contracts.cart.cart': getExampleCart,
  'mozu.commerceRuntime.contracts.cart.cartItem': getExampleCartItem,
  'mozu.commerce.catalog.storefront.product': getProduct
};

fs.readdirSync('./static-fixtures').forEach(function(file) {
  var typename = path.basename(file, '.json');
  module.exports[typename] = promiseForStatic(typename);
});
