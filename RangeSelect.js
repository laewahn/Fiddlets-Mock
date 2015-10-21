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

            this.highlights = [{
                "class" : highlightClass,
                "range" : []
            }];
        }

        RangeSelect.prototype.$container = undefined;
        RangeSelect.prototype.highlights = undefined;
        RangeSelect.prototype.rows = undefined;
        RangeSelect.prototype.limit = undefined;
        RangeSelect.prototype.start = undefined;
        RangeSelect.prototype.$currentSelectorElement = undefined;

        RangeSelect.prototype.limitChangedCallback = undefined;
        RangeSelect.prototype.selectorHoverInCallback = undefined;
        RangeSelect.prototype.selectorHoverOutCallback = undefined;

        RangeSelect.prototype.startChangedCallback = undefined;
        RangeSelect.prototype.startHoverInCallback = undefined;
        RangeSelect.prototype.startHoverOutCallback = undefined;

        RangeSelect.prototype.setArray = function(arr) {
            console.log("set array: " + arr);
            this.highlights[0].range = [0, arr.length];
            this.$container.empty();
            this.rows = [];

            arr.forEach(function(e) {
                var $row = $("<div></div>").addClass("fd-range-array-row");
                var $selector = $("<img></img>").addClass("fd-range-array-selector");
                var $content = $("<div></div>").addClass("fd-range-array-content");

                $row.append($selector);
                $row.append($content);

                $content.text(JSON.stringify(e));
                
                this.$container.append($row);
                this.rows.push($row);
            }, this);

            if (this.limit >= this.rows.length) {
                this.limit = this.rows.length;
            }

            if (this.rows.length !== 0) {
                this.$container.height(this.rows[0].height() * this.rows.length);
            }
            
            this._updateHighlights();
            this._registerEvents();
            this._updateSelector();
        };

        RangeSelect.prototype.setHighlightForRange = function(highlightClass, range) {
            this.highlights.push({
                "class" : highlightClass,
                "range" : range
            });

            this._updateHighlights();
        };

        RangeSelect.prototype.resetHighlights = function() {
            this.highlights = [this.highlights[0]];        
        };

        RangeSelect.prototype.setStart = function(start) {
            if(start !== this.start) {
                this.start = start;

                if (this.start + this.limit >= this.rows.length) {
                    this.limit = this.rows.length - this.start;
                }

                this._updateHighlights();
                this._registerEvents();
                this._updateSelector();

                if (this.startChangedCallback !== undefined) {
                    this.startChangedCallback(this.start);
                }
            }
        };

        RangeSelect.prototype.setLimit = function(limit) {
            if (limit !== this.limit) {
                this.limit = limit;

                this._updateHighlights();
                this._registerEvents();
                this._updateSelector();

                if (this.limitChangedCallback !== undefined) {
                    this.limitChangedCallback(this.limit);
                }
            }
        };

        RangeSelect.prototype.limitChange = function(callback) {
            this.limitChangedCallback = callback;
        };

        RangeSelect.prototype.startChange = function(callback) {
            this.startChangedCallback = callback;
        };

        RangeSelect.prototype.selectorHover = function(hoverIn, hoverOut) {
            this.selectorHoverInCallback = hoverIn;
            this.selectorHoverOutCallback = hoverOut;
        };

        RangeSelect.prototype.startHover = function(hoverIn, hoverOut) {
            this.startHoverInCallback = hoverIn;
            this.startHoverOutCallback = hoverOut;
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

                Object.keys(this.highlights).forEach(function(highlightClass) {
                    $content.removeClass(highlightClass);
                });

                var classForElement = classForIdx(idx, this.highlights);
                console.log("Adding class " + classForElement + " to idx " + idx);
                if (classForElement !== null) {
                    $content.addClass(classForElement);
                }

                $selector.removeClass("fd-range-array-row-current");
                $selector.removeClass("fd-range-array-row-between");

                if (this.start <= idx && idx < this.limit + this.start) {

                    if (idx === this.start) {
                        if (this.limit > 1) {
                            $selector.addClass("fd-range-array-row-start");
                        }
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

                    $selector.attr("src", ExtensionUtils.getModuleUrl(module, "selector-arrow-none.png"));
                }
            }, this);
        };

        function classForIdx(idx, highlights) {
        var i;
        var returnHighlight = null;
        var highlight;
            for(i = 0; i < highlights.length; i++) {
                 highlight = highlights[i];
                if (highlight.range[0] <= idx && idx < highlight.range[1]) {
                    returnHighlight = highlight.class;
                }
            }

        return returnHighlight;
    }

        RangeSelect.prototype._registerEvents = function() {
            if (this.$currentSelectorElement !== undefined) {
                this.$currentSelectorElement.off("mousedown");
            }

            var $currentSelector = $(".fd-range-array-row-current");
            
            var $container = this.$container;
            var that = this;

            $currentSelector.mousedown(function(e) {
                $currentSelector.off("mouseleave", that.selectorHoverOutCallback);
                $currentSelector.off("mouseenter", that.selectorHoverInCallback);

                $currentStartElement.off("mouseleave", that.selectorHoverOutCallback);
                $currentStartElement.off("mouseenter", that.selectorHoverInCallback);
                
                e.preventDefault();
                var rowHeight = $(this).height();

                $container.mousemove(function(e) {
                    e.stopPropagation();

                    var offset = $(this).offset();
                    var posY = e.pageY - offset.top - that.start * rowHeight;
                    
                    var newLimit = Math.ceil(posY/rowHeight);

                    if (newLimit < 0) {
                        newLimit = 0;
                    }

                    if (newLimit > that.rows.length) {
                        newLimit = that.rows.length;
                    }

                    if (newLimit === 0) {
                        unregisterAllEvents();
                    }

                    if (newLimit !== that.limit) {
                        that.setLimit(newLimit);
                    }
                });

                function unregisterAllEvents() {
                    $container.off("mousemove");
                    $container.off("mouseup");
                    $container.off("mouseleave", unregisterAllEvents);
                }

                $container.mouseup(unregisterAllEvents);
                $container.mouseleave(unregisterAllEvents);
            });

            this.$currentSelectorElement = $currentSelector;

            var $currentStartElement = $(".fd-range-array-row-start");

            $currentStartElement.mousedown(function(e) {
                
                $currentSelector.off("mouseleave", that.selectorHoverOutCallback);
                $currentSelector.off("mouseenter", that.selectorHoverInCallback);
                
                $currentStartElement.off("mouseleave", that.selectorHoverOutCallback);
                $currentStartElement.off("mouseenter", that.selectorHoverInCallback);

                e.preventDefault();
                var rowHeight = $(this).height();

                $container.mousemove(function(e) {
                    e.stopPropagation();

                    var offset = $(this).offset();
                    var posY = e.pageY - offset.top - that.start * rowHeight;
                    var normalizedY = posY/rowHeight;
                    var startOffset = normalizedY > 0 ?  Math.floor(normalizedY) : Math.floor(normalizedY);
                    var newStart = that.start + startOffset;

                    if (startOffset !== 0 && newStart + that.limit <= that.rows.length) {
                        that.setStart(that.start + startOffset);
                    }                    
                });

                function unregisterAllEvents() {
                    $container.off("mousemove");
                    $container.off("mouseup");
                    $container.off("mouseleave", unregisterAllEvents);
                }

                $container.mouseup(unregisterAllEvents);
                $container.mouseleave(unregisterAllEvents);
            });

            $currentSelector.hover(
                this.selectorHoverInCallback,
                this.selectorHoverOutCallback
            );

            $currentStartElement.hover(
                this.startHoverInCallback,
                this.startHoverOutCallback
            );

        };

    module.exports = RangeSelect;
});
