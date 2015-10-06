/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

	var defaultVisualizationContainer = require("text!default-visualization-template.html");

	function DefaultVisualization() {
		this.$container = $(defaultVisualizationContainer);
	}

	DefaultVisualization.prototype.$container = undefined;

	DefaultVisualization.prototype.addToContainer = function($container) {
		$container.append(this.$container);
	};

	DefaultVisualization.prototype.updateVisualization = function() {};

	DefaultVisualization.prototype.remove = function() {
		this.$container.remove();
	}

	module.exports = DefaultVisualization;
});