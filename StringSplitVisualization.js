/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

    var stringSplitVisualizationContainer = require("text!string-split-visualization-template.html");

    function StringSplitVisualization(lineInfo, trace) {
        this.$container = $(stringSplitVisualizationContainer);
        this.$explainationView = this.$container.find("#explanation-view");
        this.$inputView = this.$container.find("#input-view");
        this.$resultView = this.$container.find("#results-view");
    }

    StringSplitVisualization.prototype.$container = undefined;
    StringSplitVisualization.prototype.$explainationView = undefined;
    StringSplitVisualization.prototype.$inputView = undefined;
    StringSplitVisualization.prototype.$resultView = undefined;

    StringSplitVisualization.prototype.addToContainer = function($container) {
        this._buildVisualization();
        $container.append(this.$container);
    };

    StringSplitVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    StringSplitVisualization.prototype._buildVisualization = function() {
        console.log(this);
        this.$explainationView.html("Explaination");
        this.$inputView.html("Input");
        this.$resultView.html("Result");
    }

    module.exports = StringSplitVisualization;
});
