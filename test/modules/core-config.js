define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {
    function ViewModel(params) {
        var self = this;

        $$.config({
            config1: '1',
            config2: '2',
            config3: 3
        }, params, this);
    }

    var page;
    var body;
    var test;

    describe('Core - Config Test', function() {
        beforeEach(function(done) {
            ko.components.register('quark-component', {
                template: { require: 'text!dist/quark-component.html' }
            });

            ko.components.register('test-component', {
                template: '<quark-component></quark-component>',
                viewModel: ViewModel
            });

            function Page() {
                this.pageObservable = ko.observable('Page');

                $$.components({
                    child: {}
                }, this, function() {
                    done();
                });
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('   <test-component params=\"' +
                                'config1: \'5\',' +
                                'config2: pageObservable(),' +
                            '\">' +
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
