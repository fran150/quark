define(['knockout', 'jquery', 'quark'], function(ko, $, $$) {

    var page;
    var body;
    var test;

    describe('Core - Parameters Test', function() {
        beforeEach(function(done) {
            ko.components.register('test-component', $$.component(function (params, $scope) {
                var self = this;
                $$.parameters({
                    observable: ko.observable(),
                    notObservable: '',
                    notReceived: ko.observable('Model'),
                    computable: ko.computedParameter(params.computableObs, {
                        read: function(param) {
                            return param() + 'added';
                        },
                        write: function(param, newValue) {
                            param(newValue);
                        }
                    }, this),
                    computableNotObs: ko.computedParameter(params.computableNotObs, {
                        read: function(param) {
                            return param() + 'added';
                        },
                        write: function(param, newValue) {
                            param(newValue);
                        }
                    }, this)
                }, params, this);

                $scope.observable = this.observable;
                $scope.notObservable = this.notObservable;
                $scope.notReceived = this.notReceived;
                $scope.computable = this.computable;
                $scope.computableNotObs = this.computableNotObs;

                this.receivedButNotSet = ko.observable('Model');

                this.dispose = function() {
                    console.log('test');
                }
            },
            '<quark-component><input type=\"text\" data-bind=\"value: observable\" /></quark-component>'));

            function Page() {
                this.pageObservable = ko.observable('Page');
                this.pageNotObservable = 'Page';
                this.pageNotToSet = ko.observable('Page');
                this.pageToCompute = ko.observable('Page');

                this.ready = function() {
                    done();
                };
            }

            body = $(document).find('body');
            $('<div id=\'test\'></div>').appendTo(body);

            test = $(body).find('#test');
            test.append('<test-component data-bind="import: \'child\'" params=\"' +
                                'observable: pageObservable,' +
                                'notObservable: pageNotObservable,' +
                                'receivedButNotSet: pageNotToSet,' +
                                'computableObs: pageToCompute,' +
                                'computableNotObs: \'Page\'' +
                            '\">' +
                        '</test-component>');

            page = new Page();
            ko.applyBindings(page, test[0]);
        });

        afterEach(function() {
            ko.cleanNode(test.get(0));
            $(test).remove();
            ko.components.unregister('test-component');
        });

        describe('Parameters', function() {
            it ('Observable param is shared between parent and child', function() {
                expect(page.pageObservable == page.child.observable).toBe(true);
            });

            it ('Not observable param gets the correct value', function() {
                expect(page.child.notObservable == 'Page').toBe(true);
            });

            it ('Not received param has the default value', function() {
                expect(page.child.notReceived() == 'Model').toBe(true);
            });

            it ('Computed param wich receive an observable returns the modified value', function() {
                expect(page.child.computable() == 'Pageadded').toBe(true);
            });

            it ('Modifying computed param wich receive an observable affects the parameter value', function() {
                page.child.computable('NewValue')
                expect(page.pageToCompute() == 'NewValue').toBe(true);
            });

            it ('Modifying computed param affects the parameter value', function() {
                page.child.computable('NewValue')
                expect(page.pageToCompute() == 'NewValue').toBe(true);
            });

            it ('Computed param wich receive a variable returns the modified value', function() {
                expect(page.child.computableNotObs() == 'Pageadded').toBe(true);
            });

            it ('Modifying computed param wich receive a variable do not throws error', function() {
                expect(function() { page.child.computableNotObs('NewValue') }).not.toThrow();
            });
        });
    });
});
