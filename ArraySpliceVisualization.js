/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

    var arraySpliceVisualizationContainer = require("text!array-splice-visualization-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "array-splice-visualization-template.css");

    var ArrayViz = require("./ArrayViz");

    function ArraySpliceVisualization(editor) {
        this.$container = $(arraySpliceVisualizationContainer);

        this.$removed = this.$container.find("#fd-array-splice-removed");
        this.$input = this.$container.find("#fd-array-splice-input");
        this.$updated = this.$container.find("#fd-array-splice-updated");
    }

    ArraySpliceVisualization.prototype.$container = undefined;
    ArraySpliceVisualization.prototype.$removed = undefined;
    ArraySpliceVisualization.prototype.$input = undefined;
    ArraySpliceVisualization.prototype.$updated = undefined;

    ArraySpliceVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);

        this.$removed.addClass("fd-array-splice-floating-element");
        this.$input.addClass("fd-array-splice-floating-element");
        this.$updated.addClass("fd-array-splice-floating-element");
    };
    
    ArraySpliceVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {
        console.log("LineInfo: ", lineInfo);
        console.log("ContextTrace: ", contextTrace);
        console.log("FullTrace: ", fullTrace);
        if (lineInfo.type.indexOf("Declaration") !== -1) {
            var removedArray = fullTrace[lineInfo.lValue.name];
            var removedViz = new ArrayViz(this.$removed, removedArray, "fd-current-line-assigned-to-highlight");
        }

        var inputArray = contextTrace[lineInfo.rValue.callee.name];
        var inputViz = new ArrayViz(this.$input, inputArray, "fd-current-line-object-highlight");
        
        var removedPosition = lineInfo.rValue.params.values[0].value;
        var removedLength = lineInfo.rValue.params.values[1].value;
        inputViz.setHighlightForRange("fd-current-line-assigned-to-highlight", [removedPosition, removedPosition + removedLength]);

        var updatedArray = fullTrace[lineInfo.rValue.callee.name];
        var updatedViz = new ArrayViz(this.$updated, updatedArray, "fd-current-line-object-highlight");

        var addedPosition = lineInfo.rValue.params.values[0].value;
        var addedLength = lineInfo.rValue.params.values.length - 2;
        updatedViz.setHighlightForRange("fd-array-splice-added", [addedPosition, addedPosition + addedLength]);
    };

    ArraySpliceVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = ArraySpliceVisualization;
});
