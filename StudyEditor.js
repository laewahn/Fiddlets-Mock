/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var VariableTraceProxy = require("./VariableTraceProxy");
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;
    
    var TraceSelector = require("./TraceSelector");
    var StringReplaceVisualization = require("./StringReplaceVisualization");

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

        this.$typeField.text(this.config.type);
    
        this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
            mode: "javascript",
            lineNumbers: true
        });
        this.contextEditor.setValue([this.config.context, this.config.currentLine].join("\n\n"));
        
        this._createTraceSelectors();
        this._traceContextCode();

        this.contextEditor.on("renderLine", function() {
            this._traceContextCode();
        }.bind(this));
    };

    StudyEditor.prototype._createTraceSelectors = function() {
        this.contextEditor.eachLine(function(lineHandle) {

            var lineText = lineHandle.text;
            var tag = "<#undefined#>";
            if (lineText.indexOf(tag) !== -1) {
                
                // Create a new selector element
                var substitutions = this.config.unknownVariables.string.map(function(v) {
                    return JSON.stringify(v);
                });

                var $selector = new TraceSelector(this.contextEditor, lineHandle, substitutions, tag);
                this.$contextEditor.prepend($selector.$element);
            }
        }.bind(this));
    };

    StudyEditor.prototype._traceContextCode = function() {
        if (this.currentVisualization !== undefined) {
            this.currentVisualization.remove();
            this.currentVisualization = undefined;
        }

        VariableTraceProxy.getTraceForCode(this.contextEditor.getValue())
        .done(function(trace) {
            this.$errorView.text("");
            // TODO: Das hier muss abhängig von der aktuellen Zeile ausgewählt werden. Die Infos dazu erst einmal in der
            // taskConfig hinterlegen, später dann mit Node herausfinden...
            var stringReplaceVisualization = new StringReplaceVisualization(trace.string, trace.regExpMetaCharacters, trace.replacement);
            stringReplaceVisualization.addToContainer(this.$visualization);
            this.currentVisualization = stringReplaceVisualization;
            
        }.bind(this))
        .fail(function(error) {
            console.error(error);
            this.$errorView.text(error);
        }.bind(this));
    };

    module.exports = StudyEditor;
});