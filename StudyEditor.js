/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var NodeDomain = brackets.getModule("utils/NodeDomain");
    var VariableTraceDomain = new NodeDomain("VariableTraceDomain", ExtensionUtils.getModulePath(module, "node_modules/ContextCollector/VariableTraceDomain"));
    
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
                
                // Create a new selector element
                var substitutions = this.config.unknownVariables.string.map(function(v) {
                    return JSON.stringify(v);
                });

                var $selector = new TraceSelector(this.contextEditor, lineHandle, substitutions);
                $selector.substitutionObject = tag;
                this.$contextEditor.prepend($selector.$element);

                var selectedTraceObject = JSON.stringify(this.config.unknownVariables.string[0]);
                $selector.setSelectedTraceObject(selectedTraceObject);
            }
        }.bind(this));

        console.log(this.contextEditor.getValue());
        VariableTraceDomain.exec("getTraceForCode", this.contextEditor.getValue())
        .done(function(trace) {
            console.log(JSON.parse(trace));
        })
        .fail(function(error) {
            console.error(error);
        });
    };

    function TraceSelector(editor, lineHandle, substitutions) {
        this.editor = editor;
        this.lineHandle = lineHandle;
        this.tagBegin = this.lineHandle.text.indexOf("<#undefined#>");

        this.$element = $("<div>" +
                            "<button type=\"button\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">" +
                              "<span class=\"caret\"></span>" +
                            "</button>" +
                          "</div>").addClass("fd-selector");

        this.$element.click(function(e) {
            e.preventDefault();
        }.bind(this));

        this.$element.hover(this._onHoverEnter.bind(this), this._onHoverLeave.bind(this));
        this.$element.addClass("dropdown");
        var $dropdown = $("<ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"></ul>");

        substitutions.forEach(function(substitution) {
            var $listItem = $("<li><a href=\"#\"></a>");
            $listItem.find("a").html(substitution);
            $listItem.data("substitution", substitution); 
            $listItem.data("traceSelector", this);
            $dropdown.append($listItem);
        }, this);

        var $button = this.$element.find("button");
        $dropdown.on("click", "li", function() {
            var selector = $(this).data("traceSelector");
            var substitution = $(this).data("substitution");
            selector.setSelectedTraceObject(substitution, selector.tagBegin, selector.substitutionObject.length);
            $button.blur();
        });

        this.$element.append($dropdown);
    }
    

    TraceSelector.prototype._onHoverEnter = function() {
        var startPosition = {line: this.lineHandle.lineNo(), ch: this.tagBegin};
        var endPosition = {line: this.lineHandle.lineNo(), ch: this.lineHandle.text.length};
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
    TraceSelector.prototype.substitutions = undefined;

    TraceSelector.prototype.updatePosition = function() {
        var charPositions = this.editor.charCoords({line: this.lineHandle.lineNo(), ch: this.lineHandle.text.length}, "local");                
        this.$element.css({
            top: charPositions.top,
            left: charPositions.left + GUTTER_WIDTH
        });
    };

    TraceSelector.prototype.setSelectedTraceObject = function(newTraceObject) {
        this.editor.replaceRange(newTraceObject, 
                                          {line: this.lineHandle.lineNo(), ch: this.tagBegin}, 
                                          {line: this.lineHandle.lineNo(), ch: this.tagBegin + this.substitutionObject.length});

        this.substitutionObject = newTraceObject;
        this.updatePosition();
    };

    module.exports = StudyEditor;
});