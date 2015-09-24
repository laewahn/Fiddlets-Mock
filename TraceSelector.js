/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module){
	"use strict";

	var GUTTER_WIDTH;

	function TraceSelector(editor, lineHandle, substitutions, tag) {
        this.editor = editor;
        this.lineHandle = lineHandle;
        this.currentSubstitution = tag;

        this.tagBegin = this.lineHandle.text.indexOf(tag);

		var $gutter = $(this.editor.getGutterElement());
        GUTTER_WIDTH = $gutter.children("div:first").width();

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
    };

    module.exports = TraceSelector;
});