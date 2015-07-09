/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, CodeMirror, brackets, less, $, WebSocket, window */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit = brackets.getModule('utils/AppInit');
	var Menus = brackets.getModule("command/Menus");
	var CommandManager  = brackets.getModule("command/CommandManager");

    AppInit.appReady(function () {
    	CommandManager.register("Start Fiddlets Study", "Fiddlets.Study.start", startStudy);

    	var debugMenu = Menus.getMenu("debug-menu");
    	debugMenu.addMenuDivider();
    	debugMenu.addMenuItem("Fiddlets.Study.start");
    });

    function startStudy() {
    	// get the participants ID
    	// open the survey
    	// open the first task
    }
    
});