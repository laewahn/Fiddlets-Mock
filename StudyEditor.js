/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
    
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;

    function StudyEditor(config) {
        InlineWidget.call(this);
        this.config = config;

        this.$widgetContainer = $(widgetContainer);
        this.$htmlContent.append(this.$widgetContainer);

        this.$unknownVariables = this.$widgetContainer.find("#unknown-variables");
        this.$contextEditor = this.$widgetContainer.find("#context-editor");
        this.$currentLineEditor = this.$widgetContainer.find("#current-line-editor");
    }

	var widgetContainer = require("text!inline-widget-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "inline-widget-template.css");
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    StudyEditor.prototype = Object.create(InlineWidget.prototype);
    StudyEditor.prototype.constructor = StudyEditor;
    StudyEditor.prototype.parentClass = InlineWidget.prototype;

    StudyEditor.prototype.contextEditor = undefined;
    StudyEditor.prototype.currentLineEditor = undefined;
    StudyEditor.prototype.config = undefined;


    StudyEditor.prototype.$widgetContainer = undefined;
    StudyEditor.prototype.$unknownVariables = undefined;
    StudyEditor.prototype.$contextEditor = undefined;
    StudyEditor.prototype.$currentLineEditor = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

		if (this.config.unknownVariables !== undefined) {
            Object.keys(this.config.unknownVariables).forEach(function(unknownVar) {
                this.$unknownVariables.append(unknownVar + " = ");
                var traceValues = this.config.unknownVariables[unknownVar];
            
                var selectField = $("<select></select>");
                traceValues.forEach(function(traceVal) {
                    $("<option>" + traceVal + "</option>").appendTo(selectField);
                });

                this.$unknownVariables.append(selectField).append("<br/>");
            }, this);
        }
        
        if (this.config.context !== undefined) {
            this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
                value: this.config.context,
                mode: "javascript",
                lineNumbers: true
            });
        }

        this.currentLineEditor = new CodeMirror(this.$currentLineEditor.get(0), {
            value: this.config.currentLine,
            mode: "javascript",
            lineNumbers: false
        });
        
    };

    module.exports = StudyEditor;
});