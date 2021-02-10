module.exports = function(actionName, implementation, contextConfig, callback) {
    return implementation.call(null, contextConfig, callback);
};
