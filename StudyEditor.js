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

        var $gutter = $(this.contextEditor.getGutterElement());
        var gutterWidth = $gutter.children("div:first").width();

        this.contextEditor.setValue([this.config.context, this.config.currentLine].join("\n\n"));

        this.contextEditor.eachLine(function(lineHandle) {
            console.log(lineHandle);
            var lineText = lineHandle.text;
            if (lineText.indexOf("<#undefined") !== -1) {

                var replacement = JSON.stringify(this.config.unknownVariables.string[2]);
                var tag = "<#undefined#>";
                var tagStart = lineText.indexOf(tag);
                var tagLength = tag.length;

                var lineNo = lineHandle.lineNo();
                var start = {line: lineNo, ch: tagStart};
                var end =  {line: lineNo, ch: tagStart + tagLength};
                this.contextEditor.replaceRange(replacement, start, end);

                var charPositions = this.contextEditor.charCoords({line: 0, ch: lineText.length}, "local");
                var $selector = $("<div></div>").addClass("fd-selector");
                
                var indexOfReplacement = lineText.indexOf(tag);
                var replacementLength = replacement.length;
                var marker;

                var editor = this.contextEditor;
                $selector.css({
                    top: charPositions.top,
                    left: charPositions.left + gutterWidth
                });
                
                $selector.click(function(e) {
                    e.preventDefault();
                    console.log("Selector click");
                });

                $selector.hover(function() {
                    marker = editor.markText({line: lineNo, ch: indexOfReplacement}, 
                                             {line: lineNo, ch: indexOfReplacement + replacementLength},
                                             {className: "fd-selector-highlight"});
                }, function() {
                    marker.clear();
                });

                this.$contextEditor.prepend($selector);        
            }
        }.bind(this));
    };


    module.exports = StudyEditor;
});