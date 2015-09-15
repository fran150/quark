define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {
    var page;
    var body;
    var test;

    describe('Core - Inject Binding Test', function() {
        beforeEach(function(done) {
            ko.components.register('test-component',
                $$.component(function(params, $scope) {
                    var self = this;

                    this.name = ko.observable('Frank');
                    this.age = ko.observable(33);
                    this.check = true;

                    $scope.hola = ko.observable('Hola');

                    this.dispose = function() {
                    }
                }, '<quark-component><input type=\"text\" data-bind=\"value: hola\" /></quark-component>')
           );

            function Page() {
                this.ready = function() {
                    done();
                }

                this.data = {
                    name: 'Pat',
                    age: 34,
                    check: false
                }
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('   <test-component data-bind="import: \'child\'" qk-inject=\"data\">' +
                        '   </test-component>');

            page = new Page();
            ko.applyBindings(page, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
            ko.components.unregister('test-component');
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
