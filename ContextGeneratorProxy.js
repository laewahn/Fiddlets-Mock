/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function(require, exports, module) {
	"use strict";


	exports.generateContextForLine = function(lineNr, source) {
		var deferred = $.Deferred();
		return deferred.resolve(exports.context);
		// return deferred.promise();
	};

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