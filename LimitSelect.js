/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "limit-select.css");
    
    function LimitSelect($container) {
            this.$container = $container;
            this.$container.text("Foo Bar!");
            this.limit = 0;
        }

        LimitSelect.prototype.$container = undefined;
        LimitSelect.prototype.rows = undefined;
        LimitSelect.prototype.limit = undefined;

        LimitSelect.prototype.setArray = function(arr) {
            this.$container.empty();
            this.rows = [];

            arr.forEach(function(e) {
                var $row = $("<div></div>").addClass("fd-limit-array-row");
                var $selector = $("<img></img>").addClass("fd-limit-array-selector");
                var $content = $("<div></div>").addClass("fd-limit-array-content");

                $row.append($selector);
                $row.append($content);

                $content.text(e);
                $selector.html("&nbsp;");

                this.$container.append($row);
                this.rows.push($row);
            }, this);

            if (this.limit >= this.rows.length) {
                this.limit = this.rows.length;
            }

            this._updateHighlights();
            this._updateSelector();
        };

        LimitSelect.prototype.setLimit = function(limit) {
            if (limit !== this.limit) {
                this.limit = limit;

                this._updateHighlights();
                this._updateSelector();
            }
        };

        LimitSelect.prototype._updateSelector = function() {
            this.$container.find(".fd-limit-array-selector").each(function() {
                $(this).html("&nbsp;");
            });
        };

        LimitSelect.prototype._updateHighlights = function() {
            this.rows.forEach(function($row, idx){
                var $content = $row.find(".fd-limit-array-content");
                var $selector = $row.find(".fd-limit-array-selector");

                $selector.removeClass("fd-limit-array-row-current");
                $selector.removeClass("fd-limit-array-row-between");

                if (idx < this.limit) {
                    $content.addClass("fd-limit-array-row-highlight");

                    if (idx === 0) {
                        $selector.attr("src", "selector-arrow-start.png");  
                    }

                    if (idx + 1 === this.limit) {
                        $selector.addClass("fd-limit-array-row-current");
                        $selector.attr("src", (this.limit === 1) ? "selector-arrow-only.png" : "selector-arrow.png");
                    }

                    if (idx > 0 && idx < this.limit - 1) {
                        $selector.attr("src", "selector-arrow-between.png");
                    }
                } else {
                    if (idx === 0 && this.limit === 0) {
                        $selector.addClass("fd-limit-array-row-current");
                    }

                    $content.removeClass("fd-limit-array-row-highlight");
                    $selector.removeAttr("src");
                }
            }, this);

            this._registerEvents();
        };

        LimitSelect.prototype._registerEvents = function() {
            var $currentSelector = $(".fd-limit-array-row-current");
            
            var $container = this.$container;
            var that = this;

            $currentSelector.mousedown(function(e) {
                e.preventDefault();
                var rowHeight = $(this).height();

                $container.mousemove(function(e) {
                    var parentOffset = $(this).offset();
                    var posY = e.pageY - parentOffset.top;
                    
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
        };

    module.exports = LimitSelect;
});
