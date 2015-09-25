/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

define(function(require, exports, module){
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var NodeDomain = brackets.getModule("utils/NodeDomain");
    var VariableTraceDomain = new NodeDomain("VariableTraceDomain", ExtensionUtils.getModulePath(module, "node_modules/ContextCollector/VariableTraceDomain"));

    exports.getTraceForCode = function(sourceCode) {
        var deferred = $.Deferred();

        VariableTraceDomain.exec("getTraceForCode", sourceCode)
        .done(function(trace) {
            deferred.resolve(JSON.parse(trace, reviver));
        }).fail(function(error) {
            deferred.reject(error);
        });

        return deferred.promise();
    };

    var reviver = function(key, value) {
        if (value.__type && value.__type === "RegExp") {
            var flags = [];

            if (value.global) flags.push("g");
            if (value.multiline) flags.push("m");
            if (value.ignoreCase) flags.push("i");

            return new RegExp(value.source, flags);
        }

        if (value.__type && value.__type == "Function") {
            /*jslint evil: true */
            return new Function(value.params, value.body);
        }

        return value;
    };
});