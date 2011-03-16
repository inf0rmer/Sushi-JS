define(
  ['sushi.core'],
  
  function(){
      Sushi.namespace('history');
            
      var _supports = (function(){
          if (typeof window.history.pushState === undefined) {
              return false;
          }
          
          return true;
      })(),
      _nativeHistory = window.history,
      _pushState = _nativeHistory.pushState,
      
      push = function(url, stateObj, title) {
          _nativeHistory.pushState(stateObj, title, url);
      },
    
      replace = function(url, stateObj, title) {
          _nativeHistory.replaceState(stateObj, title, url);
      },
    
      go = function(step) {
          _nativeHistory.go(step);
      },
    
      back = function() {
          _nativeHistory.back();
      },
    
      forward = function() {
          _nativeHistory.forward();
      };
      
      if (!_supports) {
          return false;
      }
      
      window.popstate = function() {
          
      }
      
      window.hashchange = function() {
          
      }
      
      Sushi.extend(Sushi.history, {
          pushState: push,
          replaceState: replace,
          go: go,
          back: back,
          forward: forward
      });
      
      return Sushi.history;
  }  
);