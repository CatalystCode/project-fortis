// Adapted from https://www.quaxio.com/html_white_listed_sanitizer/
function HtmlWhitelistedSanitizer(nodeProcessorCallback, sanitizerOpts) {
  let { escape, tags, css, urls } = sanitizerOpts || {};

  this.nodeProcessorCallback = nodeProcessorCallback || function(node) { return node; };
  this.escape = escape;
  this.allowedTags = tags;
  this.allowedCss = css;

  // Use the browser to parse the input but create a new HTMLDocument.
  // This won't evaluate any potentially dangerous scripts since the element
  // isn't attached to the window's document. It also won't cause img.src to
  // preload images.
  //
  // To be extra cautious, you can dynamically create an iframe, pass the
  // input to the iframe and get back the sanitized string.
  this.doc = document.implementation.createHTMLDocument();

  if (urls == null) {
    urls = ['http://', 'https://'];
  }

  if (this.allowedTags == null) {
    // Configure small set of default tags
    let unconstrainted = function(x) { return x; };
    let globalAttributes = {
      'dir': unconstrainted,
      'lang': unconstrainted,
      'title': unconstrainted
    };
    let url_sanitizer = HtmlWhitelistedSanitizer.makeUrlSanitizer(urls);
    this.allowedTags = {
      'a': HtmlWhitelistedSanitizer.mergeMap(globalAttributes, {
          'download': unconstrainted,
          'href': url_sanitizer,
          'hreflang': unconstrainted,
          'ping': url_sanitizer,
          'rel': unconstrainted,
          'target': unconstrainted,
          'type': unconstrainted
        }),
      'img': HtmlWhitelistedSanitizer.mergeMap(globalAttributes, {
          'alt': unconstrainted,
          'height': unconstrainted,
          'src': url_sanitizer,
          'width': unconstrainted
        }),
      'p': globalAttributes,
      'div': globalAttributes,
      'span': globalAttributes,
      'br': globalAttributes,
      'b': globalAttributes,
      'i': globalAttributes,
      'u': globalAttributes
    };
  }
  if (this.allowedCss == null) {
    // Small set of default css properties
    this.allowedCss = ['border', 'margin', 'padding'];
  }
}

HtmlWhitelistedSanitizer.makeUrlSanitizer = function(allowed_urls) {
  return function(str) {
    if (!str) { return ''; }
    for (let i in allowed_urls) { // eslint-disable-line guard-for-in
      if (str.startsWith(allowed_urls[i])) {
        return str;
      }
    }
    return '';
  };
}

HtmlWhitelistedSanitizer.mergeMap = function(/*...*/) {
  let r = {};
  for (let arg in arguments) { // eslint-disable-line guard-for-in
    for (let i in arguments[arg]) { // eslint-disable-line guard-for-in
      r[i] = arguments[arg][i];
    }
  }
  return r;
}

HtmlWhitelistedSanitizer.prototype.sanitizeString = function(input) {
  let div = this.doc.createElement('div');
  div.innerHTML = input;

  // Return the sanitized version of the node.
  return this.sanitizeNode(div).innerHTML;
}

HtmlWhitelistedSanitizer.prototype.sanitizeNode = function(node) {
  // Note: <form> can have it's nodeName overriden by a child node. It's
  // not a big deal here, so we can punt on this.
  let node_name = node.nodeName.toLowerCase();
  if (node_name === '#text') {
    // text nodes are always safe
    return this.nodeProcessorCallback(node);
  }
  if (node_name === '#comment') {
    // always strip comments
    return this.doc.createTextNode('');
  }
  if (!this.allowedTags.hasOwnProperty(node_name)) {
    // this node isn't allowed
    if (this.escape) {
      return this.doc.createTextNode(node.outerHTML);
    }
    return this.doc.createTextNode('');
  }

  // create a new node
  let copy = this.doc.createElement(node_name);

  // copy the whitelist of attributes using the per-attribute sanitizer
  for (let n_attr=0; n_attr < node.attributes.length; n_attr++) {
    let attr = node.attributes.item(n_attr).name;
    if (this.allowedTags[node_name].hasOwnProperty(attr)) {
      let sanitizer = this.allowedTags[node_name][attr];
      copy.setAttribute(attr, sanitizer(node.getAttribute(attr)));
    }
  }
  // copy the whitelist of css properties
  for (let css in this.allowedCss) { // eslint-disable-line guard-for-in
    copy.style[this.allowedCss[css]] = node.style[this.allowedCss[css]];
  }

  // recursively sanitize child nodes
  while (node.childNodes.length > 0) {
    let child = node.removeChild(node.childNodes[0]);
    copy.appendChild(this.sanitizeNode(child));
  }
  return this.nodeProcessorCallback(copy);
}

export function sanitize(html, nodeProcessorCallback) {
  const sanitizer = new HtmlWhitelistedSanitizer(nodeProcessorCallback, {escape: true});
  return sanitizer.sanitizeString(html);
}
