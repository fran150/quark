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

    describe('Components', function() {
        beforeEach(function(done) {
            function Page() {
                $$.components({
                    child: {}
                }, this, function() {
                    done();
                });
            }

            $('<iframe id="testFrame" name="myFrame">').appendTo('body');
            body = $('iframe').contents().find('body');

            body.append('   <test-component>' +
                        '       <!-- vm: \'child\' --> ' +
                        '   </test-component>');

            page = new Page();
            ko.applyBindings(page, body[0]);
        });

        afterEach(function() {
            $('#testFrame').remove();
        });

        it ('Input is bound to observable', function() {
            expect($(body).find('#prueba').val()).toBe('Prueba');
        });

        it ('Modifying observable affects input', function() {
            expect($(body).find('#prueba').val()).toBe('Prueba');
            page.child.name('Tested');
            expect($(body).find('#prueba').val()).toBe('Tested');
        });
    });
});
