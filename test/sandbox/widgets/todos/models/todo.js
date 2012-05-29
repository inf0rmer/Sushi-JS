define(function() {
    var TodoModel = new Sushi.Class(Sushi.sandbox.mvc.Model, {
    
    	constructor: function(options, attributes) {
    		TodoModel.Super.call(this, options, attributes);
    	},

        // Default attributes for the todo.
        defaults: {
          title: "",
          completed: false
        },

        // Ensure that each todo created has `title`.
        initialize: function() {
          if (!this.get("title")) {
            this.set({"title": this.defaults.title});
          }
        },

        // Toggle the `completed` state of this todo item.
        toggle: function() {
          this.save({completed: !this.get("completed")});
        },

        // Remove this Todo from *localStorage*.
        clear: function() {
          this.destroy();
        }

    });
    return TodoModel;
});
