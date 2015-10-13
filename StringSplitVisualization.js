/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

    var stringSplitVisualizationContainer = require("text!string-split-visualization-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "string-split-visualization-template.css");
    
    var LimitSelect = require("./LimitSelect");

    function StringSplitVisualization(editor) {
        this.$container = $(stringSplitVisualizationContainer);
        this.$explainationView = this.$container.find("#explanation-view");
        this.$inputView = this.$container.find("#input-view");
        this.$resultView = this.$container.find("#results-view");

        this.limitSelect = new LimitSelect(this.$inputView);
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
    StringSplitVisualization.prototype.limitSelect = undefined;

    StringSplitVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };
    
    // NOTE: This should not be a global variable, but it might go away with a more advanced limit selector.
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

            var $selector = $("<div></div>").addClass("fd-sel");
            var $data = $("<div></div>").addClass("fd-data");

            $element.append($selector);
            $element.append($data);

            if (idx + 1 === limit) {
                $selector.text(">");
                $selector.addClass("fd-dragable");
            } else {
                $selector.removeClass("fd-dragable");
                if (idx + 1 < limit) {
                   $selector.text("|");
                } else {
                    $selector.html("&nbsp;");
                }
            }

            $element.data("idx", idx);
            $data.text(JSON.stringify(e));

            var parameterRange = {
                start: {
                    line: currentLineHandle.lineNo(), ch: limitArgAST.loc.start.column
                },
                end: {
                    line: currentLineHandle.lineNo(), ch: limitArgAST.loc.end.column
                }
            };
            function hightlightParameter() {
                marker = contextEditor.markText(parameterRange.start, parameterRange.end, { className: "fd-current-line-param-highlight"});
            }

            function updateAndHighlightParameter() {
                if ((idx + 1) === limit) {
                    return;
                }

                limitArgAST.value = idx + 1;
                
                contextEditor.replaceRange(JSON.stringify(limitArgAST.value), parameterRange.start, parameterRange.end);
                hightlightParameter();
            }

            function removeParameterHighlight() {
                if (marker !== undefined) {
                    marker.clear();
                }
            }

            $selector.hover(updateAndHighlightParameter, removeParameterHighlight);
            
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
