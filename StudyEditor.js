/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");

    var VariableTrace = require("./VariableTraceProxy");
    var LineInfo = require("./LineInfoProxy");
    var ContextCollector = require("./ContextGeneratorProxy");

    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;
    
    var TraceSelector = require("./TraceSelector");
    var DefaultVisualization = require("./DefaultVisualization");
    var StringReplaceVisualization = require("./StringReplaceVisualization");
    var StringSplitVisualization = require("./StringSplitVisualization");
    var MapVisualization = require("./MapVisualization");
    var ArraySpliceVisualization = require("./ArraySpliceVisualization");

    function StudyEditor(config, source) {
        InlineWidget.call(this);
        this.source = source;
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

        // this.$typeField.text(this.config.info);
    
        this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
            mode: "javascript",
            lineNumbers: true,
            lineWrapping: true,
            autofocus: true
        });

        ContextCollector.context = this.config.context || "";

        var getContext = ContextCollector.generateContextForLine(this.line, this.source);
        
        getContext.done(function(contextCode) {
            this.contextCode = contextCode;
            var contextValues = this.contextCode ? [this.contextCode, this.currentLineCode] : [this.currentLineCode];
            this.contextEditor.setValue(contextValues.join("\n\n"));
            this._updateCurrentLineHandle();
            this.currentLineHandle.on("delete", this._updateCurrentLineHandle.bind(this));
    
            
            // setTimeout(function() {
            this._createTraceSelectors();
            this._updateUnknownValuesInContextCode();
            
            // }.bind(this), 0);
            
            var getLineInfo = LineInfo.infoForLine(this.currentLineHandle.text);
            getLineInfo.done(function(lineInfo) {
                this.lineInfo = lineInfo;

                this._initializeVisualization();
                this._traceAndUpdate();    
                this._updateHeight();
                this.contextEditor.on("change", function() {
                    this._updateCurrentLineHandle();
                    this._updateUnknownValuesInContextCode();
                    this._traceAndUpdate();
                    this._updateHeight();
                }.bind(this));
            }.bind(this));
                
            
        }.bind(this))
        .fail(function(error) {
            console.error(error);
        });
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

    StudyEditor.prototype._createTraceSelectors = function() {
        this.contextEditor.eachLine(function(lineHandle) {

            var lineText = lineHandle.text;
            var tagRe = /<#undefined:(\w*):([0-9]*)#>/g;
            var tagMatch = tagRe.exec(lineText);

            var tag = "<#undefined#>";
            if (tagMatch !== null && tagMatch[1] !== null) {
                

                if (this.config.unknownVariables[tagMatch[1]] === undefined) {
                    lineHandle.text = lineText.replace(tagRe, tag);
                    var tagBegin = lineHandle.text.indexOf(tag);
                    this.contextEditor.replaceRange("undefined", 
                                          {line: lineHandle.lineNo(), ch: tagBegin}, 
                                          {line: lineHandle.lineNo(), ch: tagBegin + tag.length});

                } else {
                    // Create a new selector element
                    var substitutions = this.config.unknownVariables[tagMatch[1]].map(function(v) {
                        return JSON.stringify(v);
                    });
    
                    lineHandle.text = lineText.replace(tagRe, tag);
                    var $selector = new TraceSelector(this.contextEditor, lineHandle, substitutions, tag);
                    this.$contextEditor.prepend($selector.$element);
                    this.traceSelectorsByLine[lineHandle.lineNo()] = $selector;    
                }
                
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
        
        var info = this.config.lineInfo.info;
        if (this.lineInfo) {
            info = this.lineInfo.info;    
        }
        
        var visualization;

        if (info.functionCall && info.functionCall.method) {
            switch(info.functionCall.method.name) {
                case "split" :
                    visualization =  new StringSplitVisualization(this.contextEditor);
                    break;
                case "replace" :
                    visualization = new StringReplaceVisualization(this.contextEditor);
                    break;
                case "map" : 
                    visualization = new MapVisualization(this.contextEditor);
                    break;
                case "splice" :
                    visualization = new ArraySpliceVisualization(this.contextEditor);
                    break;
                default:
                    visualization = new DefaultVisualization(this.contextEditor);
            }            
        } else /*if (info.assignment || info.declaration) */{
            visualization = new DefaultVisualization(this.contextEditor);
        }

        visualization.currentLineHandle = this.currentLineHandle;
        visualization.addToContainer(this.$visualization);
        this.currentVisualization = visualization;
    };

    StudyEditor.prototype._traceAndUpdate = function() {
        var traceContext = VariableTrace.getTraceForCode(this.contextCode);
        var traceCode = VariableTrace.getTraceForCode(this.contextEditor.getValue());
        
        var getLineInfo = LineInfo.infoForLine(this.currentLineHandle.text);

        $.when(getLineInfo, traceContext, traceCode)
        .done(function(lineInfo, contextTrace, fullTrace) {
            this.$errorView.text("");
            this.lineInfo = lineInfo;
            
            var heading;
            if (this.lineInfo.info.functionCall && this.lineInfo.info.functionCall.method && this.lineInfo.info.functionCall.method.name) {    
                switch(this.lineInfo.info.functionCall.method.name) {
                    case "split" :
                        heading = "String.prototype.split([separator[, limit]])";
                        break;
                    case "replace" :
                        heading = "String.prototype.replace(regexp|substr, newSubStr|function[, flags])";
                        break;
                    case "map" :
                        heading = "Array.prototype.map(callback[, thisArg])";
                        break;
                    case "splice" :
                        heading = "Array.prototype.splice(start, deleteCount[, item1[, item2[, ...]]])";
                        break;
                    default:
                        heading = "Unknown";
                }
            } else if (this.lineInfo.info.assignment || this.lineInfo.info.initialisation) {
                heading = "Assignment";
            } else {
                heading = "Unknown";
            }

            this.$typeField.text(heading);
            this._updateMarkersInCurrentLine();
            // this._initializeVisualization();
            this.currentVisualization.updateVisualization(fullTrace, contextTrace, this.lineInfo);
            this._updateHeight();
        }.bind(this))
        .fail(function(error) {
            console.error(error);
            this.$errorView.text(error.split("\n").slice(0,2).join("\n"));
            this._clearMarkersInCurrentLine();
            this._updateHeight();
        }.bind(this));
    };

    StudyEditor.prototype._updateMarkersInCurrentLine = function() {
        var currentLineNr = this.contextEditor.lastLine();

        this._clearMarkersInCurrentLine();
        var assignedTo = this.lineInfo.info.declaration || this.lineInfo.info.assignment;
        if(assignedTo !== null && assignedTo !== undefined) {
            var assignedToMarker = this.contextEditor.markText({ line: currentLineNr, ch: assignedTo.toRange[0] },
                                                               { line: currentLineNr, ch: assignedTo.toRange[1] }, 
                                                               { className: "fd-current-line-assigned-to-highlight" }
            );
            this.currentLineMarkers.push(assignedToMarker);
    
        }
        
        var theObject = this.lineInfo.info.functionCall || this.lineInfo.info.initialisation;
        if(theObject !== null && theObject !== undefined) {
            if(theObject.type === "CallExpression" && theObject.callee) {
                this.currentLineMarkers.push(this.contextEditor.markText({ line: currentLineNr, ch: theObject.callee.range[0] },
                                                                         { line: currentLineNr, ch: theObject.callee.range[1] }, 
                                                                         { className: "fd-current-line-object-highlight" })
                );
            } else {
                this.currentLineMarkers.push(this.contextEditor.markText({ line: currentLineNr, ch: theObject.fromRange[0] },
                                                                         { line: currentLineNr, ch: theObject.fromRange[1] }, 
                                                                         { className: "fd-current-line-object-highlight" })
                );
            }
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