/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

    var arraySpliceVisualizationContainer = require("text!array-splice-visualization-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "array-splice-visualization-template.css");

    var ArrayViz = require("./ArrayViz");
    var RangeSelect = require("./RangeSelect");

    function ArraySpliceVisualization(editor) {
        this.$container = $(arraySpliceVisualizationContainer);
        this.editor = editor;

        this.$removed = this.$container.find("#fd-array-splice-removed");
        this.$input = this.$container.find("#fd-array-splice-input");
        this.$updated = this.$container.find("#fd-array-splice-updated");

        this.removedViz = new ArrayViz(this.$removed, [], "fd-current-line-assigned-to-highlight");
        this.inputViz = new RangeSelect(this.$input, "fd-current-line-object-highlight");
        this.updatedViz = new ArrayViz(this.$updated, [], "fd-current-line-object-highlight");

        this.inputViz.limitChange(function(newLimit) {
            this.editor.replaceRange(JSON.stringify(newLimit),
                this.removedLengthPosition.start,
                this.removedLengthPosition.end
            );
        }.bind(this));
    }

    ArraySpliceVisualization.prototype.$container = undefined;
    ArraySpliceVisualization.prototype.$removed = undefined;
    ArraySpliceVisualization.prototype.$input = undefined;
    ArraySpliceVisualization.prototype.$updated = undefined;

    ArraySpliceVisualization.prototype.editor = undefined;
    ArraySpliceVisualization.prototype.currentLineHandle = undefined;

    ArraySpliceVisualization.prototype.removedViz = undefined;
    ArraySpliceVisualization.prototype.inputViz = undefined;
    ArraySpliceVisualization.prototype.updatedViz = undefined;

    ArraySpliceVisualization.prototype.removedStartPosition = undefined;
    ArraySpliceVisualization.prototype.removedLengthPosition = undefined;

    ArraySpliceVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);

        this.$removed.addClass("fd-array-splice-floating-element");
        this.$input.addClass("fd-array-splice-floating-element");
        this.$updated.addClass("fd-array-splice-floating-element");
    };
    
    ArraySpliceVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {
        // console.log("LineInfo: ", lineInfo);
        // console.log("ContextTrace: ", contextTrace);
        // console.log("FullTrace: ", fullTrace);
        
        this.removedViz.resetHighlights();
        // this.inputViz.resetHighlights();
        this.updatedViz.resetHighlights();

        if (lineInfo.type.indexOf("Declaration") !== -1) {
            var removedArray = fullTrace[lineInfo.lValue.name];
            this.removedViz.setArray(removedArray);
        }

        var inputArray = contextTrace[lineInfo.rValue.callee.name];
        this.inputViz.setArray(inputArray);

        var removedLengthAST = lineInfo.ast.body[0].declarations[0].init.arguments[1];
        var removedLength = lineInfo.rValue.params.values[1].value;
        this.removedLengthPosition = {start: {
            line: this.currentLineHandle.lineNo(),
            ch: removedLengthAST.loc.start.column
        }, end: {
            line: this.currentLineHandle.lineNo(),
            ch: removedLengthAST.loc.end.column
        }};
        this.inputViz.setLimit(removedLength);
        // this.inputViz.setHighlightForRange("fd-current-line-assigned-to-highlight", [removedPosition, removedPosition + removedLength]);
        var removedPosition = lineInfo.rValue.params.values[0].value;
        this.inputViz.setStart(removedPosition);
        
        var updatedArray = fullTrace[lineInfo.rValue.callee.name];
        this.updatedViz.setArray(updatedArray);

        var addedPosition = lineInfo.rValue.params.values[0].value;
        var addedLength = lineInfo.rValue.params.values.length - 2;
        this.updatedViz.setHighlightForRange("fd-array-splice-added", [addedPosition, addedPosition + addedLength]);
    };

    ArraySpliceVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = ArraySpliceVisualization;
});
