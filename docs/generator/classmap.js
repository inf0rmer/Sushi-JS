YAHOO.env.classMap = {"Sushi.utils": "Sushi", "Sushi.utils.debug": "Sushi", "Sushi.utils.collection": "Sushi", "Sushi.utils.json": "Sushi", "Sushi.core": "Sushi", "Sushi.base": "Sushi", "Sushi.events": "Sushi"};

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
