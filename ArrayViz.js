/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $, brackets */

define(function(require, exports, module) {
	"use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "array-viz.css");
    
    function ArrayViz($container, array, highlightClass) {
        this.$container = $container;
        this.array = array || [];
        this.highlightClass = highlightClass;
        this._update();
    }

    ArrayViz.prototype.$container = undefined;
    ArrayViz.prototype.array = undefined;
    ArrayViz.prototype.highlightClass = undefined;
    
    ArrayViz.prototype.setArray = function(array) {
        this.array = array;
        this._update();
    };
    
    ArrayViz.prototype._update = function() {
        this.$container.empty();
        var idx;
        for(idx = 0; idx < this.array.length; idx++) {
            var $row = $("<div></div>").addClass("fd-array-viz-row");
            
            var $element = $("<div><pre></pre></div>").addClass("fd-array-viz");
            $element.addClass(this.highlightClass);
            $element.find("pre").text(this.array[idx]);
            $row.append($element);
            this.$container.append($row);
        }
    };

    module.exports = ArrayViz;
});
