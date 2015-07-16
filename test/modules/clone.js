define(['../../dist/quark.js', 'knockout', 'knockout-mapping'], function($$, ko, komapping) {
  describe('Pruebas de clone', function() {
    var objeto = { nombre: 'pepe', numero: 1234, decimal: 1234.56 };  
    var array = [ 'pepe', 1234, 1234.56 ];  
    
    it('Clonado de objeto', function() {
        var result = $$.clone(objeto);
        expect(result).toEqual({ nombre: 'pepe', numero: 1234, decimal: 1234.56 });
        result.nombre = 'chicho';
        expect(result.nombre).toEqual('chicho');
        expect(objeto.nombre).toEqual('pepe');
    });    
    
    it('Clonado de objeto observable', function() {
        var obj = komapping.fromJS(objeto);
        var result = $$.cloneObservable(obj);
        
        expect(result.nombre()).toEqual('pepe');
        expect(result.numero()).toEqual(1234);
        expect(result.decimal()).toEqual(1234.56);
        
        result.nombre('chicho');
        expect(result.nombre()).toEqual('chicho');
        expect(obj.nombre()).toEqual('pepe');
    });          
  });
});
