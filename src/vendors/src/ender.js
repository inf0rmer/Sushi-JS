define(["require", "exports", "module"], function(require, exports, module) {
ender.ender({
  ajax: reqwest
});
ender.ender({
  serialize: function () {
    return reqwest.serialize(this[0]);
  }
  , serializeArray: function() {
    return reqwest.serializeArray(this[0]);
  }
}, true);
});
