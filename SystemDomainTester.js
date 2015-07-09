(function() {

	function MockDomainController() {}

	MockDomainController.prototype.hasDomain = function() {
			return true;
		},

	MockDomainController.prototype.registerCommand = function() {
		var argsArray = Array.prototype.slice.call(arguments);
		console.log(JSON.stringify(argsArray));
	}

	var system = require("./SystemDomain.js");
	assert(system !== undefined, "Failed to load the SystemDomain");

	system.init(new MockDomainController());
	system._openInBrowser("http://google.com");

	function assert(condition, message) {
    	if (!condition) {
        	message = message || "Assertion failed";
        	if (typeof Error !== "undefined") {
            	throw new Error(message);
        	}
        	throw message; // Fallback
    	}
	}

}());