/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function(require, exports, module) {
	"use strict";

	var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
	var NodeDomain = brackets.getModule("utils/NodeDomain");
	var ContextCollectorDomain = new NodeDomain("ContextCollectorDomain", ExtensionUtils.getModulePath(module, "node_modules/ContextCollector/ContextCollectorDomain"));
	
	exports.generateContextForLine = function(line, source) {
		console.log("Line: ", line);
		return dynamicContext(line + 1, source);
	};

	function dynamicContext(line, source) {
		var deferred = $.Deferred();

		ContextCollectorDomain.exec("contextForLine", line, source)
		.done(function(context) {
			console.log(context);
			deferred.resolve(context);
		})
		.fail(function(error) {
			deferred.reject(error);
		});

		return deferred;
	}

	function staticContext() {
		var deferred = $.Deferred();
		return deferred.resolve(exports.context);
	}

});