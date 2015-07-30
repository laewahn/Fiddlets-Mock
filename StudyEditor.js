/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;

    var widgetContainer = require("text!inline-widget-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "inline-widget-template.css");

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    function StudyEditor(config) {
        InlineWidget.call(this);
        this.config = config;
        this.$htmlContent.append($(widgetContainer));
    }

    StudyEditor.prototype = Object.create(InlineWidget.prototype);
    StudyEditor.prototype.constructor = StudyEditor;
    StudyEditor.prototype.parentClass = InlineWidget.prototype;

    StudyEditor.prototype.contextEditor = undefined;
    StudyEditor.prototype.currentLineEditor = undefined;
    StudyEditor.prototype.config = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        if (this.config.context !== undefined) {
            var contextEditorContainer = this.$htmlContent.find("#context-editor").get(0);
            this.contextEditor = new CodeMirror(contextEditorContainer, {
                value: this.config.context,
                mode: "javascript",
                lineNumbers: true
            });
        }

        var currentLineEditorContainer = this.$htmlContent.find("#current-line-editor").get(0);
        this.currentLineEditor = new CodeMirror(currentLineEditorContainer, {
            value: this.config.currentLine,
            mode: "javascript",
            lineNumbers: false
        });

        if (this.config.unknownVariables !== undefined) {
            var $unknownVariables = this.$htmlContent.find("#unknown-variables");
            Object.keys(this.config.unknownVariables).forEach(function(unknownVar) {
                $unknownVariables.append(unknownVar + " = ");
                var traceValues = this.config.unknownVariables[unknownVar];
            
                var selectField = $("<select></select>");
                traceValues.forEach(function(traceVal) {
                    $("<option>" + traceVal + "</option>").appendTo(selectField);
                });

                $unknownVariables.append(selectField).append("<br/>");
            }, this);
        }
        
    };

    module.exports = StudyEditor;
});