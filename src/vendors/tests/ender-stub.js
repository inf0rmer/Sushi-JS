define(["require", "exports", "module"], function(require, exports, module) {
window['require'] = function(name) {
  return window[name]
}
window['ender'] = {
  _boosh: {},
  ender: function(m, b) {
    for (i in m) {
      (b ? ender._boosh : ender)[i] = m[i]
    }
  }
}

});
