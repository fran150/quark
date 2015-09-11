define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {
    function ViewModel(params) {
        var self = this;

        this.name = ko.observable('Frank');
        this.age = ko.observable(33);
        this.check = true;

        if (params && params.check) {
            debugger;
            this.check = false;
        }
    }

    var page;
    var body;
    var test;

    describe('Core - Inject Binding Test', function() {
        beforeEach(function(done) {

            ko.components.register('test-component', {
                template: '<quark-component></quark-component>',
                viewModel: ViewModel
            });

            function Page() {
                this.ready = function() {
                    debugger;
                    done();
                };

                this.data = {
                    name: 'Pat',
                    age: 34,
                    check: false
                }
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('   <test-component data-bind="as: \'child\'" params="name: \'child\'">' +
                        '       <!-- inject: data --> ' +
                        '       <!-- vm: \'child\' --> ' +
                        '       <h1>BlaBla</h1> ' +
                        '   </test-component>' +
                       '   <test-component data-bind="as: \'child2\'" params="check: true">' +
                        '       <!-- inject: data --> ' +
                        '       <!-- vm: \'child2\' --> ' +
                        '       <h1>BlaBla</h1> ' +
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

        describe('Inject', function() {
            it ('Calls the inject and init the object properties', function() {
                expect(page.child.name()).toBe('Pat');
                expect(page.child.age()).toBe(34);
                expect(page.child.check).toBe(false);
            });
        });
    });
});
