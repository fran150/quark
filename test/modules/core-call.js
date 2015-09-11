define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {
    function ViewModel(params) {
        var self = this;

        this.counter = ko.observable(0);

    }

    var page;
    var body;
    var test;

    describe('Core - Call Binding Test', function() {
        beforeEach(function(done) {
            ko.components.register('quark-component', {
                template: { require: 'text!dist/quark-component.html' }
            });

            ko.components.register('test-component', {
                template: '<quark-component></quark-component>',
                viewModel: ViewModel
            });

            function Page() {
                $$.components({
                    child: {}
                }, this, function() {
                    done();
                });

                this.increment = function(object) {
                    object.counter(object.counter() + 1);
                }
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('   <test-component>' +
                        '       <!-- call: function() { increment($child) } --> ' +
                        '       <!-- vm: \'child\' --> ' +
                        '   </test-component>');

            page = new Page();
            ko.applyBindings(page, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
            ko.components.unregister('test-component');
            ko.components.unregister('quark-component');
        });

        describe('Calls', function() {
            it ('Calls the function and increments child counter in 1', function() {
                expect(page.child.counter()).toBe(1);
            });
        });

    });
});
