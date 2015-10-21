/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

	var mapVisualizationContainer = require("text!map-visualization-template.html");

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "map-visualization-template.css");

    function MapVisualization() {
        this.$container = $(mapVisualizationContainer);
        this.$beforeView = this.$container.find("#before-view");
        this.$afterView = this.$container.find("#after-view");
    }

    MapVisualization.prototype.$container = undefined;
    MapVisualization.prototype.$beforeView = undefined;
    MapVisualization.prototype.$afterView = undefined;

    MapVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };

    MapVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {
        console.log("Line info", lineInfo);
        console.log("Max width: " + this.$container.width());
        this.$beforeView.empty();
        var arrayName = lineInfo.info.functionCall.callee.name;
        var arrayBefore = contextTrace[arrayName];

        var assigneeName = (lineInfo.info.declaration || lineInfo.info.assignment).toName;
        var arrayAfter = fullTrace[assigneeName];

        arrayBefore.forEach(function(e, idx) {
            var $row = $("<div></div>").addClass("fd-map-row");
            $row.css({
                "float" : "none"
            });
            
            var $elementBefore = $("<div></div>").addClass("fd-map-element-before")
                .addClass("fd-current-line-object-highlight");
            var $elementBeforeContent = $("<pre></pre>");
            $elementBeforeContent.text(JSON.stringify(e, null, 2));
            $elementBefore.append($elementBeforeContent);
            $row.append($elementBefore);

            var $elementAfter = $("<div></div>").addClass("fd-map-element-after")
                .addClass("fd-current-line-assigned-to-highlight");
            var $elementAfterContent = $("<pre></pre>");
            $elementAfterContent.text(JSON.stringify(arrayAfter[idx], null, 2));
            $elementAfter.append($elementAfterContent);
            $row.append($elementAfter);

            this.$beforeView.append($row);
        }, this);
        console.log("Before map", arrayBefore);
        
        console.log("After map", fullTrace);
    };

    MapVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = MapVisualization;
});
