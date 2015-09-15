define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {
    var page;
    var body;
    var test;

    describe('Core - Config Test', function() {
        beforeEach(function(done) {
            ko.components.register('test-component', $$.component(
                function(params, $scope) {
                    var self = this;

                    $$.config({
                        config1: '1',
                        config2: '2',
                        config3: 3
                    }, params, this);

                },
                '<quark-component></quark-component>')
            );

            function Page() {
                this.pageObservable = ko.observable('Page');

                this.ready = function() {
                    done();
                };
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('   <test-component data-bind="import: \'child\'" params=\"' +
                                'config1: \'5\',' +
                                'config2: pageObservable(),' +
                            '\">' +
                        '   </test-component>');

            page = new Page();
            ko.applyBindings(page, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
            ko.components.unregister('test-component');
        });

        describe('Configurations', function() {
            it ('Config gets the correct value', function() {
                expect(page.child.config.config1 == '5').toBe(true);
            });

            it ('Config wich receive an observable value reads correctly the value', function() {
                expect(page.child.config.config2 == 'Page').toBe(true);
            });

            it ('Unspecified config has default value', function() {
                expect(page.child.config.config3 == '3').toBe(true);
            });
        });
    });
});
