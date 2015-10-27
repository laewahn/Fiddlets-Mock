/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function(require, exports, module) {
	"use strict";

	var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
	var NodeDomain = brackets.getModule("utils/NodeDomain");
	var ContextCollectorDomain = new NodeDomain("ContextCollectorDomain", ExtensionUtils.getModulePath(module, "node_modules/ContextCollector/ContextCollectorDomain"));
	
	exports.generateContextForLine = function(line) {
		console.log("Line: ", line);
		return staticContext();
	};

	function dynamicContext() {
		var deferred = $.Deferred();



		return deferred;
	}

	function staticContext() {
		var deferred = $.Deferred();
		return deferred.resolve(exports.context);
	}

});