define(["require", "exports", "module", "reqwest"], function(require, exports, module) {
!function ($) {
  var r = require('reqwest')
    , integrate = function(method) {
      return function() {
        var args = (this && this.length > 0 ? this : []).concat(Array.prototype.slice.call(arguments, 0))
        return r[method].apply(null, args)
      }
    }
    , s = integrate('serialize')
    , sa = integrate('serializeArray')

  $.ender({
      ajax: r
    , serialize: s
    , serializeArray: sa
    , toQueryString: r.toQueryString
  })

  $.ender({
      serialize: s
    , serializeArray: sa
  }, true)
}(ender);

});
