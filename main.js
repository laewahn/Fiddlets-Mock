/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, CodeMirror, brackets, less, $, WebSocket, window */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit = brackets.getModule('utils/AppInit');
	var Menus = brackets.getModule("command/Menus");
	var CommandManager  = brackets.getModule("command/CommandManager");

	var Dialogs = brackets.getModule("widgets/Dialogs");
  	var DefaultDialogs = brackets.getModule("widgets/DefaultDialogs");
    
    AppInit.appReady(function () {
    	CommandManager.register("Start Fiddlets Study", "Fiddlets.Study.start", startStudy);

    	var debugMenu = Menus.getMenu("debug-menu");
    	debugMenu.addMenuDivider();
    	debugMenu.addMenuItem("Fiddlets.Study.start");
    	console.log("FiddletsStudy", "App ready...");
    });

    function startStudy() {
    	console.log("FiddletsStudy", "Starting fiddlets study...");

    	// get the participants ID
    	var $dialogContent = $(require('text!./dialog-participantId.html'));

    	var dialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, 
    										 "Enter participant ID",
    										 $dialogContent.html(),
    										 [{
    										 	id: 'continue',
    										 	text: 'Continue',
    										 	className: Dialogs.DIALOG_BTN_OK
    										 }],
    										 true
		);

        dialog.done(function(e) {
            console.log("Dialog promise done!");
        });

    	// open the survey
    	// open the first task
    }
    
});