(function SystemDomain() {
	
	var commands = [
		{
			name: "openInBrowser",
			description: "Open the URL in the default browser",
			parameterDescription: [{
				name: "url",
				description: "The URL",
				type: "string"
			}],
			returnDescription: "none",
			exec: exports._openInBrowser
		}
	];

	exports._openInBrowser = function(url) {
		var childProcess = require("child_process");
		childProcess.spawn("open", [url]);
	}

	var DOMAIN_NAME = "FiddletsMockStudy_SystemDomain";
	var DOMAIN_VERSION = {
		major: 1,
		minor: 0
	};

	exports.init = function(domainManager) {
		if(!domainManager.hasDomain(DOMAIN_NAME)) {
			domainManager.registerDomain(DOMAIN_NAME, DOMAIN_VERSION);
		}

		commands.forEach(function(command) {
			domainManager.registerCommand(
				DOMAIN_NAME,
				command.name,
				command.exec,
				command.isAsync || false,
				command.parameterDescription,
				command.returnDescription
			);
		});
	}

}());