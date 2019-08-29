import ko from 'knockout';
import is from './is';
/**
 * If the node is of a comment type, check if the node is a quark-component
 * element.
 * @param {Node} node Comment node to process
 * @return {Node} Node if the element is a quark-component type or undefined
 * if the node is not a quark-component virtual tag
 */
function processQuarkComponentVirtualTag(node) {
  // Allows component definition open with <!-- quark-component -->
  let match = node.nodeValue.match(/^\s*(quark-component[\s\S]+)/);
  if (match) {
    node.data = ' ko component: { name: \'quark-component\' } ';
    return node;
  }

  // Allows component definition close with <!-- /quark-component -->
  match = node.nodeValue.match(/^\s*(\/quark-component[\s\S]+)/);
  if (match) {
    node.data = ' /ko ';
    return node;
  }
}
/**
 * Convert the component tag to its virtual representation
 * @param {string} nodeName Name of the node
 * @param {Node} node Node to convert
 * @return {Array} Converted nodes
 */
function convertNodeToVirtual(nodeName, node) {
  const params = node.attributes['params'];
  const bind = node.attributes['data-bind'];
  const modelBind = node.attributes['model-bind'];

  let comment = ' ko component: { name: \'' + nodeName + '\' ';

  if (params) {
    const directParamRegExp = /^\$\{(.+)\}$/;
    const directParamMatch = params.value.match(directParamRegExp);

    if (directParamMatch) {
      comment += ', params: ' + directParamMatch[1] + ' ';
    } else {
      comment += ', params: { ' + params.value + ' } ';
    }
  } else {
    comment += ', params: {}';
  }

  comment += ' } ';

  if (bind) {
    comment += ', ' + bind.value + ' ';
  }

  if (modelBind) {
    comment += ', model-bind: "' + modelBind.value + '"';
  }

  const openTag = document.createComment(comment);
  const closeTag = document.createComment(' /ko ');

  node.parentNode.insertBefore(closeTag, node.nextSibling);
  node.parentNode.replaceChild(openTag, node);

  while (node.childNodes.length > 0) {
    openTag.parentNode.insertBefore(node.childNodes[0], closeTag);
  }

  return [openTag, closeTag];
}

/**
 * This node preprocessor allows to use the quark-component in a
 * virtual tag form.
 * Also it transform custom element tags with the virtual attribute
 * into knockout component virtual tag.
 * Both useful when the css flow doesn't allow the quark-component or
 * component tag to be present.
 * @param {Node} node Node to process
 * @return {Node} Modified node
 */
ko.bindingProvider.instance.preprocessNode = function(node) {
  // Only react if this is a comment node of the form <!-- quark-component -->
  if (node.nodeType == 8) {
    const quarkComponentTag = processQuarkComponentVirtualTag(node);
    if (is.defined(quarkComponentTag)) {
      return quarkComponentTag;
    }
  }

  const nodeName = node && node.nodeName && node.nodeName.toLowerCase();
  if (ko.components.isRegistered(nodeName)) {
    if (node.attributes['virtual']) {
      return convertNodeToVirtual(nodeName, node);
    }
  }
};
