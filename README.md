# Mozu Action Test Simulator

<span style="color:red">
## This package is currently a prerelease.
This contains pre-release code. It may have behaviors or rely on features that don't work in Mozu production environments. Use with caution!
</span>

Test fixtures, harnesses, and assertions for Mozu Code Actions.

Use these tools in your unit tests. It is unopinionated about your test framework, and is known to work well with [Nodeunit](https://github.com/caolan/nodeunit) and [Mocha](http://mochajs.org/) at least.

## Features

### Simulator

#### `context(actionName, callback)`
Produce a mock context to be passed to the custom function. The context is the chief object your custom function will interact with. Each code action may expose different data and methods on its context; the simulator keeps track of this and provides generic mock objects. The generated context is meant for the test author to modify; she should change the objects or reimplement the `exec` methods to provide the right test cases.
All arguments are required.
##### Arguments
 - `actionName`: *(string)* The name of the action whose context to mock.
 - `callback`: *(function)* The callback that will be passed, along with this context, to `.simulate`.

Some context actions may cause the custom function to "exit early", so pass the callback that you'll eventually send to `.simulate` so that the returned context can access it if necessary

#### `simulate(actionName, customFunction, contextObject, callbackFunction)`
Run the custom function in a simulated environment. The simulator will run your custom function in a temporary Node environment that simulates the features of the server-side Code Actions runtime. It will prevent the same things (like lower-level socket connections) that the Code Actions runtime prevents, and pass the appropriate arguments for the named Code Action into your custom function. Still, it should be useful mostly for unit tests, and not for end-to-end integration testing. For the latter, use your Mozu Sandbox.
All arguments are required.
##### Arguments
 - `actionName`: *(string)* The name of the action the custom function will override. This may help the simulator adjust the runtime environment.
 - `customFunction`: *(function)* Your implementation; the custom function to run inside the simulator.
 - `contextObject`: *(object)* A configuration for the context object provided to the `customFunction` at runtime. This normally has `get` and `exec` properties with business objects and accessor functions on them. Create an object of this type quickly with `.context()`.
 - `callbackFunction`: *(function)* A function to be called when the `customFunction` calls its `callback` to complete its run. Right now this will just be passed in as the callback, but in the future it may be transformed. In your unit test, this should either call, or be, the asynchronous resolver function, e.g. `test.done()`.

Custom Functions are implemented in server-side JavaScript, as functions which receive a context and a callback:

```js
/*
 * embedded.commerce.order.getShippingRates
 */
module.exports = function(context, callback) {
    // examine and/or modify context
    
    // then continue
    callback();
}
```

Use the Simulator to test this environment on your local development machine.

```js
var Simulator = require('mozu-action-simulator');
var assert = Simulator.assert;
var 

describe('BeforeAddItem action', function () {

  var action;

  before(function () {
    action = require('../src/domains/commerce.carts/embedded.commerce.carts.addItem.before');
  });

  it('increments the item quantity if the product is in promotion', function(done) {

    var callback = function(err) {
      assert.ok(!err, "Callback was called");
      done();
    };

    var context = Simulator.context('embedded.commerce.carts.addItem.before', callback);

    var productInPromotion = Simulator.fixtures.get('product');
    productInPromotion.properties = productInPromotion.properties.filter(function(prop) {
      return prop.attributeFQN !== "tenant~inPromotion" // remove existing property
    }).concat({
      attributeFQN: "tenant~inPromotion",
      values: [
        {
          value: true // add property with value true
        }
      ]
    });

    context.exec.setQuantity = function(q) {
      assert.equal(context.get.cartItem().quantity + 1, q);
    }

    assert.ok(XDSimulator.simulate('embedded.commerce.carts.addItem.before', action, context, callback));
  });
});
```

You can configure the context that your custom function receives wth fixtures and stubs of `exec` accessor functions that you can fill with more assertions.

### Fixtures

#### `fixtures.get(type)`
All arguments are required.
##### Arguments
 - `type`: *(string)* The business object type to provide. The available types are currently:
    - `api.commerce.cart`: An in-progress [Cart](http://developer.mozu.com/resources/1.14/cart).
    - `api.commerce.order`: A completed [Order](http://developer.mozu.com/resources/1.14/order). 

The simulator includes example objects for the Mozu business objects that your custom function would access at the `context.get` object. As in the example above, you can populate that context object before you pass it to the `simulate` function by using the `fixtures` collection:

```js
var fixtures = require('mozuxd-simulator').fixtures;
var context = {
  get: {
    order: fixtures.get('api.commerce.order')
  }
};
```

In production, these objects will have many possible values and configurations that may affect the behavior of your custom function. The samples in `fixtures` are meant to serve as a starting point. A new sample object is cloned every time you call `fixtures.get`, so simply modify it as you would any plain JS object.

```js
var fixtures = require('mozuxd-simulator').fixtures;
var simpleCart = fixtures.get('api.commerce.cart');
simpleCart.couponCodes = ["SAMPLE_COUPON"];
simpleCart.discountTotal = 10;
simpleCart.discountedTotal = simpleCart.discountedTotal - 10;
// now use it in your context!
```

### Assertions

The simulator also contains an assertion library, for use in your unit tests.

##### `var assert = require('mozuxd-simulator').assert;`

Currently, this library has all the same methods as the [Node.js `assert` module](https://nodejs.org/api/assert.html). In the future, it may include special convenience assertions for common Mozu Extension cases.

