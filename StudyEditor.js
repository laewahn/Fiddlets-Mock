/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var VariableTrace = require("./VariableTraceProxy");
    var Esprima = require("./EsprimaProxy");
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;
    
    var TraceSelector = require("./TraceSelector");
    var DefaultVisualization = require("./DefaultVisualization");
    var StringReplaceVisualization = require("./StringReplaceVisualization");
    var StringSplitVisualization = require("./StringSplitVisualization");

    function StudyEditor(config) {
        InlineWidget.call(this);
        this.config = config;
        this.traceSelectorsByLine = {};

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
    StudyEditor.prototype.lineInfo = undefined;

    StudyEditor.prototype.contextCode = undefined;
    StudyEditor.prototype.currentLineCode = undefined;
    StudyEditor.prototype.traceSelectorsByLine = undefined;

    StudyEditor.prototype.$widgetContainer = undefined;
    StudyEditor.prototype.$contextEditor = undefined;
    StudyEditor.prototype.$typeField = undefined;
    StudyEditor.prototype.$visualization = undefined;
    StudyEditor.prototype.$errorView = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        this.$typeField.text(this.config.lineInfo.info);
    
        this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
            mode: "javascript",
            lineNumbers: true
        });
        
        this._getContext();
        this._getCurrentLine();
        
        this.contextEditor.setValue([this.contextCode, this.currentLineCode].join("\n\n"));

        this._createTraceSelectors();
        this._updateUnknownValuesInContextCode();
        this._updateCurrentLine();
        this._updateVisualization();
        this._updateLineInfo();
        this._traceAll();

        this.contextEditor.on("change", function() {
            this._updateUnknownValuesInContextCode();
            this._traceAll();
        }.bind(this));
    };

    StudyEditor.prototype._getContext = function() {
        // Call the context domain
        // well, fake it by loading from the config...
        this.contextCode = this.config.context || "";
    };

    StudyEditor.prototype._getCurrentLine = function() {
        // Will get this from the editor
        this.currentLineCode = this.config.currentLine;

        // Will call this on the line info domain
        this.lineInfo = this.config.lineInfo;
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
                this.traceSelectorsByLine[lineHandle.lineNo()] = $selector;
            }
        }.bind(this));
    };

    StudyEditor.prototype._updateUnknownValuesInContextCode = function() {
        this.contextCode = this.contextEditor.getRange({line: this.contextEditor.firstLine(), ch: 0},
                                                       {line: this.contextEditor.lastLine() - 1, ch: 0});

        var updatedContextCode = this.contextCode.split("\n").map(function(line, idx) {
            var traceSelector = this.traceSelectorsByLine[idx];
            if (traceSelector === undefined) {
                return line;
            }

            var updatedLine = traceSelector.lineHandle.text;
            traceSelector.updatePosition();
            return updatedLine; 
        }.bind(this));

        this.contextCode = updatedContextCode.join("\n");
    };

    StudyEditor.prototype._updateCurrentLine = function() {
        var currentLineNr = this.contextEditor.lastLine();

        if(this.config.lineInfo.lValue !== null) {
            var lValueRange = this.config.lineInfo.lValue.range;
            this.contextEditor.markText({ line: currentLineNr, ch: lValueRange[0] },
                                        { line: currentLineNr, ch: lValueRange[1] }, 
                                        { className: "fd-current-line-assigned-to-highlight" }
                                        );
    
        }
        
        if(this.config.lineInfo.rValue !== null) {
            var calleeRange = this.config.lineInfo.rValue.callee.range;
            this.contextEditor.markText({ line: currentLineNr, ch: calleeRange[0] },
                                        { line: currentLineNr, ch: calleeRange[1] }, 
                                        { className: "fd-current-line-object-highlight" }
                                        );
        }
    };

    StudyEditor.prototype._updateVisualization = function() {
        if (this.currentVisualization !== undefined) {
            this.currentVisualization.remove();
            this.currentVisualization = undefined;
        }
        
        this.$errorView.text("");
        var lineInfo = this.config.lineInfo;
        var visualization;

        if (lineInfo.info === "String.prototype.replace(regexp|substr, newSubStr|function[, flags])") {
             visualization = new StringReplaceVisualization();
        } else {
            visualization = new StringSplitVisualization();
        }

        switch(lineInfo.info) {
            case "String.prototype.split([separator[, limit]])" :
                visualization =  new StringSplitVisualization();
                break;
            case "String.prototype.replace(regexp|substr, newSubStr|function[, flags])" :
                visualization = new StringReplaceVisualization();
                break;
            default:
                visualization = new DefaultVisualization();
        }

        
        visualization.addToContainer(this.$visualization);
        this.currentVisualization = visualization;
    };

    StudyEditor.prototype._updateLineInfo = function() {
        var lineInfo = this.config.lineInfo;
        this.currentVisualization.lineInfo = lineInfo;
    };

    StudyEditor.prototype._traceAll = function() {
        var traceContext = VariableTrace.getTraceForCode(this.contextCode);
        var traceCode = VariableTrace.getTraceForCode(this.contextEditor.getValue());
        var getAST = Esprima.parse(this.currentLineCode);

        $.when(traceContext, traceCode, getAST)
        .done(function(contextTrace, fullTrace, ast) {
            this.currentVisualization.updateVisualization(fullTrace, contextTrace, this.lineInfo);
            console.log(JSON.stringify(ast, null, 2));
        }.bind(this))
        .fail(function(error) {
            console.error(error);
        });
    };

    module.exports = StudyEditor;
});