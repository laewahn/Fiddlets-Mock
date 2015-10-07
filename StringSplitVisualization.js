/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

    var stringSplitVisualizationContainer = require("text!string-split-visualization-template.html");

    function StringSplitVisualization() {
        this.$container = $(stringSplitVisualizationContainer);
        this.$explainationView = this.$container.find("#explanation-view");
        this.$inputView = this.$container.find("#input-view");
        this.$resultView = this.$container.find("#results-view");
    }

    StringSplitVisualization.prototype.$container = undefined;
    StringSplitVisualization.prototype.$explainationView = undefined;
    StringSplitVisualization.prototype.$inputView = undefined;
    StringSplitVisualization.prototype.$resultView = undefined;

    StringSplitVisualization.prototype.string = undefined;

    StringSplitVisualization.prototype.addToContainer = function($container) {
        $container.append(this.$container);
    };

    StringSplitVisualization.prototype.updateVisualization = function(fullTrace, contextTrace, lineInfo) {
        this.string = contextTrace[lineInfo.rValue.callee.name];
        console.log(lineInfo);

        var splitRegExp = contextTrace[lineInfo.rValue.params.values[0].name] || lineInfo.rValue.params.values[0].value;
        var limit = (lineInfo.rValue.params.values[1]) ? lineInfo.rValue.params.values[1].name || lineInfo.rValue.params.values[1].value : undefined;

        var explaination =  "Splits  " + JSON.stringify(this.string) + " at " + splitRegExp.toString() + " and limits the result to " + limit + " elements.";
        this.$explainationView.text(explaination);
        
        var splitted = this.string.split(splitRegExp);
        
        var splitHTMLElements = splitted.map(function(e, idx) {
            var styledElement = JSON.stringify(e);

            if (idx === 0) {
                styledElement = "<span style=\"background-color: #00FF00;\">" + styledElement;
            }
            if (idx === limit - 1 || idx == splitted.length - 1) {
                styledElement = styledElement + "</span>";
            }

            return styledElement;
        });

        this.$inputView.html("[" + splitHTMLElements.join(", ") + "]");

        var result = fullTrace[lineInfo.lValue.name];
        this.$resultView.html(JSON.stringify(result));
    };

    StringSplitVisualization.prototype.remove = function() {
        this.$container.remove();
    };

    module.exports = StringSplitVisualization;
});
