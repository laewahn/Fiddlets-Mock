/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var VariableTraceProxy = require("./VariableTraceProxy");
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;

    function StudyEditor(config) {
        InlineWidget.call(this);
        this.config = config;

        this.$widgetContainer = $(widgetContainer);
        this.$htmlContent.append(this.$widgetContainer);

        this.$contextEditor = this.$widgetContainer.find("#context-editor");
        this.$typeField = this.$widgetContainer.find("#type-field");
        this.$visualization = this.$widgetContainer.find("#visualization-container");
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
    StudyEditor.prototype.$visualization = undefined;
    StudyEditor.prototype.$currentVisualization = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        this.$typeField.text(this.config.type);
    
        this.contextEditor = new CodeMirror(this.$contextEditor.get(0), {
            mode: "javascript",
            lineNumbers: true
        });
        this.contextEditor.setValue([this.config.context, this.config.currentLine].join("\n\n"));

        var $gutter = $(this.contextEditor.getGutterElement());
        GUTTER_WIDTH = $gutter.children("div:first").width();

        this._createTraceSelectors();
        this._traceContextCode();
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
                $selector.substitutionChangedCallback = function() {
                    this._traceContextCode();
                }.bind(this);

                this.$contextEditor.prepend($selector.$element);
            }
        }.bind(this));
    };

    StudyEditor.prototype._traceContextCode = function() {
        if (this.currentVisualization !== undefined) {
            this.currentVisualization.remove();
        }

        VariableTraceProxy.getTraceForCode(this.contextEditor.getValue())
        .done(function(trace) {
            // TODO: Das hier muss abhängig von der aktuellen Zeile ausgewählt werden. Die Infos dazu erst einmal in der
            // taskConfig hinterlegen, später dann mit Node herausfinden...
            var stringReplaceVisualization = new StringReplaceVisualization(trace.string, trace.regExpMetaCharacters, trace.replacement);
            stringReplaceVisualization.addToContainer(this.$visualization);
            this.currentVisualization = stringReplaceVisualization;
            
        }.bind(this))
        .fail(function(error) {
            console.error(error);
        });
    };

    function StringReplaceVisualization(string, regexp, replacement) {
        this.string = string;
        this.regexp = regexp;
        this.replacement = replacement;

        this.$container = $("<div></div>");
        this.$container.append($("<p></p>").text("Replaced " + this.regexp.toString() + " with " + this.replacement));

        var idx = 0;
        var stylizedString = string.replace(this.regexp, function(match) {
            var color = (idx++ % 2) ? "#ff0000" : "#00ffff";
            return match.replace(/\S/, "<span style=\"background-color: " + color + ";\">" + "$&" + "</span>");
        });

        idx = 0;
        var stylizedResult = string.replace(this.regexp, function(match) {
            var color = (idx++ % 2) ? "#ff0000" : "#00ffff";
            return match.replace(/\S/, "<span style=\"background-color: " + color + ";\">" + this.replacement + "</span>");
        }.bind(this));

        this.$container.append($("<p></p>").append($(stylizedString)));
        this.$container.append($("<p></p>").append($(stylizedResult)));
    }

    StringReplaceVisualization.prototype.string = undefined;
    StringReplaceVisualization.prototype.regexp = undefined;
    StringReplaceVisualization.prototype.replacement = undefined;
    StringReplaceVisualization.prototype.$container = undefined;

    StringReplaceVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };

    StringReplaceVisualization.prototype.remove = function() {
        this.$container.remove();
        this.$container = undefined;
    };

    function TraceSelector(editor, lineHandle, substitutions, tag) {
        this.editor = editor;
        this.lineHandle = lineHandle;
        this.currentSubstitution = tag;

        this.tagBegin = this.lineHandle.text.indexOf(tag);

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

        this.substitutions = substitutions;
        this.substitutions.forEach(function(substitution) {
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
            selector.setSelectedTraceObject(substitution, selector.tagBegin, selector.currentSubstitution.length);
            $button.blur();
        });

        this.setSelectedTraceObject(this.substitutions[0]);
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
    TraceSelector.prototype.currentSubstitution = undefined;
    TraceSelector.prototype.substitutions = undefined;
    TraceSelector.prototype.substitutionChangedCallback = undefined;

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
                                          {line: this.lineHandle.lineNo(), ch: this.tagBegin + this.currentSubstitution.length});

        this.currentSubstitution = newTraceObject;
        this.updatePosition();
        if (this.substitutionChangedCallback !== undefined) {
            this.substitutionChangedCallback();
        }
    };

    module.exports = StudyEditor;
});