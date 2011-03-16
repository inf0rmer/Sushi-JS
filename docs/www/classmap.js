YAHOO.env.classMap = {"Sushi.campus": "Sushi", "Sushi.utils.HTML5": "Sushi", "Sushi.utils.Lang": "Sushi", "Sushi.utils": "Sushi", "Sushi.utils.Debug": "Sushi", "Sushi.utils.Collection": "Sushi", "Sushi.utils.JSON": "Sushi", "Sushi.core": "Sushi", "Sushi.base": "Sushi", "Sushi.events": "Sushi"};

YAHOO.env.resolveClass = function(className) {
    var a=className.split('.'), ns=YAHOO.env.classMap;

    for (var i=0; i<a.length; i=i+1) {
        if (ns[a[i]]) {
            ns = ns[a[i]];
        } else {
            return null;
        }
    }

    return ns;
};
