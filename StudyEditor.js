/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");

    var VariableTrace = require("./VariableTraceProxy");
    var Esprima = require("./EsprimaProxy");
    var LineInfo = require("./LineInfoProxy");

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
    StudyEditor.prototype.currentLineHandle = undefined;
    StudyEditor.prototype.traceSelectorsByLine = undefined;

    StudyEditor.prototype.$widgetContainer = undefined;
    StudyEditor.prototype.$contextEditor = undefined;
    StudyEditor.prototype.$typeField = undefined;
    StudyEditor.prototype.$visualization = undefined;
    StudyEditor.prototype.$errorView = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        this.$typeField.text(this.config.info);
    
        this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
            mode: "javascript",
            lineNumbers: true
        });
        
        this._getContext();
        
        this.contextEditor.setValue([this.contextCode, this.currentLineCode].join("\n\n"));

        this.currentLineHandle = this.contextEditor.getLineHandle(this.contextEditor.lastLine());

        this._createTraceSelectors();
        this._updateUnknownValuesInContextCode();
        this._initializeVisualization();
        
        this._traceAndUpdate();

        this.contextEditor.on("change", function() {
            this._updateUnknownValuesInContextCode();
            this._traceAndUpdate();
        }.bind(this));
    };

    StudyEditor.prototype._getContext = function() {
        // Call the context domain
        // well, fake it by loading from the config...
        this.contextCode = this.config.context || "";
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

    StudyEditor.prototype._initializeVisualization = function() {
        if (this.currentVisualization !== undefined) {
            this.currentVisualization.changedCurrentLineCallback = undefined;
            this.currentVisualization.remove();
            this.currentVisualization = undefined;
        }
        
        this.$errorView.text("");
        var info = this.config.info;
        var visualization;

        switch(info) {
            case "String.prototype.split([separator[, limit]])" :
                visualization =  new StringSplitVisualization();
                break;
            case "String.prototype.replace(regexp|substr, newSubStr|function[, flags])" :
                visualization = new StringReplaceVisualization();
                break;
            default:
                visualization = new DefaultVisualization();
        }

        visualization.currentLineHandle = this.currentLineHandle;
        visualization.changedCurrentLineCallback = function(range) {
            console.log(range);
            this.contextEditor.markText(range.start, range.end,
                                        { className: "fd-current-line-param-highlight"});
            this._traceAndUpdate();
        }.bind(this);
        visualization.addToContainer(this.$visualization);
        this.currentVisualization = visualization;
    };

    StudyEditor.prototype._traceAndUpdate = function() {
        var traceContext = VariableTrace.getTraceForCode(this.contextCode);
        var traceCode = VariableTrace.getTraceForCode(this.contextEditor.getValue());
        
        var getAST = Esprima.parse(this.currentLineHandle.text);
        var getLineInfo = LineInfo.infoForLine(this.currentLineHandle.text);

        $.when(traceContext, traceCode, getAST, getLineInfo)
        .done(function(contextTrace, fullTrace, ast, lineInfo) {
            this.lineInfo = lineInfo;
            this._updateMarkersInCurrentLine();
            this.currentVisualization.updateVisualization(fullTrace, contextTrace, this.lineInfo);
        }.bind(this))
        .fail(function(error) {
            console.error(error);
        });
    };

    StudyEditor.prototype._updateMarkersInCurrentLine = function() {
        var currentLineNr = this.contextEditor.lastLine();

        if(this.lineInfo.lValue !== null) {
            var assignedToObject = this.lineInfo.lValue;
            var lValueRange = assignedToObject.range;
            this.contextEditor.markText({ line: currentLineNr, ch: lValueRange[0] },
                                        { line: currentLineNr, ch: lValueRange[1] }, 
                                        { className: "fd-current-line-assigned-to-highlight" }
                                        );
    
        }
        
        if(this.lineInfo.rValue !== null) {
            var theObject;

            if(this.lineInfo.type.indexOf("Function call") !== -1) {
                theObject = this.lineInfo.rValue.callee;    
            } else {
                theObject = this.lineInfo.rValue;
            }
            
            var calleeRange = theObject.range;
            this.contextEditor.markText({ line: currentLineNr, ch: calleeRange[0] },
                                        { line: currentLineNr, ch: calleeRange[1] }, 
                                        { className: "fd-current-line-object-highlight" }
                                        );
        }
    };

    module.exports = StudyEditor;
});