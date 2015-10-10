/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

    var stringSplitVisualizationContainer = require("text!string-split-visualization-template.html");

    function StringSplitVisualization(editor) {
        this.$container = $(stringSplitVisualizationContainer);
        this.$explainationView = this.$container.find("#explanation-view");
        this.$inputView = this.$container.find("#input-view");
        this.$resultView = this.$container.find("#results-view");

        this.editor = editor;
    }

    StringSplitVisualization.prototype.$container = undefined;
    StringSplitVisualization.prototype.$explainationView = undefined;
    StringSplitVisualization.prototype.$inputView = undefined;
    StringSplitVisualization.prototype.$resultView = undefined;

    StringSplitVisualization.prototype.string = undefined;
    StringSplitVisualization.prototype.currentLineHandle = undefined;
    StringSplitVisualization.prototype.argsAST = undefined;
    StringSplitVisualization.prototype.changedCurrentLineCallback = undefined;
    StringSplitVisualization.prototype.editor = undefined;

    StringSplitVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };
    
    var marker;
    
    StringSplitVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {
        this.$inputView.empty();
        this.string = contextTrace[lineInfo.rValue.callee.name];

        var splitRegExp = contextTrace[lineInfo.rValue.params.values[0].name] || lineInfo.rValue.params.values[0].value;
        var limit = (lineInfo.rValue.params.values[1]) ? lineInfo.rValue.params.values[1].name || lineInfo.rValue.params.values[1].value : undefined;

        var explaination =  "Splits  " + JSON.stringify(this.string) + " at " + splitRegExp.toString() + " and limits the result to " + limit + " elements.";
        this.$explainationView.text(explaination);
        
        var splitted = this.string.split(splitRegExp);
        var limitArgAST = lineInfo.ast.body[0].expression.right.arguments[1];
        
        var currentLineHandle = this.currentLineHandle;
        var contextEditor = this.editor;

        var splitHTMLElements = splitted.map(function(e, idx) {
            var $element = $("<div></div>");
            $element.data("idx", idx);
            $element.text(JSON.stringify(e));

            function updateAndHighlightParameter() {
                if ((idx + 1) === limit) {
                    return;
                }

                limitArgAST.value = idx + 1;
                var changeRange = {
                    start: {
                        line: currentLineHandle.lineNo(), ch: limitArgAST.loc.start.column
                    },
                    end: {
                        line: currentLineHandle.lineNo(), ch: limitArgAST.loc.end.column
                    }
                };
                contextEditor.replaceRange(JSON.stringify(limitArgAST.value), changeRange.start, changeRange.end);
                marker = contextEditor.markText(changeRange.start, changeRange.end, { className: "fd-current-line-param-highlight"});
            }

            function removeParameterHighlight() {
                if (marker !== undefined) {
                    marker.clear();
                }
            }

            $element.hover(updateAndHighlightParameter, removeParameterHighlight);
            
            if (idx < limit) {
                $element.css({
                    "background-color" : "#00ff00"
                });
            }

            return $element;
        });

        this.$inputView.append(splitHTMLElements);
        
        var result = fullTrace[lineInfo.lValue.name];
        this.$resultView.html(JSON.stringify(result));
    };

    StringSplitVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = StringSplitVisualization;
});
