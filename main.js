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
	
	var Dialogs = brackets.getModule("widgets/Dialogs");
  	var DefaultDialogs = brackets.getModule("widgets/DefaultDialogs");
    
    var FileViewController = brackets.getModule("project/FileViewController");
    var ProjectManager = brackets.getModule("project/ProjectManager");
    var FileUtils = brackets.getModule("file/FileUtils");
    var FileSystem = brackets.getModule("filesystem/FileSystem");
    var MainViewManager = brackets.getModule("view/MainViewManager");
    var EditorManager = brackets.getModule("editor/EditorManager");
    
    var StudyEditor = require("StudyEditor");

    var config;
    var lineConfigWithHandles = [];
    var toolbar;
    var studyEditorOpen = false;
    var studyLog = {};
    var taskName;

    AppInit.appReady(function () {
    	console.log("FiddletsStudy", "App ready...");
        
        toolbar = new StudyToolbar();
        $(".content").prepend(toolbar.$container);

        ProjectManager.on("projectOpen", checkRootDirectoryAndPrepareIfTask);
        checkRootDirectoryAndPrepareIfTask(null, ProjectManager.getProjectRoot());

        console.log("FiddletsStudy", "Watcher started");

        EditorManager.registerInlineEditProvider(editorProvider, 2);
    });

    function checkRootDirectoryAndPrepareIfTask(event, projectRootDirectory) {

        toolbar.reset();

        function isTaskDirectory(projectRootDirectory) {
            var projectMatcher = /^Task\s[1-5]/g;
            return projectMatcher.test(FileUtils.getBaseName(projectRootDirectory.fullPath));
        }

        var isTask = isTaskDirectory(projectRootDirectory);
        toolbar.setStartStopEnabled(isTask);
        
        toolbar.startCallback = function() {
            var filename = config[taskName].file;
            openTaskFile(filename, projectRootDirectory);

            console.log("Task started: " + taskName);
            studyLog.started = new Date();
        };

        toolbar.handInCallback = function(toolbar) {
            var handInDialog = Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO, 
                                             "Confirmation",
                                             "Click OK to hand in",
                                             [{
                                                id: "continue",
                                                text: "Ok",
                                                className: Dialogs.DIALOG_BTN_OK
                                             },{
                                                id: "cancel",
                                                text: "Cancel",
                                                className: Dialogs.DIALOG_BTN_OK
                                             }],
                                             true
            );

            handInDialog.done(function(buttonId) {
                console.log(buttonId);
                if (buttonId === "continue") {
                    console.log("Handed in: " + taskName);
                    studyLog.handedIn = new Date();
                    console.log(studyLog);
                    toolbar.handedIn();
                    writeStudyLogToFile(taskName, projectRootDirectory);
                }
            });
        };
        
        if(isTask) {
            config = JSON.parse(require("text!tasksConfig.json"));
            prepareTask(projectRootDirectory);
        }
    }

    function writeStudyLogToFile(name, root) {
        var newFile = FileSystem.getFileForPath(root.fullPath + "/" + name + ".log");
        console.log(JSON.stringify(studyLog, null, 2));
        FileUtils.writeText(newFile, JSON.stringify(studyLog, null, 2))
            .done(function() {
                Dialogs.showModalDialog(DefaultDialogs.DIALOG_ID_INFO,
                    "Success",
                    "Task was successfully handed in.",
                    [{
                        id: "continue",
                        text: "Ok",
                        className: Dialogs.DIALOG_BTN_OK
                    }],
                    true
                );
            });
    }

    function prepareTask(projectRootDirectory) {
        MainViewManager.off("currentFileChange");

        taskName = FileUtils.getBaseName(projectRootDirectory.fullPath);
        console.log("FiddletsStudy", "Preparing task " + taskName);
        
        studyLog = {
            "fiddletsOpened" : []
        };

        MainViewManager.on("currentFileChange", function() {
            registerLineConfigurationForLineHandles(config[taskName].lines);
        });
    }

    function openTaskFile(filename, projectRootDirectory) {
        console.log("FiddletsStudy", "Opening file " + filename);
        FileViewController.openFileAndAddToWorkingSet(projectRootDirectory.fullPath + "/" + filename);
    }

    function registerLineConfigurationForLineHandles(lineConfigs) {
        lineConfigWithHandles = [];

        var editor = EditorManager.getCurrentFullEditor();
        if (editor === null) {
            return;
        }

        Object.keys(lineConfigs).forEach(function(line) {
            var lineHandle = editor._codeMirror.getLineHandle(line - 1);
            lineConfigWithHandles.push({
                handle: lineHandle,
                config: lineConfigs[line]
            });
        });
    }


    var LineInfo = require("./LineInfoProxy");
    function editorProvider(hostEditor, position) {
        var currentTask = FileUtils.getBaseName(ProjectManager.getProjectRoot().fullPath);
        var fiddletsTracker = {
            opened: new Date()
        };

        studyLog.fiddletsOpened.push(fiddletsTracker);
        console.log(studyLog);
        console.log("Tasks name is: " + currentTask + " fiddlets opened: " + studyLog.fiddletsOpened.length);
        
        var currentLine = hostEditor.document.getLine(position.line).trim();
        console.log("CurrentLine: ", currentLine);
        var getLineInfo = LineInfo.infoForLine(currentLine);
        var configForLine = getLineConfigForLine(position.line);
        // if(configForLine === null) return "No information available for this line.";
        if(configForLine === null) configForLine = {};
        configForLine.unknownVariables = config[currentTask].unknownVariables;
        console.log("Unkown: ", configForLine.unknownVariables);

        var source = hostEditor.document.getText();
        var deferred = new $.Deferred();
        $.when(getLineInfo)
        .done(function(lineInfo) {
            console.log(lineInfo);

            configForLine.lineInfo = lineInfo;

            var inlineEditor = new StudyEditor(configForLine, source);
            
            inlineEditor.load(hostEditor);  
            inlineEditor.line = position.line;
    
            inlineEditor.currentLineCode = currentLine;
            inlineEditor.onClosed = function() {
                console.log("Fiddlets closed.");
                studyEditorOpen = false;
                fiddletsTracker.closed = new Date();
            };

            studyEditorOpen = true;
            deferred.resolve(inlineEditor);
        })
        .fail(function(error) {
            console.error(error);
        });

        return deferred;
    }

    function getLineConfigForLine(line) {
        var i;
        for(i = 0; i < lineConfigWithHandles.length; i++) {
            var handle = lineConfigWithHandles[i].handle;
            var config = lineConfigWithHandles[i].config;
            
            if (handle.lineNo() === line) {
                return config;
            }
        }

        return null;
    }

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "toolbar.css");

    function StudyToolbar() {

        this.$container = $(require("text!toolbar.html"));
        this.$startStopTaskButton = this.$container.find("#task-start-stop-button");
        var that = this;

        function updateStartStopButton(button) {
            if (that.started === false) {
                that.startCallback();
                that.started = true;
                button.html("Hand in task");
            } else {
                that.handInCallback(that);
            }
        }

        this.$startStopTaskButton.on("click", function() {
            console.log("Study toolbar button", "was clicked.");
            updateStartStopButton($(this));
        });

        this.reset();
        this.setStartStopEnabled(false);
    }

    StudyToolbar.prototype.constructor = StudyToolbar;

    StudyToolbar.prototype.$container = undefined;
    StudyToolbar.prototype.$startStopTaskButton = undefined;

    StudyToolbar.prototype.started = false;
    StudyToolbar.prototype.startCallback = undefined;
    StudyToolbar.prototype.handInCallback = undefined;

    StudyToolbar.prototype.reset = function() {
        this.$startStopTaskButton.html("Start Task");
    };

    StudyToolbar.prototype.handedIn = function() {
        this.started = false;
        this.setStartStopEnabled(false);
    };

    StudyToolbar.prototype.setStartStopEnabled = function (isEnabled) {
        this.$startStopTaskButton.prop("disabled", !isEnabled);
    };
});