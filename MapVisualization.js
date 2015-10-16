/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

	var mapVisualizationContainer = require("text!string-replace-visualization-template.html");

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "map-visualization-template.css");

    function MapVisualization() {
        this.$container = $(mapVisualizationContainer);
    }

    MapVisualization.prototype.$container = undefined;

    MapVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };

    MapVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {

    };

    MapVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = MapVisualization;
});
