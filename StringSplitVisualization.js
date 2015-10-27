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

        this.limitSelect = new LimitSelect(this.$inputView, "fd-current-line-assigned-to-highlight");

        this.limitSelect.limitChange(function(newLimit) {
            if (this.parameterPosition !== undefined) {
                this.editor.replaceRange(JSON.stringify(newLimit), 
                                     this.parameterPosition.start,
                                     this.parameterPosition.end
                );
            }
            
        }.bind(this));

        this.limitSelect.selectorHover(
            function() {
                if (this.parameterPosition !== undefined) {
                    this.parameterMarker = this.editor.markText(this.parameterPosition.start,
                                                            this.parameterPosition.end, 
                                                            { className: "fd-current-line-param-highlight"}
                    );
                }
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

        this.string = contextTrace[lineInfo.info.functionCall.callee.name];

        var splitRegExp = contextTrace[lineInfo.info.functionCall.params[0].name] || lineInfo.info.functionCall.params[0].value;
        var limit = (lineInfo.info.functionCall.params[1]) ? (lineInfo.info.functionCall.params[1].name || lineInfo.info.functionCall.params[1].value) : undefined;

        var explaination =  "Splits  " + JSON.stringify(this.string) + " at " + splitRegExp.toString() + " and limits the result to " + limit + " elements.";
        if (limit) {
            explaination += " and limits the result to " + limit + " elements.";
        }

        this.$explainationView.text(explaination);
        
        var splitted = this.string.split(splitRegExp);

        if (limit !== undefined) {
            var limitArgRange = lineInfo.info.functionCall.params[1].range;
            var parameterStart = {
                line: this.currentLineHandle.lineNo(), 
                ch: limitArgRange[0]
            };
            var parameterEnd = {
                line: this.currentLineHandle.lineNo(), 
                ch: limitArgRange[1]
            };
    
            this.parameterPosition = {start: parameterStart, end: parameterEnd};
            this.limitSelect.selectorsVisible = true;
        } else {
            limit = splitted.length;
            this.limitSelect.selectorsVisible = false;
        }
        

        this.limitSelect.setArray(splitted);
        this.limitSelect.setLimit(limit);
        
        var result = fullTrace[(lineInfo.info.assignment || lineInfo.info.initialisation).toName];
        this.$resultView.html(JSON.stringify(result));
    };

    StringSplitVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = StringSplitVisualization;
});
