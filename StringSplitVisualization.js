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

        this.limitSelect.limitChange(function(newLimit) {
            this.editor.replaceRange(JSON.stringify(newLimit), 
                                     this.parameterPosition.start,
                                     this.parameterPosition.end
            );
        }.bind(this));

        this.limitSelect.selectorHover(
            function() {
                this.parameterMarker = this.editor.markText(this.parameterPosition.start,
                                                            this.parameterPosition.end, 
                                                            { className: "fd-current-line-param-highlight"}
                );
            }.bind(this),
            function() {
                if (this.parameterMarker !== undefined) {
                    this.parameterMarker.clear();
                }
            }.bind(this)
        );

        this.editor = editor;
    }

    StringSplitVisualization.prototype.$container = undefined;
    StringSplitVisualization.prototype.$explainationView = undefined;
    StringSplitVisualization.prototype.$inputView = undefined;
    StringSplitVisualization.prototype.$resultView = undefined;

    StringSplitVisualization.prototype.string = undefined;
    StringSplitVisualization.prototype.currentLineHandle = undefined;
    StringSplitVisualization.prototype.argsAST = undefined;
    StringSplitVisualization.prototype.editor = undefined;
    StringSplitVisualization.prototype.limitSelect = undefined;
    StringSplitVisualization.prototype.parameterMarker = undefined;
    StringSplitVisualization.prototype.parameterPosition = undefined;

    StringSplitVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };
    
    StringSplitVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {
        
        this.string = contextTrace[lineInfo.rValue.callee.name];

        var splitRegExp = contextTrace[lineInfo.rValue.params.values[0].name] || lineInfo.rValue.params.values[0].value;
        var limit = (lineInfo.rValue.params.values[1]) ? lineInfo.rValue.params.values[1].name || lineInfo.rValue.params.values[1].value : undefined;

        var explaination =  "Splits  " + JSON.stringify(this.string) + " at " + splitRegExp.toString() + " and limits the result to " + limit + " elements.";
        this.$explainationView.text(explaination);
        
        var splitted = this.string.split(splitRegExp);
        var limitArgAST = lineInfo.ast.body[0].expression.right.arguments[1];

        var parameterStart = {
            line: this.currentLineHandle.lineNo(), 
            ch: limitArgAST.loc.start.column
        };
        var parameterEnd = {
            line: this.currentLineHandle.lineNo(), 
            ch: limitArgAST.loc.end.column
        };

        this.parameterPosition = {start: parameterStart, end: parameterEnd};

        this.limitSelect.setArray(splitted);
        this.limitSelect.setLimit(limit);
        
        var result = fullTrace[lineInfo.lValue.name];
        this.$resultView.html(JSON.stringify(result));
    };

    StringSplitVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = StringSplitVisualization;
});
