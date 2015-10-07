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
    	CommandManager.register("Start Fiddlets Study Watcher", "Fiddlets.Study.startStudyWatcher", startStudyWatcher);

    	var debugMenu = Menus.getMenu("debug-menu");
    	debugMenu.addMenuDivider();
    	debugMenu.addMenuItem("Fiddlets.Study.startStudyWatcher");
    	console.log("FiddletsStudy", "App ready...");

        startStudyWatcher();
    });

    function startStudyWatcher() {
        config = JSON.parse(require("text!tasksConfig.json"));
        
        var toolbar = new StudyToolbar();
        $(".content").prepend(toolbar.$container);

        function checkRootDirectoryAndPrepareIfTask(event, projectRootDirectory) {
            if(isTaskDirectory(projectRootDirectory)) {
                prepareTask(projectRootDirectory);
                toolbar.setStartStopEnabled(true);
            } else {
                toolbar.setStartStopEnabled(false);
            }
        }

        ProjectManager.on("projectOpen", checkRootDirectoryAndPrepareIfTask);
        checkRootDirectoryAndPrepareIfTask(null, ProjectManager.getProjectRoot());

        console.log("FiddletsStudy", "Watcher started");
    }

    function isTaskDirectory(projectRootDirectory) {
        var projectMatcher = /^Task\s[1-4]/g;

        return projectMatcher.test(FileUtils.getBaseName(projectRootDirectory.fullPath));
    }

    function prepareTask(projectRootDirectory) {
        var taskName = FileUtils.getBaseName(projectRootDirectory.fullPath);
        console.log("FiddletsStudy", "Preparing task " + taskName);

        FileViewController.openFileAndAddToWorkingSet(projectRootDirectory.fullPath + "/mustache.js");
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
        inlineEditor.currentLineCode = hostEditor.document.getLine(position.line).trim();

        return new $.Deferred().resolve(inlineEditor);
    }

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "toolbar.css");

    function StudyLog() {
        this.taskRunning = false;
    }

    StudyLog.prototype.constructor = StudyLog;

    StudyLog.prototype.taskRunning = undefined;
    
    StudyLog.prototype.startTask = function() {
        this.taskRunning = true;
    }

    StudyLog.prototype.finishTask = function() {
        this.taskRunning = false;
    }

    function StudyToolbar(studyLog) {
        this.studyLog = studyLog;

        this.$container = $(require("text!toolbar.html"));
        this.$startStopTaskButton = this.$container.find("#task-start-stop-button");

        function updateStartStopButton(button) {
            button.html("Hand in task.");
        }

        this.$startStopTaskButton.on("click", function() {
            console.log("Study toolbar button", "was clicked.");
            updateStartStopButton($(this));
        });
        this.setStartStopEnabled(false);
    }

    StudyToolbar.prototype.constructor = StudyToolbar;

    StudyToolbar.prototype.$container = undefined;
    StudyToolbar.prototype.$startStopTaskButton = undefined;

    StudyToolbar.prototype.studyLog = undefined;

    StudyToolbar.prototype.setStartStopEnabled = function (isEnabled) {
        this.$startStopTaskButton.prop("disabled", !isEnabled);
    } 

});