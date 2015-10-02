/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var VariableTraceProxy = require("./VariableTraceProxy");
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;
    
    var TraceSelector = require("./TraceSelector");
    var StringReplaceVisualization = require("./StringReplaceVisualization");
    var StringSplitVisualization = require("./StringSplitVisualization");

    function StudyEditor(config) {
        InlineWidget.call(this);
        this.config = config;

        this.$widgetContainer = $(widgetContainer);
        this.$htmlContent.append(this.$widgetContainer);

        this.$contextEditor = this.$widgetContainer.find("#context-editor");
        this.$typeField = this.$widgetContainer.find("#type-field");
        this.$visualization = this.$widgetContainer.find("#visualization-container");
        this.$errorView = this.$widgetContainer.find("#error-view");
    }

	var widgetContainer = require("text!inline-widget-template.html");
    
    ExtensionUtils.loadStyleSheet(module, "inline-widget-template.css");
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    StudyEditor.prototype = Object.create(InlineWidget.prototype);
    StudyEditor.prototype.constructor = StudyEditor;
    StudyEditor.prototype.parentClass = InlineWidget.prototype;

    StudyEditor.prototype.contextEditor = undefined;
    StudyEditor.prototype.config = undefined;
    StudyEditor.prototype.currentVisualization = undefined;
    
    StudyEditor.prototype.$widgetContainer = undefined;
    StudyEditor.prototype.$contextEditor = undefined;
    StudyEditor.prototype.$typeField = undefined;
    StudyEditor.prototype.$visualization = undefined;
    StudyEditor.prototype.$errorView = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        this.$typeField.text(this.config.lineInfo.type);
    
        this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
            mode: "javascript",
            lineNumbers: true
        });
        
        this.contextEditor.setValue([this.config.context, this.config.currentLine].join("\n\n"));

        this._createTraceSelectors();
        this._updateCurrentLine();
        this._traceContextCode();

        this.contextEditor.on("change", function() {
            this._traceContextCode();
        }.bind(this));
    };

    StudyEditor.prototype._createTraceSelectors = function() {
        this.contextEditor.eachLine(function(lineHandle) {

            var lineText = lineHandle.text;
            var tagRe = /<#undefined:(\w*)#>/g;
            var tagMatch = tagRe.exec(lineText);

            var tag = "<#undefined#>";
            if (tagMatch !== null && tagMatch[1] !== null) {
                
                // Create a new selector element
                var substitutions = this.config.unknownVariables[tagMatch[1]].map(function(v) {
                    return JSON.stringify(v);
                });

                lineHandle.text = lineText.replace(tagRe, tag);
                var $selector = new TraceSelector(this.contextEditor, lineHandle, substitutions, tag);
                this.$contextEditor.prepend($selector.$element);
            }
        }.bind(this));
    };

    StudyEditor.prototype._updateCurrentLine = function() {
        var currentLineNr = this.contextEditor.lineCount() - 1;

        if(this.config.lineInfo.lValue !== null) {
            var lValueRange = this.config.lineInfo.lValue.range;
            this.contextEditor.markText({ line: currentLineNr, ch: lValueRange[0] },
                                        { line: currentLineNr, ch: lValueRange[1] }, 
                                        { className: "fd-current-line-assigned-to-highlight" }
                                        );
    
        }
        
        var calleeRange = this.config.lineInfo.rValue.callee.range;
        this.contextEditor.markText({ line: currentLineNr, ch: calleeRange[0] },
                                    { line: currentLineNr, ch: calleeRange[1] }, 
                                    { className: "fd-current-line-object-highlight" }
                                    );        
    };

    StudyEditor.prototype._traceContextCode = function() {
        VariableTraceProxy.getTraceForCode(this.contextEditor.getValue())
        .done(function(trace) {
            if (this.currentVisualization !== undefined) {
                this.currentVisualization.remove();
                this.currentVisualization = undefined;
            }
            
            this.$errorView.text("");
            var lineInfo = this.config.lineInfo;
            var visualization;
            if (lineInfo.type === "String.prototype.replace(regexp|substr, newSubStr|function[, flags])") {
                 visualization = new StringReplaceVisualization(lineInfo, trace);
            } else {
                visualization = new StringSplitVisualization(lineInfo, trace);
            }
            visualization.addToContainer(this.$visualization);
            this.currentVisualization = visualization;
            
        }.bind(this))
        .fail(function(error) {
            if (this.currentVisualization !== undefined) {
                this.currentVisualization.remove();
                this.currentVisualization = undefined;
            }

            console.error(error);
            this.$errorView.text(error);
        }.bind(this));
    };

    module.exports = StudyEditor;
});