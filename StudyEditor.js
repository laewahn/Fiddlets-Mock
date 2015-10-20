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
    var MapVisualization = require("./MapVisualization");
    var ArraySpliceVisualization = require("./ArraySpliceVisualization");

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
    StudyEditor.prototype.currentLineMarkers = [];
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
            lineNumbers: true,
            lineWrapping: true
        });
        
        this._getContext().done(function() {
            this.contextEditor.setValue([this.contextCode, this.currentLineCode].join("\n\n"));
            this._updateCurrentLineHandle();
            this.currentLineHandle.on("delete", this._updateCurrentLineHandle.bind(this));
    
            this._createTraceSelectors();
            this._updateUnknownValuesInContextCode();
            this._initializeVisualization();
            
            this._traceAndUpdate();
            this._updateHeight();
        }.bind(this));
        
        this.contextEditor.on("change", function() {
            this._updateCurrentLineHandle();
            this._updateUnknownValuesInContextCode();
            this._traceAndUpdate();
            this._updateHeight();
        }.bind(this));
    };

    StudyEditor.prototype._updateCurrentLineHandle = function() {
        if (this.currentLineHandle === undefined || this.contextEditor.lastLine() !== this.currentLineHandle.lineNo()) {
            this.currentLineHandle = this.contextEditor.getLineHandle(this.contextEditor.lastLine());
        }
    };

    StudyEditor.prototype._updateHeight = function() {
            var newHeight = this.$widgetContainer.height() + this.$widgetContainer.position().top + 40;
            this.hostEditor.setInlineWidgetHeight(this, newHeight);
    };

    StudyEditor.prototype._getContext = function() {
        var deferred = $.Deferred();
        // Call the context domain
        // well, fake it by loading from the config...
        this.contextCode = this.config.context || "";
        deferred.resolve();

        return deferred.promise();
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
                                                       {line: this.contextEditor.lastLine(), ch: 0});

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
            this.currentVisualization.remove();
            this.currentVisualization = undefined;
        }
        
        var info = this.config.info;
        var visualization;

        switch(info) {
            case "String.prototype.split([separator[, limit]])" :
                visualization =  new StringSplitVisualization(this.contextEditor);
                break;
            case "String.prototype.replace(regexp|substr, newSubStr|function[, flags])" :
                visualization = new StringReplaceVisualization(this.contextEditor);
                break;
            case "Array.prototype.map(callback[, thisArg])" : 
                visualization = new MapVisualization(this.contextEditor);
                break;
            case "Array.prototype.splice(start, deleteCount[, item1[, item2[, ...]]])" :
                visualization = new ArraySpliceVisualization(this.contextEditor);
                break;
            default:
                visualization = new DefaultVisualization(this.contextEditor);
        }

        visualization.currentLineHandle = this.currentLineHandle;
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
            this.$errorView.text("");
            this.lineInfo = lineInfo;
            this._updateMarkersInCurrentLine();
            this.currentVisualization.updateVisualization(fullTrace, contextTrace, this.lineInfo);
            this._updateHeight();
        }.bind(this))
        .fail(function(error) {
            console.error(error);
            this.$errorView.text(error);
            this._clearMarkersInCurrentLine();
            this._updateHeight();
        }.bind(this));
    };

    StudyEditor.prototype._updateMarkersInCurrentLine = function() {
        var currentLineNr = this.contextEditor.lastLine();

        this._clearMarkersInCurrentLine();

        if(this.lineInfo.lValue !== null) {
            var assignedToObject = this.lineInfo.lValue;
            var lValueRange = assignedToObject.range;
            var assignedToMarker = this.contextEditor.markText({ line: currentLineNr, ch: lValueRange[0] },
                                                               { line: currentLineNr, ch: lValueRange[1] }, 
                                                               { className: "fd-current-line-assigned-to-highlight" }
            );
            this.currentLineMarkers.push(assignedToMarker);
    
        }
        
        if(this.lineInfo.rValue !== null) {
            var theObject;

            if(this.lineInfo.type.indexOf("Function call") !== -1) {
                theObject = this.lineInfo.rValue.callee;    
            } else {
                theObject = this.lineInfo.rValue;
            }
            
            var calleeRange = theObject.range;
            var objectMarker = this.contextEditor.markText({ line: currentLineNr, ch: calleeRange[0] },
                                                           { line: currentLineNr, ch: calleeRange[1] }, 
                                                           { className: "fd-current-line-object-highlight" }
            );
            this.currentLineMarkers.push(objectMarker);
        }
    };

    StudyEditor.prototype._clearMarkersInCurrentLine = function() {
        this.currentLineMarkers.forEach(function(marker) {
            marker.clear();
        });

        this.currentLineMarkers = [];
    };

    module.exports = StudyEditor;
});