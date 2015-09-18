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

        this.$contextEditor = this.$widgetContainer.find("#context-editor");
        this.$typeField = this.$widgetContainer.find("#type-field");
        this.$output = this.$widgetContainer.find("#output-field");
    }

	var widgetContainer = require("text!inline-widget-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "inline-widget-template.css");
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    StudyEditor.prototype = Object.create(InlineWidget.prototype);
    StudyEditor.prototype.constructor = StudyEditor;
    StudyEditor.prototype.parentClass = InlineWidget.prototype;

    StudyEditor.prototype.contextEditor = undefined;
    StudyEditor.prototype.config = undefined;

    StudyEditor.prototype.$widgetContainer = undefined;
    StudyEditor.prototype.$contextEditor = undefined;
    StudyEditor.prototype.$typeField = undefined;
    StudyEditor.prototype.$output = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        this.$typeField.text(this.config.type);
    
        this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
            mode: "javascript",
            lineNumbers: true
        });

        var contextElements = [];
        if (this.config.context) { contextElements.push(this.config.context); }
        if (this.config.currentLine) { contextElements.push(this.config.currentLine); }

        var contextSource = contextElements.join("\n\n").replace("<#undefined#>", function(){
            return "\"" + this.config.unknownVariables.string[0] + "\"";
        }.bind(this));
    
        console.log(contextSource);
        this.contextEditor.setValue(contextSource);

        var $gutter = $(this.contextEditor.getGutterElement());
        console.log($gutter);
        var gutterWidth = $gutter.children("div:first").width();

        var charPositions = this.contextEditor.charCoords({line: 0, ch: 0}, "local");
        var $selector = $("<div></div>").addClass("fd-selector");
        $selector.css({
            top: charPositions.top,
            left: charPositions.left + gutterWidth
        });
        $selector.click(function(e) {
            e.preventDefault();
            console.log("Selector click");
        });

        this.$contextEditor.prepend($selector);
    };


    module.exports = StudyEditor;
});