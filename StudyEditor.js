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

    var GUTTER_WIDTH;

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
        GUTTER_WIDTH = $gutter.children("div:first").width();

        this.contextEditor.setValue([this.config.context, this.config.currentLine].join("\n\n"));

        this.contextEditor.eachLine(function(lineHandle) {

            var lineText = lineHandle.text;
            var tag = "<#undefined#>";
            if (lineText.indexOf(tag) !== -1) {
                
                // Find the tag
                var tagStart = lineText.indexOf(tag);
                var tagLength = tag.length;

                var replacement = {
                    lineText: lineText,
                    object: JSON.stringify(this.config.unknownVariables.string[0]),
                    line: lineHandle.lineNo(),
                    index: tagStart
                };

                // Create a new selector element
                var $selector = new TraceSelector(this.contextEditor);
                // var $selector = this._selectorElementForReplacement(replacement, GUTTER_WIDTH);
                // this.$contextEditor.prepend($selector);
                this.$contextEditor.prepend($selector.$element);

                // Replace the unknown variable and update the selectors position
                this.contextEditor.replaceRange(replacement.object, 
                                                {line: replacement.line, ch: tagStart}, 
                                                {line: replacement.line, ch: tagStart + tagLength});

                // var charPositions = this.contextEditor.charCoords({line: replacement.line, ch: replacement.lineText.length}, "local");                
                // $selector.css({
                    // top: charPositions.top,
                    // left: charPositions.left + GUTTER_WIDTH
                // });
                $selector.updatePosition(replacement);
            }
        }.bind(this));
    };

    StudyEditor.prototype._selectorElementForReplacement = function(replacement) {
        var $selector = $("<div></div>").addClass("fd-selector");
        
        $selector.editor = this.contextEditor;

        $selector.click(function(e) {
            e.preventDefault();
        });

        $selector.hover(function() {
            $selector.marker = $selector.editor.markText({line: replacement.line, ch: replacement.index}, 
                                     {line: replacement.line, ch: replacement.index + replacement.object.length},
                                     {className: "fd-selector-highlight"});
        }, function() {
            $selector.marker.clear();
        });
        
        return $selector;
    };

    function TraceSelector(editor) {
        this.$element = $("<div></div>").addClass("fd-selector");

        this.$element.click(function(e) {
            e.preventDefault();
        });

        this.$element.hover(function() {
            this.marker = this.editor.markText({line: this.replacement.line, ch: this.replacement.index}, 
                                     {line: this.replacement.line, ch: this.replacement.index + this.replacement.object.length},
                                     {className: "fd-selector-highlight"});
        }.bind(this), function() {
            this.marker.clear();
        }.bind(this));

        this.editor = editor;
    }

    TraceSelector.prototype.$element = undefined;
    TraceSelector.prototype.editor = undefined;
    TraceSelector.prototype.line = undefined;

    TraceSelector.prototype.updatePosition = function(replacement) {
        this.replacement = replacement;
        var charPositions = this.editor.charCoords({line: replacement.line, ch: replacement.lineText.length}, "local");                
        this.$element.css({
            top: charPositions.top,
            left: charPositions.left + GUTTER_WIDTH
        });
    };

    module.exports = StudyEditor;
});