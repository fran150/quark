define(['quark', 'jquery', 'knockout'], function($$, $, ko) {
    function TestingHelper(main, testViewBase) {
        var self = this;

        this.main = main;

        var body = $(document).find('body');

        // Callback when loading is done
        var done = function() {};

        this.models = {};

        // Main imports object
        this.$imports = $$.tracker();


        $$.wait(self.$imports.ready, function(name) {
            done();
        });

        var listener = self.$imports.readied.add(function(name, model) {
            self.models[name] = model;
        });

        // Call to load component
        this.load = function(view, callback) {
            // Save the callback
            done = callback;

            // Add a new div to the body
            self.testArea = $('<div></div>').appendTo(body);

            // Load the required view
            require(['text!testing-views/' + view + '.html'], function(template) {
                self.testArea.append(template);

                ko.applyBindings(self, self.testArea.get(0));
            });
        }

        this.hasDOM = function(selector) {
            var found = $(self.testArea).find(selector);
            return found.length > 0;
        }

        this.findDOM = function(selector) {
            var found = $(self.testArea).find(selector);
            return found;
        }

        this.reset = function() {
            ko.cleanNode(self.testArea.get(0));
            $(self.testArea).remove();
            self.$imports.reset();
            self.models = {};
            $$.wait(self.$imports.ready, function(name) {
                done();
            });
        }
    }

    return TestingHelper;
});
