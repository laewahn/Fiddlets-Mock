/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

// TODO
/*
 * 1. Wait for project change
 * 2. Check if project is task (root name starts with "Task", contains description.pdf)
 * 3. If task, open description.pdf, open mustache.js, open terminal
 * 4. Add menu bar with "start task" button
 */

define(function (require, exports, module) {
    "use strict";
    
    var AppInit = brackets.getModule("utils/AppInit");
	var Menus = brackets.getModule("command/Menus");
	var CommandManager  = brackets.getModule("command/CommandManager");

	var Dialogs = brackets.getModule("widgets/Dialogs");
  	var DefaultDialogs = brackets.getModule("widgets/DefaultDialogs");
    
    var FileViewController = brackets.getModule("project/FileViewController");
    var ProjectManager = brackets.getModule("project/ProjectManager");
    var FileUtils = brackets.getModule("file/FileUtils");

    var config;

    AppInit.appReady(function () {
    	CommandManager.register("Start Fiddlets Study Watcher", "Fiddlets.Study.startStudyWatcher", startStudy);

    	var debugMenu = Menus.getMenu("debug-menu");
    	debugMenu.addMenuDivider();
    	debugMenu.addMenuItem("Fiddlets.Study.startStudyWatcher");
    	console.log("FiddletsStudy", "App ready...");
    });

    function startStudy() {
    	var configText = require("text!tasksConfig.json");
        config = JSON.parse(configText);

        ProjectManager.on("projectOpen", prepareTask);
    }

    function prepareTask() {
        var projectRoot = ProjectManager.getProjectRoot();
        var taskName = FileUtils.getBaseName(projectRoot.fullPath));
        console.log("FiddletsStudy", "Starting task " + taskName;

        FileViewController.openFileAndAddToWorkingSet(projectRoot.fullPath + "/mustache.js");
    }

    function getParticipantID() {
        var $dialogContent = $(require("text!./dialog-participantId.html"));

        var dialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, 
                                             "Enter participant ID",
                                             $dialogContent.html(),
                                             [{
                                                id: "continue",
                                                text: "Continue",
                                                className: Dialogs.DIALOG_BTN_OK
                                             }],
                                             true
        );

        dialog.done(function() {
            console.log("Dialog promise done!");
        });
    }
    
    var StudyEditor = require("StudyEditor");

    var EditorManager = brackets.getModule("editor/EditorManager");
    EditorManager.registerInlineEditProvider(editorProvider, 2);

    function editorProvider(hostEditor, position) {
        var currentTask = FileUtils.getBaseName(ProjectManager.getProjectRoot().fullPath);

        console.log("Tasks name is: " + currentTask);
        var configForLine = config[currentTask][position.line + 1];
        if(configForLine === undefined) return "No information available for this line.";

        var inlineEditor = new StudyEditor(configForLine);
        inlineEditor.load(hostEditor);
        return new $.Deferred().resolve(inlineEditor);
    }

    

});