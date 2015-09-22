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
    var CodeHintList = brackets.getModule("editor/CodeHintList").CodeHintList;

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

                // Create a new selector element
                var $selector = new TraceSelector(this.contextEditor, lineHandle);
                this.$contextEditor.prepend($selector.$element);

                var selectedTraceObject = JSON.stringify(this.config.unknownVariables.string[0]);
                $selector.setSelectedTraceObject(selectedTraceObject, tagStart, tagLength);
            }
        }.bind(this));
    };

    function TraceSelector(editor, lineHandle) {
        this.editor = editor;
        this.lineHandle = lineHandle;
        this.tagBegin = this.lineHandle.text.indexOf("<#undefined#>");

        this.$element = $("<div></div>").addClass("fd-selector");

        this.$element.click(function(e) {
            e.preventDefault();
        });

        this.$element.hover(this._onHoverEnter.bind(this), this._onHoverLeave.bind(this));
        this.codeHintList = new CodeHintList(editor, true, 5);
        var substitutionsProvider = {
            hasHints: function() {return true;},
            getHints: function() {return {hints : ["a", "b", "c"], match: null, selectInitial: true};},
            insertHint: function() {}
        }
    }

    TraceSelector.prototype._onHoverEnter = function() {
        var startPosition = {line: this.lineHandle.lineNo(), ch: this.tagBegin};
        var endPosition = {line: this.lineHandle.lineNo(), ch: this.tagBegin + this.substitutionObject.length};
        this.marker = this.editor.markText(startPosition, endPosition, {className: "fd-selector-highlight"});
    };

    TraceSelector.prototype._onHoverLeave = function() {
        this.marker.clear();
    };

    TraceSelector.prototype.$element = undefined;
    TraceSelector.prototype.editor = undefined;
    TraceSelector.prototype.lineHandle = undefined;
    TraceSelector.prototype.tagBegin = undefined;
    TraceSelector.prototype.substitutionObject = undefined;
    TraceSelector.prototype.codeHintList = undefined;

    TraceSelector.prototype.updatePosition = function() {
        var charPositions = this.editor.charCoords({line: this.lineHandle.lineNo(), ch: this.lineHandle.text.length}, "local");                
        this.$element.css({
            top: charPositions.top,
            left: charPositions.left + GUTTER_WIDTH
        });
    };

    TraceSelector.prototype.setSelectedTraceObject = function(newTraceObject, tagStart, tagLength) {
        this.substitutionObject = newTraceObject;
        this.editor.replaceRange(newTraceObject, 
                                          {line: this.lineHandle.lineNo(), ch: tagStart}, 
                                          {line: this.lineHandle.lineNo(), ch: tagStart + tagLength});
    

        this.updatePosition();
    };

    module.exports = StudyEditor;
});