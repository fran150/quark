import ko from 'knockout';
import is from './is';
import utils from './utils';
import serviceContext from './service-context';
import Tracker from './tracker';

/**
 * Defines a quark component.
 * @param {string} namespace Namespace of the component
 * @param {string} tag Tag of the component
 * @param {any} ViewModel ViewModel of the component
 * @param {string} view HTML view of the component
 */
export default function(namespace, tag, ViewModel, view) {
  // If only one parameter is specified we assume that is view only component
  if (!is.defined(view)) {
    view = ViewModel;
    utils.undefine(ViewModel);
  }

  /**
   * ViewModel constructor function
   * @param {any} p Parameters received by the component
   */
  function Model(p) {
    // Component's model
    let model;
    // Creates empty scope
    const $scope = {};

    let $context;

    // Creates an empty imports object
    const $imports = new Tracker();

    // If theres a model defined
    if (ViewModel && !model) {
      $context = serviceContext(p);

      // Creates the model passing the received parameters an empty
      // scope and the tracker object
      model = new ViewModel(p, $scope, $imports, $context);

      // Sets the tracker main model
      $imports.setMainModel(model);
      $imports.ready.force();

      // Calls the function initComponent if exists
      if ($imports && is.function($imports.initComponent)) {
        $imports.initComponent();
      }

      // Adds the created model to the scope.
      $scope.model = model;
      // Add the imported objects to the scope
      $scope.imports = $imports;
      // Adds the context to the scope
      $scope.context = $context;
    }

    // Creates model, scope and error handlers getters.
    // This are used by quark to access each element.
    this.getModel = function() {
      return model;
    };

    this.getScope = function() {
      return $scope;
    };

    this.getImports = function() {
      return $imports;
    };

    // When the component is disposed Knockout calls this method.
    // We use it to dispose all objects.
    this.dispose = function() {
      // If theres a model defined and has a dispose method call it
      if (model && model.dispose) {
        model.dispose();
      }

      // If theres an scope defined and has a dispose method call it
      if ($scope && $scope.dispose) {
        $scope.dispose();
      }

      // If there's an imports object dispose it
      if ($imports) {
        $imports.dispose();
      }
    };
  }

  let config;

  // Return the module definition and ViewModel as needed by knockout.
  if (ViewModel) {
    config = {
      template: view,
      viewModel: Model,
      modelType: ViewModel,
    };
  } else {
    config = {
      template: view,
    };
  }

  const fullName = namespace + '-' + tag;
  ko.components.register(fullName, config);

  if (ko.components.isRegistered(tag)) {
    let msg = 'Theres a component with the tag {tag}.';
    msg += 'Use the fully qualified tag for the component: {full} ';
    msg += 'to avoid clashes';

    console.warn(utils.formatString(msg, {
      tag: tag,
      full: fullName,
    }));
  } else {
    ko.components.register(tag, config);
  }
};
