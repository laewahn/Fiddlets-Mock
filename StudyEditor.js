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

        var config = this.config;
        this.contextEditor.on("renderLine", function(instance, lineHandle, element) {
            if (lineHandle.lineNo() === instance.lineCount() - 1) {
                $(element).children().find("span:contains(\"" + config.assignedTo + "\")").addClass("fd-current-line-assigned-to-highlight");
                $(element).children().find("span:contains(\"" + config.calleeMember + "\")").addClass("fd-current-line-object-highlight");
            }
        });

        this.contextEditor.setValue([this.config.context, this.config.currentLine].join("\n\n"));

        this._createTraceSelectors();
        this._traceContextCode();

        this.contextEditor.on("change", function() {
            this._traceContextCode();
        }.bind(this));
    };

    StudyEditor.prototype._createTraceSelectors = function() {
        this.contextEditor.eachLine(function(lineHandle) {

            var lineText = lineHandle.text;
            var tagRe = /<#undefined:(\w*)#>/g
            var tagMatch = tagRe.exec(lineText);
            console.log(tagMatch);

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

    StudyEditor.prototype._traceContextCode = function() {

        VariableTraceProxy.getTraceForCode(this.contextEditor.getValue())
        .done(function(trace) {
            if (this.currentVisualization !== undefined) {
                this.currentVisualization.remove();
                this.currentVisualization = undefined;
            }
            
            this.$errorView.text("");
            
            var object = trace[this.config.calleeMember];
            var params = [];
            
            this.config.params.forEach(function(param) {
                params.push(trace[param]);
            });

            var stringReplaceVisualization = new StringReplaceVisualization(object, params);
            stringReplaceVisualization.addToContainer(this.$visualization);
            this.currentVisualization = stringReplaceVisualization;
            
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