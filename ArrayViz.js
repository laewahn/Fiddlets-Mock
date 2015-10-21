/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "array-viz.css");
    
    function ArrayViz($container, array, highlightClass) {
        this.$container = $container;
        this.array = array || [];

        this.highlights = [{
            "class" : highlightClass,
            "range" : [0, this.array.length]
        }];

        this._update();
    }

    ArrayViz.prototype.$container = undefined;
    ArrayViz.prototype.array = undefined;
    ArrayViz.prototype.highlights = undefined;
    
    ArrayViz.prototype.setHighlightForRange = function(highlightClass, range) {
        this.highlights.push({
            "class" : highlightClass,
            "range" : range
        });

        this._update();
    };

    ArrayViz.prototype.setArray = function(array) {
        this.array = array;
        this.highlights[0].range = [0, array.length];
        this._update();
    };

    ArrayViz.prototype.resetHighlights = function() {
        this.highlights = [this.highlights[0]];        
    };
    
    ArrayViz.prototype._update = function() {
        this.$container.empty();

        var idx;
        for(idx = 0; idx < this.array.length; idx++) {
            var $row = $("<div></div>").addClass("fd-array-viz-row");
            
            var $element = $("<div><pre></pre></div>").addClass("fd-array-viz");
            
            var classForElement = classForIdx(idx, this.highlights);

            if (classForElement !== null) {
                $element.addClass(classForElement);
            }

            $element.find("pre").text(JSON.stringify(this.array[idx]));
            $row.append($element);
            this.$container.append($row);
        }
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

    module.exports = ArrayViz;
});
