/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function(require, exports, module) {
	"use strict";

	var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
	var NodeDomain = brackets.getModule("utils/NodeDomain");
	var LineInfoDomain = new NodeDomain("LineInfoDomain", ExtensionUtils.getModulePath(module, "node_modules/ContextCollector/LineInfoDomain"));

	exports.infoForLine = function(line) {
		var deferred = $.Deferred();

		LineInfoDomain.exec("infoForLine", line)
		.done(function(result) {
			deferred.resolve(result);
		})
		.fail(function(error) {
			deferred.reject(error);
		});

		return deferred.promise();
	};

});