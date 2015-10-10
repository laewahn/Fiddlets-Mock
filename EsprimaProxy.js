/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function(require, exports, module) {
	"use strict";

	var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
	var NodeDomain = brackets.getModule("utils/NodeDomain");
	var EsprimaDomain = new NodeDomain("EsprimaDomain", ExtensionUtils.getModulePath(module, "node_modules/ContextCollector/EsprimaDomain"));

	exports.parse = function(code, options) {
		var deferred = $.Deferred();

		EsprimaDomain.exec("parse", code, options || {})
		.done(function(result) {
			deferred.resolve(result);
		})
		.fail(function(error) {
			deferred.reject(error);
		});

		return deferred.promise();
	};

	exports.generate = function(ast) {
		var deferred = $.Deferred();

		EsprimaDomain.exec("generate", ast)
		.done(function(code) {
			deferred.resolve(code);
		})
		.fail(function(error) {
			deferred.reject(error);
		});

		return deferred.promise();	
	}

});