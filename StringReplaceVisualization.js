/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, $ */

define(function(require, exports, module) {
	"use strict";

	var stringReplaceVisualizationContainer = require("text!string-replace-visualization-template.html");
    
    function StringReplaceVisualization(lineInfo, trace) {

        var params = lineInfo.params;
        var object = trace[lineInfo.calleeMember];

        this.string = object;
        this.regexp = trace[params[0]];
        this.replacement = trace[params[1]];

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
    	var replacement = (this.replacement instanceof Function) ? " the return value of the function" : this.replacement;
        this.$replacedView.text("Matches of " + this.regexp.toString() + " will be replaced by " + replacement);
		
		var colors = ["#9AF6FF", "#81D0D7"];
		var styledString = styleHtmlEscaped(this.string, this.regexp, function(e) {return e;}, colors);
        var styledResult = styleHtmlEscaped(this.string, this.regexp, this.replacement, colors);

        this.$stringView.html(styledString);
        this.$resultsView.html(styledResult);
    };

    function styleHtmlEscaped(string, regexp, replacer, colors) {
    	var match;
    	var matches = [];
    	
        do {
            match = regexp.exec(string);
            if(match !== null) {
                matches.push(match);    
            }
            
        } while (match !== null && regexp.global === true && regexp.lastIndex !== string.length);
        regexp.lastIndex = 0;

    	var result = "";
    	var currentMatch;
    	var matchIdx = 0;
    	var i = 0;

    	while(i < string.length) {
    		if(matches.length !== 0) {
    			currentMatch = matches[0];
    		}
    		
    		if(currentMatch !== undefined && currentMatch.index == i) {
    			var color = colors[matchIdx % colors.length];

    			var replacement = (replacer instanceof Function) ? replacer(currentMatch[0]) : currentMatch[0].replace(currentMatch[0], replacer);
    			result = result + "<span style=\"background-color: " + color + ";\">" + escapeHtml(replacement) + "</span>";
    			i += currentMatch[0].length;
    			matches = matches.slice(1);
    			matchIdx++;
    		} else {
    			result += escapeHtml(string.substr(i, 1));
    			i++;
    		}
    	}

    	return result;
    }

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
