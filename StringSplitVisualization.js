/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

    var stringSplitVisualizationContainer = require("text!string-split-visualization-template.html");

    var Esprima = require("./EsprimaProxy");

    function StringSplitVisualization() {
        this.$container = $(stringSplitVisualizationContainer);
        this.$explainationView = this.$container.find("#explanation-view");
        this.$inputView = this.$container.find("#input-view");
        this.$resultView = this.$container.find("#results-view");
    }

    StringSplitVisualization.prototype.$container = undefined;
    StringSplitVisualization.prototype.$explainationView = undefined;
    StringSplitVisualization.prototype.$inputView = undefined;
    StringSplitVisualization.prototype.$resultView = undefined;

    StringSplitVisualization.prototype.string = undefined;
    StringSplitVisualization.prototype.currentLineHandle = undefined;
    StringSplitVisualization.prototype.argsAST = undefined;
    StringSplitVisualization.prototype.changedCurrentLineCallback = undefined;

    StringSplitVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };

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
        var changedCurrentLineCallback = this.changedCurrentLineCallback;

        var splitHTMLElements = splitted.map(function(e, idx) {
            var styledElement = "<span>" + JSON.stringify(e) + "</span>";
            
            var $element = $("<div></div>");
            $element.data("idx", idx);
            $element.text(JSON.stringify(e));
            $element.mouseenter(function() {
                limitArgAST.value = idx + 1;
                console.log(limitArgAST);
                var changeRange = {
                    start: {
                        line: currentLineHandle.lineNo(), ch: limitArgAST.loc.start.column
                    },
                    end: {
                        line: currentLineHandle.lineNo(), ch: limitArgAST.loc.end.column
                    }
                };
                Esprima.generate(lineInfo.ast)
                .done(function(code) {
                    currentLineHandle.text = code;
                    changedCurrentLineCallback(changeRange);
                }).fail(function(error) {
                    console.error(error);
                });
            });

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
