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

		var matches = [];
        var match;
        
        while((match = this.regexp.exec(this.string)) !== null) {
        	matches.push(match);
        }
		
		var stylizedString = "";
		var idx = 0;
		var i = 0;
        while(i < this.string.length) {
        	if(matches && matches.length !== 0 && matches[0].index == i) {
        		var color = (idx++ % 2) ? "#81D0D7" : "#9AF6FF";
        		stylizedString = stylizedString + "<span style=\"background-color: " + color + ";\">" + escapeHtml(matches[0][0]) + "</span>";
        		i += matches[0][0].length;
        		matches = matches.slice(1);

        	} else {
        		var nonmatch = this.string.substr(i, 1);
        		stylizedString += escapeHtml(nonmatch);
        		i++;
        	}
        }
		
		matches = [];
		while((match = this.regexp.exec(this.string)) !== null) {
        	matches.push(match);
        }

        var stylizedResult = "";
        idx = 0;
        i = 0;
        while(i < this.string.length) {
        	if(matches && matches.length !== 0 && matches[0].index == i) {
        		var color = (idx++ % 2) ? "#81D0D7" : "#9AF6FF";
            	var replacement = (this.replacement instanceof Function) ? this.replacement(matches[0][0]) : this.replacement;
        		stylizedResult = stylizedResult + "<span style=\"background-color: " + color + ";\">" + escapeHtml(replacement) + "</span>";
        		i += matches[0][0].length;
        		matches = matches.slice(1);

        	} else {
        		var nonmatch = this.string.substr(i, 1);
        		stylizedResult += escapeHtml(nonmatch);
        		i++;
        	}
        }

        this.$stringView.html(stylizedString);
        this.$resultsView.html(stylizedResult);
    };

    var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;",
		"/": "&#x2F;"
	};

	function escapeHtml (string) {
		return String(string).replace(/[&<>"'\/]/g, function(s) {
  			return entityMap[s];
		});
	}

    module.exports = StringReplaceVisualization;
});
