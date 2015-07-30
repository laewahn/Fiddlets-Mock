/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true, bitwise: true */
/*global define, brackets, $ */

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
    	CommandManager.register("Start Fiddlets Study", "Fiddlets.Study.start", startStudy);

    	var debugMenu = Menus.getMenu("debug-menu");
    	debugMenu.addMenuDivider();
    	debugMenu.addMenuItem("Fiddlets.Study.start");
    	console.log("FiddletsStudy", "App ready...");

        var configText = require("text!tasksConfig.json");
        config = JSON.parse(configText);
        console.log(JSON.stringify(config));

        startStudy();
    });

    function startStudy() {
    	console.log("FiddletsStudy", "Starting fiddlets study...");

        var projectRoot = ProjectManager.getProjectRoot();
        console.log("Opened project root: " + projectRoot.fullPath);

        FileViewController.openFileAndAddToWorkingSet(projectRoot.fullPath + "/mustache.js");

    	// get the participants ID
    	// getParticipantID();
    	// open the survey
    	// open the first task
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
    


    var EditorManager = brackets.getModule("editor/EditorManager");
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;

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

    var widgetContainer = require("text!inline-widget-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "inline-widget-template.css");

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    function StudyEditor(config) {
        InlineWidget.call(this);
        this.config = config;
        this.$htmlContent.append($(widgetContainer));
    }

    StudyEditor.prototype = Object.create(InlineWidget.prototype);
    StudyEditor.prototype.constructor = StudyEditor;
    StudyEditor.prototype.parentClass = InlineWidget.prototype;

    StudyEditor.prototype.contextEditor = undefined;
    StudyEditor.prototype.currentLineEditor = undefined;
    StudyEditor.prototype.config = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        if (this.config.context !== undefined) {
            var contextEditorContainer = this.$htmlContent.find("#context-editor").get(0);
            this.contextEditor = new CodeMirror(contextEditorContainer, {
                value: this.config.context,
                mode: "javascript",
                lineNumbers: true
            });
        }

        var currentLineEditorContainer = this.$htmlContent.find("#current-line-editor").get(0);
        this.currentLineEditor = new CodeMirror(currentLineEditorContainer, {
            value: this.config.currentLine,
            mode: "javascript",
            lineNumbers: false
        });

        if (this.config.unknownVariables !== undefined) {
            var $unknownVariables = this.$htmlContent.find("#unknown-variables");
            Object.keys(this.config.unknownVariables).forEach(function(unknownVar) {
                $unknownVariables.append(unknownVar + " = ");
                var traceValues = this.config.unknownVariables[unknownVar];
            
                var selectField = $("<select></select>");
                traceValues.forEach(function(traceVal) {
                    $("<option>" + traceVal + "</option>").appendTo(selectField);
                });

                $unknownVariables.append(selectField).append("<br/>");
            }, this);
        }
        
    };

});