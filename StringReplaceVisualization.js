/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

	var stringReplaceVisualizationContainer = require("text!string-replace-visualization-template.html");
    
    function StringReplaceVisualization(object, params) {
        this.string = object;
        this.regexp = params[0];
        this.replacement = params[1];

        this.$container = $(stringReplaceVisualizationContainer);
        this.$replacedView = this.$container.find("#replaced-view");
        this.$stringView = this.$container.find("#string-view");
        this.$resultsView = this.$container.find("#results-view");
    }

    StringReplaceVisualization.prototype.string = undefined;
    StringReplaceVisualization.prototype.regexp = undefined;
    StringReplaceVisualization.prototype.replacement = undefined;
    
    StringReplaceVisualization.prototype.$container = undefined;
    StringReplaceVisualization.prototype.$replacedView = undefined;
    StringReplaceVisualization.prototype.$stringView = undefined;
    StringReplaceVisualization.prototype.$resultsView = undefined;

    StringReplaceVisualization.prototype.addToContainer = function($container) {
        this._buildVisualization();
        $container.append(this.$container);
    };

    StringReplaceVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    StringReplaceVisualization.prototype._buildVisualization = function() {
        this.$replacedView.text("Matches of " + this.regexp.toString() + " will be replaced by " + this.replacement);

        var idx = 0;
        var stylizedString = this.string.replace(this.regexp, function(match) {
            var color = (idx++ % 2) ? "#ff0000" : "#00ffff";
            return match.replace(/\S/, "<span style=\"background-color: " + color + ";\">" + "$&" + "</span>");
        });

        idx = 0;
        var stylizedResult = this.string.replace(this.regexp, function(match) {
            var color = (idx++ % 2) ? "#ff0000" : "#00ffff";
            console.log(typeof match);
            var replacement = (this.replacement instanceof Function) ? this.replacement(match) : this.replacement;
            console.log(replacement);
            return match.replace(/\S/, "<span style=\"background-color: " + color + ";\">" + replacement + "</span>");
        }.bind(this));

        this.$stringView.html(stylizedString);
        this.$resultsView.html(stylizedResult);
    };

    module.exports = StringReplaceVisualization;
});