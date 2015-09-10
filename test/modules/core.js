define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {
    function ViewModel(params) {
        var self = this;

        this.name = ko.observable('Prueba');
    }

    ko.components.register('quark-component', {
        template: { require: 'text!dist/quark-component.html' }
    });

    ko.components.register('test-component', {
        template: '<quark-component><input type=\"text\" id=\"prueba\" data-bind=\"value: name\" /></quark-component>',
        viewModel: ViewModel
    });

    var page;
    var body;
    var test;

    describe('Core - Components Test', function() {
        beforeEach(function(done) {
            function Page() {
                $$.components({
                    child: {}
                }, this, function() {
                    done();
                });
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('   <test-component>' +
                        '       <!-- vm: \'child\' --> ' +
                        '   </test-component>');

            page = new Page();
            ko.applyBindings(page, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
        });

        it ('Input is bound to observable', function() {
            expect($(test).find('#prueba').val()).toBe('Prueba');
        });

        it ('Modifying observable affects input', function() {
            expect($(test).find('#prueba').val()).toBe('Prueba');
            page.child.name('Tested');
            expect($(test).find('#prueba').val()).toBe('Tested');
        });
    });
});
