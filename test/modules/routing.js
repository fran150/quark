define(['quark'], function($$) {
    describe('Core - Behaviours Tests', function() {
        $$.routing.configure(
            $$.routing.routes()
                .on('/nomatch', 'nomatch')
                    .when('/prueba3/{param1}/{param2}', 'three', {
                        test: 'Controller3'
                    })
                .on('/*', 'test')
                    .when({
                        top: 'TopController'
                    })
                    .when('/prueba1/{param1}/{param2}', 'one', {
                        test: 'Controller1'
                    })
                    .when('/prueba2/{param3}', 'two', {
                        holder1: 'Controller2',
                        holder2: 'Controller3'
                    })
        );

        it ('Must Parse Route correctly and combine with \"any\" controllers', function() {
            $$.routing.parse('/prueba1/Hola/Mundo');
            var current = $$.routing.current();

            expect(current.route.locationPattern).toBe('/*');
            expect($$.isDefined(current.route.components)).toBe(true);
            expect(current.route.components.top).toBe('TopController');
            expect(current.route.components.test).toBe('Controller1');
            expect(current.params.param1).toBe('Hola');
            expect(current.params.param2).toBe('Mundo');
        });

        it ('Must Parse Route 2 correctly and combine with \"any\" controllers', function() {
            $$.routing.parse('/prueba2/Hola/');
            var current = $$.routing.current();

            expect(current.route.locationPattern).toBe('/*');
            expect($$.isDefined(current.route.components)).toBe(true);
            expect(current.route.components.top).toBe('TopController');
            expect(current.route.components.holder1).toBe('Controller2');
            expect(current.route.components.holder2).toBe('Controller3');
            expect(current.route.url).toBe('/prueba2/{param3}');
        });


        it ('Must Get Route 1', function() {
            var route = $$.routing.getRoute('test/one');
            expect(route.fullName).toBe('test/one');
        });

        it ('Must Generate a valid link to route', function() {
            var link = $$.routing.link('test/one', { param1: 'Adios', param2: 'Mundo Cruel' }, '/test');
            expect(link).toBe('/test#/prueba1/Adios/Mundo Cruel');
        });
    });

});
