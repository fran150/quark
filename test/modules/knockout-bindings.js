define(['quark', 'jquery', 'knockout'], function($$, $, ko) {
    function ViewModel() {
        var self = this;

        this.selected = ko.observable();
        this.number = ko.observable();
        this.money = ko.observable();

        this.selectedFunction = function() {
            return true;
        }

        this.selectItem = function() {
            self.selected(0);
        }
    }

    var page;
    var body;
    var test;
    var row;
    var row2;
    var number;
    var money;
    var model;

    describe('KO Bindings', function() {
        beforeEach(function() {
            body = $(document).find('body');
            $('<div id=\'test\'>' +
              '<table><tr id=\"row\" data-bind=\"rowSelect: { isSelected: selected() == 0, select: selectItem }\"><td></td></tr></table>' +
              '<table><tr id=\"row2\" data-bind=\"rowSelect: { isSelected: selectedFunction, select: selectItem }\"><td></td></tr></table>' +
              '<input type=\"text\" id=\"number\" data-bind=\"numericValue: number, valueUpdate: afterkeydown\" />' +
              '<input type=\"text\" id=\"money\" data-bind=\"moneyValue: money\" />' +
              '</div>'
              ).appendTo(body);

            test = $(body).find('#test');
            row = $(body).find('#row');
            row2 = $(body).find('#row2');
            number = $(body).find('#number');
            money = $(body).find('#money');

            model = new ViewModel();


            ko.applyBindings(model, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
        });

        it ('Row Not Selected if condition is false', function() {
            var value = row.hasClass('success');
            expect(value).toBe(false);
        });

        it ('Row Selected when using function that always return true', function() {
            var value = row2.hasClass('success');
            expect(value).toBe(true);
        });

        it ('Row Selected when clicked', function() {
            var value = row.hasClass('success');
            expect(value).toBe(false);
            row.click();
            value = row.hasClass('success');
            expect(value).toBe(true);
        });

        it ('Numbers must be empty string when not defined', function() {
            var value = number.val();
            expect(value).toBe('');
            value = money.val();
            expect(value).toBe('');
        });

        it ('Numbers on model must be undefined when not not valid', function() {
            number.val('qwe');
            expect(model.number()).toBe(undefined);
            money.val('qwe');
            expect(model.money()).toBe(undefined);
        });

        it ('Numbers Formatting', function() {
            model.number(1234.567);
            expect(number.val()).toBe('1.234,57');
            model.money(1234.567);
            expect(money.val()).toBe('$ 1.234,57');
        });
    });

});
