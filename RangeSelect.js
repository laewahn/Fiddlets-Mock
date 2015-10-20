/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "range-select.css");
    
    function RangeSelect($container, highlightClass) {
            this.$container = $container;
            this.$container.text("Foo Bar!");
            this.limit = 0;
            this.start = 0;

            this.highlightClass = highlightClass || "fd-range-array-row-highlight";
        }

        RangeSelect.prototype.$container = undefined;
        RangeSelect.prototype.rows = undefined;
        RangeSelect.prototype.limit = undefined;
        RangeSelect.prototype.start = undefined;
        RangeSelect.prototype.$currentSelectorElement = undefined;

        RangeSelect.prototype.limitChangedCallback = undefined;
        RangeSelect.prototype.selectorHoverInCallback = undefined;
        RangeSelect.prototype.selectorHoverOutCallback = undefined;

        RangeSelect.prototype.setArray = function(arr) {
            this.$container.empty();
            this.rows = [];

            arr.forEach(function(e) {
                var $row = $("<div></div>").addClass("fd-range-array-row");
                var $selector = $("<img></img>").addClass("fd-range-array-selector");
                var $content = $("<div></div>").addClass("fd-range-array-content");

                $row.append($selector);
                $row.append($content);

                $content.text(JSON.stringify(e));
                $selector.hover(
                    this.selectorHoverInCallback,
                    this.selectorHoverOutCallback
                );

                this.$container.append($row);
                this.rows.push($row);
            }, this);

            if (this.limit >= this.rows.length) {
                this.limit = this.rows.length;
            }

            this._updateHighlights();
            this._updateSelector();
        };

        RangeSelect.prototype.setStart = function(start) {
            if(start !== this.start) {
                this.start = start;

                this._updateHighlights();
                this._updateSelector();
                this._registerEvents();
            }
        };

        RangeSelect.prototype.setLimit = function(limit) {
            if (limit !== this.limit) {
                this.limit = limit;

                this._updateHighlights();
                this._updateSelector();

                if (this.limitChangedCallback !== undefined) {
                    this.limitChangedCallback(this.limit);
                }
            }
        };

        RangeSelect.prototype.limitChange = function(callback) {
            this.limitChangedCallback = callback;
        };

        RangeSelect.prototype.selectorHover = function(hoverIn, hoverOut) {
            this.selectorHoverInCallback = hoverIn;
            this.selectorHoverOutCallback = hoverOut;
        };

        RangeSelect.prototype._updateSelector = function() {
            this.$container.find(".fd-range-array-selector").each(function() {
                $(this).html("&nbsp;");
            });
        };

        RangeSelect.prototype._updateHighlights = function() {
            this.rows.forEach(function($row, idx){
                var $content = $row.find(".fd-range-array-content");
                var $selector = $row.find(".fd-range-array-selector");

                $selector.removeClass("fd-range-array-row-current");
                $selector.removeClass("fd-range-array-row-between");

                if (this.start <= idx && idx < this.limit + this.start) {
                    $content.addClass(this.highlightClass);

                    if (idx === this.start) {
                        $selector.attr("src", ExtensionUtils.getModuleUrl(module, "selector-arrow-start.png"));  
                    }

                    if (idx + 1 === this.limit + this.start) {
                        $selector.addClass("fd-range-array-row-current");
                        $selector.attr("src", ExtensionUtils.getModuleUrl(module, (this.limit === 1) ? "selector-arrow-only.png" : "selector-arrow.png"));
                    }

                    if (idx > this.start && idx < this.limit + this.start - 1) {
                        $selector.attr("src", ExtensionUtils.getModuleUrl(module, "selector-arrow-between.png"));
                    }
                } else {
                    if (idx === this.start && this.limit === this.start) {
                        $selector.addClass("fd-range-array-row-current");
                    }

                    $content.removeClass(this.highlightClass);
                    $selector.attr("src", ExtensionUtils.getModuleUrl(module, "selector-arrow-none.png"));
                }
            }, this);

            this._registerEvents();
        };

        RangeSelect.prototype._registerEvents = function() {
            if (this.$currentSelectorElement !== undefined) {
                this.$currentSelectorElement.off("mousedown");
                // this.$container.off("mousemove");
            }

            var $currentSelector = $(".fd-range-array-row-current");
            
            var $container = this.$container;
            var that = this;

            $currentSelector.mousedown(function(e) {
                e.preventDefault();
                var rowHeight = $(this).height();

                $container.parent().mousemove(function() {
                    $container.off("mousemove");
                });

                $container.mousemove(function(e) {
                    e.stopPropagation();

                    var offset = $(this).offset();
                    console.log(e.pageY + " - " + offset.top + " (" + rowHeight + ")");

                    var posY = e.pageY - offset.top - that.start * rowHeight;
                    
                    var newLimit = Math.ceil(posY/rowHeight);

                    if (newLimit < 0) {
                        newLimit = 0;
                    }

                    if (newLimit > that.rows.length) {
                        newLimit = that.rows.length;
                    }

                    that.setLimit(newLimit);
                });

                $container.parent().mouseup(function() {
                    $container.off("mousemove");
                    $(this).off("mouseup");
                });
            });

            this.$currentSelectorElement = $currentSelector;
        };

    module.exports = RangeSelect;
});
