/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

	var defaultVisualizationContainer = require("text!default-visualization-template.html");

	function DefaultVisualization() {
		this.$container = $(defaultVisualizationContainer);
		this.$valueField = this.$container.find("#fd-default-value");
	}

	DefaultVisualization.prototype.$container = undefined;
	DefaultVisualization.prototype.$valueField = undefined;

	DefaultVisualization.prototype.addToContainer = function($container) {
		$container.append(this.$container);
	};

	DefaultVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {
		var info = lineInfo.info;
		
		console.log("Info: ", info);
		console.log("Full trace: ", fullTrace);

		var assignTo;

		if (info.assignment || info.declaration) {
			assignTo = (info.assignment || info.declaration).toName;
		}

		console.log("Assigned: ", typeof fullTrace[assignTo]);

		var value = fullTrace[assignTo];
		var valueToDisplay = (value instanceof RegExp) ? value.toString() + " (RegExp)" : JSON.stringify(value);
		this.$valueField.text(assignTo + ": " + valueToDisplay);
	};

	DefaultVisualization.prototype.remove = function() {
		this.$container.remove();
	};

	module.exports = DefaultVisualization;
});