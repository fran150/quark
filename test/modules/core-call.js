define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {
    var page;
    var body;
    var test;

    describe('Core - Call Binding Test', function() {
        beforeEach(function(done) {
            ko.components.register('test-component', $$.component(function(params) {
                var self = this;

                this.counter = ko.observable(0);
            }, '<quark-component></quark-component>'));

            function Page() {
                this.ready = function() {
                    done();
                };

                this.increment = function(object) {
                    object.counter(object.counter() + 1);
                }
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('   <test-component data-bind="import: \'child\'" qk-call=" function() { increment($child) }" >' +
                        '   </test-component>');

            page = new Page();
            ko.applyBindings(page, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
            ko.components.unregister('test-component');
        });

        describe('Calls', function() {
            it ('Calls the function and increments child counter in 1', function() {
                expect(page.child.counter()).toBe(1);
            });
        });

    });
});
