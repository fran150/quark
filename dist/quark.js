!function(e,n){"function"==typeof define&&define.amd?define(["knockout","jquery","knockout-mapping","accounting-js","blockUI"],n):(e.komapping=ko.mapping,e.$$=n(e.ko,e.$,e.komapping,e.accounting))}(this,function(e,n,i,t){function a(){var t=this;this.clientErrorHandlers={},this.serverErrorHandlers={},this.behaviours={},this.behaviour=function(e,n){t.behaviours[e]=n},this.behave=function(e,n){if(!t.isObject(e))throw"Debe especificar un objeto al que se desea asignar el comportamiento";if(t.isArray(n))for(var i=0;i<n.length;i++){if(!t.behaviours[n[i]])throw"El comportamiento "+n[i]+" no se encuentra registrado.";t.behaviours[n[i]](e)}else{if(!t.isString(n))throw"Debe especificar un string con el nombre del comportamiento o un array de nombres de comportamientos que desea que tenga el objeto";if(!t.behaviours[n])throw"El comportamiento "+n+" no se encuentra registrado.";t.behaviours[n](e)}},this.isDefined=function(e){return"undefined"==typeof e?!1:!0},this.redirect=function(e){return window.location.href=e,!0},this.clone=function(e){return jQuery.extend(!0,{},e)},this.cloneObservable=function(e){return i.fromJS(i.toJS(e))},this.replaceAndBind=function(n,i,t){n.html(i),e.cleanNode(n.get(0)),e.applyBindings(t,n.get(0))},this.block=function(e,i){i||(i="Procesando...");var t={message:i,css:{border:"none",padding:"5px",backgroundColor:"#000","-webkit-border-radius":"5px","-moz-border-radius":"5px",opacity:.7,color:"#fff"},baseZ:5e3};e?n(e).block(t):n.blockUI(t)},this.unblock=function(e){e?n(e).unblock():n.unblockUI()},this.getParam=function(e){var n=void 0,i=[];return location.search.substr(1).split("&").forEach(function(t){i=t.split("="),i[0]===e&&(n=decodeURIComponent(i[1]))}),n},this.isString=function(e){return"string"==typeof e||e instanceof String?!0:!1},this.isInt=function(e){return Number(e)===e&&e%1===0},this.isNumeric=function(e){return e===Number(e)&&e%1!==0},this.isArray=function(e){return n.isArray(e)},this.isObject=function(e){return null!==e&&"object"==typeof e?!0:!1},this.isFunction=function(e){return null!==e&&"function"==typeof e?!0:!1},this.isDate=function(e){return e instanceof Date?!0:!1},this.isValidDate=function(e){return t.isDate(e)?isNaN(e.getTime())?!1:!0:!1},this.setCookie=function(e,n,i){var t=new Date;if(void 0!==i){t.setTime(t.getTime()+1e3*i);var a="expires="+t.toUTCString();document.cookie=e+"="+n+"; "+a}else document.cookie=e+"="+n+"; "},this.getCookie=function(e){for(var n=e+"=",i=document.cookie.split(";"),t=0;t<i.length;t++){for(var a=i[t];" "===a.charAt(0);)a=a.substring(1);if(0===a.indexOf(n))return a.substring(n.length,a.length)}return""},this.ajax=function(e,i,a,r,o,s,d,l){var u="",c="Guardando...";t.isDefined(i)&&null!==i&&(t.isObject(i)?(t.isDefined(i.target)&&(u=i.target),t.isDefined(i.message)&&(c=i.message)):c=i,t.block(u,c));var f={};r&&(f={access_token:t.getCookie("token")}),n.ajax({url:e,type:o,cache:!1,data:s,async:a,success:d,headers:f,error:function(n,a,r){var o=!1;if(t.isDefined(i)&&null!==i&&t.unblock(u),t.isDefined(l)&&(o=l()),!o)if(n.status>=500&&n.status<600){for(handlerName in t.serverErrorHandlers)if(t.serverErrorHandlers[handlerName](e,JSON.parse(n.responseText))){o=!0;break}}else for(handlerName in t.clientErrorHandlers)if(t.clientErrorHandlers[handlerName](e,n,a,r)){o=!0;break}}})},this.htmlEncode=function(e){return e?jQuery("<div />").text(e).html():""},this.htmlDecode=function(e){return e?n("<div />").html(e).text():""},this.limitText=function(e,n){return t.isInt(n)?6>n&&(n=6):n=6,t.isString(e)?(e.length>n&&(e=e.substr(0,n-3)+"..."),e):""},this.components=function(e,n,i){n.childs={};for(var a in e)n.childs[a]={},n.childs[a].load=function(a,r){n[a](r),n.childs[a].loaded=!0,t.isDefined(r.childs)?(n.childs[a].ready=!1,r.parent=n,r.parentState=n.childs[a]):(n.childs[a].ready=!0,t.isDefined(r.ready)&&r.ready());for(var o in e)if(!n.childs[o].loaded)return;for(var o in e)if(!n.childs[o].ready)return;t.isDefined(i)&&i(),t.isFunction(n.ready)&&n.ready(),t.isDefined(n.parent)&&(n.parentState.ready=!0,n.parent.childReady())},n.childs[a].loaded=!1,n.childReady=function(){for(var a in e)if(!n.childs[a].ready)return;t.isDefined(i)&&i(),t.isFunction(n.ready)&&n.ready(),t.isDefined(n.parent)&&(n.parentState.ready=!0,n.parent.childReady())},n[a]=e[a]},this.config=function(n,i,a){if(!t.isDefined(i))throw"Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark";if(!t.isDefined(a))throw"Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark";t.isDefined(a.config)||(a.config={});for(var r in n)a.config[r]=n[r],e.isObservable(a.config[r])&&console.warn("Cuidado! La propiedad "+r+" del objeto no deberia ser observable ya que el componente no deberia reaccionar si se cambia una vez creado. Para esto puede usar parameters"),t.isDefined(i[r])&&(e.isObservable(i[r])?a.config[r]=i[r]():a.config[r]=i[r])},this.parameters=function(n,i,a){if(!t.isDefined(i))throw"Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark";if(!t.isDefined(a))throw"Debe especificar el array con los valores enviados como parametros en la llamada al metodo parameters de quark";for(var r in n)a[r]=n[r],t.isDefined(i[r])&&(e.isObservable(a[r])&&e.isObservable(i[r])?e.isComputed(a[r])||(a[r]=i[r]):e.isObservable(a[r])&&!e.isObservable(i[r])?a[r](i[r]):!e.isObservable(a[r])&&e.isObservable(i[r])?a[r]=i[r]():e.isObservable(a[r])||e.isObservable(i[r])||(t.isFunction(a[r])?t.isFunction(i[r])?a[r]=i[r]:console.warn("El parametro "+r+" es un callback por lo que debería especificar una funcion"):a[r]=i[r]))},this.inject=function(n,i){if(t.isDefined(n)&&t.isDefined(i))for(var a in n)if(t.isDefined(i[a])){var r;r=e.isObservable(n[a])?n[a]():n[a],e.isObservable(i[a])?i[a](r):i[a]=r}},this.makeDate=function(e,n){if(t.isDate(e)||(e=new Date(e)),!t.isValidDate(e)){if(n)return void 0;e=new Date}return e},this.call=function(e){if(t.isDefined(e)){var n=Array.prototype.slice.call(arguments,1);return e.apply(n)}return!0}}function r(e,i,t,a,r){var o=i(),s=!1;if(f.isArray(o))for(var d=0;d<o.length;d++)o[d].hasError()||(s=!0);else s=o.hasError();s?n(e).addClass("has-error"):n(e).removeClass("has-error")}function o(n){var i=e.unwrap(n());i()}function s(n,i,t){var a=e.unwrap(n()),r=t.$child,o=a;f.isObject(a)&&f.isDefined(a.data)&&f.isDefined(a.target)&&(r=a.target,o=a.data),f.inject(o,r)}function d(e){var n=function(){return{nodes:e.$componentTemplateNodes}};return n}function l(e,n,i,t,a){var r=function(){for(var e=Array(),n=0;n<a.$parentContext.$componentTemplateNodes.length;n++){var i=a.$parentContext.$componentTemplateNodes[n];if(8===i.nodeType){var t=i.nodeValue.indexOf("vm:")>-1;t&&e.push(i),t=i.nodeValue.indexOf("call:")>-1,t&&e.push(i),t=i.nodeValue.indexOf("inject:")>-1,t&&e.push(i)}}return{nodes:e,"if":e.length>0}};return r}function u(i,t,a,r,o){var s=e.unwrap(t()),d=function(){return f.isInt(s)?{nodes:o.$componentTemplateNodes.slice(s)}:{nodes:n(o.$componentTemplateNodes).filter(s)}};return d}function c(i,t,a,r,o){var s=e.unwrap(t()),d=function(){return n(o.$componentTemplateNodes).filter(s).length>0};return d}a.prototype.dispose=function(){};var f=new a;return e.mapping=i,e.validators={},e.validate=function(n,i){var t=!0;for(var a in n){var r=n[a];e.isObservable(r)&&r.validatable&&(r.validate(i)||(t=!1))}return t},e.validationReset=function(n){for(var i in n){var t=n[i];e.isObservable(t)&&t.validatable&&t.validationReset()}},e.observable.fn.validation=function(n,i,t){return this.validatable=n,this.validationConfig={},this.validationConfig=i,this.hasError=e.observable(),this.validationMessage=e.observable(),t&&(this.parent=t,t.validationSummary||(t.validationSummary=e.observableArray())),this},e.observable.fn.validationReset=function(){var e=this;this.validatable&&(this.hasError(!1),this.validationMessage(""),this.parent&&this.parent.validationSummary.remove(function(n){return n.name===e.validatable}))},e.observable.fn.validateValue=function(n){this.validationReset();for(var i in this.validationConfig){var t=this.validationConfig[i];if(e.validators[i]){var a=e.validators[i](this,t);if(!a.validate(n))return this.parent&&this.parent.validationSummary.push({name:this.validatable,message:this.validationMessage()}),!1}}return!0},e.observable.fn.validate=function(e){return e&&!this.subscription&&(this.subscription=this.subscribe(this.validateValue,this)),this.validateValue(this())},e.isObservableArray=function(n){return e.isObservable(n)&&void 0!==n.indexOf?!0:!1},e.isComputed=function(n){return null===n||void 0===n||void 0===n.__ko_proto__?!1:n.__ko_proto__===e.dependentObservable?!0:e.isComputed(n.__ko_proto__)},e.getJson=function(n){var t=i.toJS(n);for(var a in t)null===t[a]||void 0===t[a]?delete t[a]:"object"==typeof t[a]&&e.getJson(t[a]);var r=i.toJSON(t);return r=r.replace(/\/Date\(\d+\)/g,function(e){return"\\"+e+"\\"})},e.computedParameter=function(n,i,t){return e.isObservable(n)||(n=e.observable(n)),e.computed({read:function(){return i.read(n)},write:function(e){return i.write(n,e)}},t)},e.bindingHandlers.onBind={init:function(n,i,t,a,r){var o=e.unwrap(i());o(n,a,r)}},e.bindingHandlers.formGroupError={init:function(e,n,i,t,a){r(e,n,i,t,a)},update:function(e,n,i,t,a){r(e,n,i,t,a)}},e.bindingHandlers.rowSelect={update:function(n,i,t,a,r){var o=e.unwrap(i()),s=function(){return{success:o.isSelected(a)}};e.bindingHandlers.css.update(n,s,t,a,r);var d=function(){return o.select};e.bindingHandlers.click.init(n,d,t,a,r)}},e.bindingHandlers.numericValue={init:function(n,i){var a=i(),r=e.pureComputed({read:function(){return f.isDefined(a())?t.formatNumber(a(),2,".",","):void 0},write:function(e){var n=a(),i=t.unformat(e,",");isNaN(i)&&(i=e),i!==n?a(t.toFixed(i,2)):e!==n.toString()&&a.valueHasMutated()}});e.applyBindingsToNode(n,{value:r})}},e.bindingHandlers.moneyValue={init:function(n,i){var a=i(),r=e.pureComputed({read:function(){return t.formatMoney(a(),"$ ",2,".",",")},write:function(e){var n=a(),i=t.unformat(e,",");isNaN(i)&&(i=e),i!==n?a(t.toFixed(i,2)):e!==n.toString()&&a.valueHasMutated()}});e.applyBindingsToNode(n,{value:r})}},e.bindingHandlers.vm={init:function(n,i,t,a,r){var o;o=e.unwrap(i());var s;if(f.isString(o)?s=o:f.isObject(o)&&(f.isString(o.property)&&(s=o.property),f.isDefined(o.model)&&(a=o.model)),!f.isString(s))throw"El valor del binding vm debe ser un string con el nombre de la propiedad del objeto donde se debe cargar el viewmodel del componente anidado";if(!f.isDefined(a.childs))throw"El objeto especificado no tiene la propiedad childs. Esto probablemente se deba a que no uso la funcion .components de quark para definir las propiedades en donde el binding vm debe asignar el viewmodel";if(!f.isDefined(a.childs[s]))throw"El objeto especificado no tiene una propiedad de nombre "+o+". Verifique que el objeto contenga una propiedad definida con el metodo .components a la que apunta este binding vm.";a.childs[s].load(s,r.$child)}},e.virtualElements.allowedBindings.vm=!0,e.bindingHandlers.call={init:function(e,n,i,t,a){o(n)},update:function(e,n,i,t,a){o(n)}},e.virtualElements.allowedBindings.call=!0,e.bindingHandlers.inject={init:function(e,n,i,t,a){s(n,t,a)},update:function(e,n,i,t,a){s(n,t,a)}},e.virtualElements.allowedBindings.inject=!0,e.bindingProvider.instance.preprocessNode=function(e){var n=function(n){var i=e.nodeValue.match(n);if(i){var t=document.createComment("ko "+i[1]),a=document.createComment("/ko");return e.parentNode.insertBefore(t,e),e.parentNode.replaceChild(a,e),[t,a]}return!1};if(8===e.nodeType){var i;return i=n(/^\s*(vm\s*:[\s\S]+)/),i=i?i:n(/^\s*(call\s*:[\s\S]+)/),i=i?i:n(/^\s*(inject\s*:[\s\S]+)/)}},e.bindingHandlers.componentShadyDom={init:function(n,i,t,a,r){var o=d(r);return e.bindingHandlers.template.init(n,o,t,r.$parent,r.$parentContext)},update:function(n,i,t,a,r){var o=d(r);return e.bindingHandlers.template.update(n,o,t,r.$parent,r.$parentContext)}},e.virtualElements.allowedBindings.componentShadyDom=!0,e.bindingHandlers.modelExporter={init:function(n,i,t,a,r){var o=l(n,i,t,a,r),s=r.$parentContext.$parentContext.extend({$child:r.$parent,$childContext:r});return e.bindingHandlers.template.init(n,o,t,r.$parent,s)},update:function(n,i,t,a,r){var o=l(n,i,t,a,r),s=r.$parentContext.$parentContext.extend({$child:r.$parent,$childContext:r});return e.bindingHandlers.template.update(n,o,t,r.$parent,s)}},e.virtualElements.allowedBindings.modelExporter=!0,e.bindingHandlers.content={init:function(n,i,t,a,r){var o=u(n,i,t,a,r),s=r.$parentContext.extend({$child:a,$childContext:r});return e.bindingHandlers.template.init(n,o,t,r.$parent,s)},update:function(n,i,t,a,r){var o=u(n,i,t,a,r),s=r.$parentContext.extend({$child:a,$childContext:r});return e.bindingHandlers.template.update(n,o,t,r.$parent,s)}},e.virtualElements.allowedBindings.content=!0,e.bindingHandlers.hasContent={init:function(n,i,t,a,r){var o=c(n,i,t,a,r);return e.bindingHandlers["if"].init(n,o,t,r,r)}},e.virtualElements.allowedBindings.hasContent=!0,e.bindingHandlers.hasNotContent={init:function(n,i,t,a,r){var o=c(n,i,t,a,r);return e.bindingHandlers.ifnot.init(n,o,t,r,r)}},e.virtualElements.allowedBindings.hasNotContent=!0,e.validators.required=function(e,n){return this.validate=function(i){return e.validationReset(),i?!0:(e.hasError(!0),e.validationMessage((n.message||"El campo {0} es obligatorio").replace("{0}",e.validatable)),!1)},this},e.validators.length=function(e,n){return this.validate=function(i){e.validationReset();var t=0;return i&&(t=i.length),n.min&&t<n.min?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe tener al menos {1} caracteres").replace("{0}",e.validatable).replace("{1}",n.min).replace("{2}",n.max)),!1):n.max&&t>n.max?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe tener como maximo {2} caracteres").replace("{0}",e.validatable).replace("{1}",n.min).replace("{2}",n.max)),!1):!0},this},e.validators.numero=function(e,n){return this.validate=function(i){return e.validationReset(),""!==i&&isNaN(i)?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe ser un numero valido").replace("{0}",e.validatable)),!1):!0},this},e.validators.entero=function(e,n){return this.validate=function(i){return e.validationReset(),""!==i&&f.isInt(i)?(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe ser un numero entero valido").replace("{0}",e.validatable)),!1):!0},this},e.validators.fecha=function(e,n){return this.validate=function(i){e.validationReset();var t=/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;return""===i||t.test(i)?!0:(e.hasError(!0),e.validationMessage((n.message||"El campo {0} debe ser una fecha valida").replace("{0}",e.validatable)),!1)},this},"function"==typeof define&&define.amd&&define("knockout",function(){return e}),f});
