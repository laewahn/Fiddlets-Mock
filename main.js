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

    AppInit.appReady(function () {
    	CommandManager.register("Start Fiddlets Study", "Fiddlets.Study.start", startStudy);

    	var debugMenu = Menus.getMenu("debug-menu");
    	debugMenu.addMenuDivider();
    	debugMenu.addMenuItem("Fiddlets.Study.start");
    	console.log("FiddletsStudy", "App ready...");

        var projectRoot = ProjectManager.getProjectRoot();
        var configText = require("text!tasksConfig.json");
        var config = JSON.parse(configText);
        console.log(JSON.stringify(config));

        ProjectManager.on("projectOpen", function() {
            
            console.log("Opened project root: " + projectRoot.fullPath);

            FileViewController.openFileAndAddToWorkingSet(projectRoot.fullPath + "/mustache.js");
        });
    });

    function startStudy() {
    	console.log("FiddletsStudy", "Starting fiddlets study...");

    	// get the participants ID
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

    	// open the survey
    	// open the first task
    }
    


    var EditorManager = brackets.getModule("editor/EditorManager");
    var InlineWidget = brackets.getModule("editor/InlineWidget").InlineWidget;

    EditorManager.registerInlineEditProvider(editorProvider, 2);

    function editorProvider(hostEditor, position) {
        var inlineEditor = new StudyEditor();
        inlineEditor.load(hostEditor);
        return new $.Deferred().resolve(inlineEditor);
    }

    var widgetContainer = require("text!inline-widget-template.html");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    ExtensionUtils.loadStyleSheet(module, "inline-widget-template.css");

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    function StudyEditor() {
        InlineWidget.call(this);
        this.$htmlContent.append($(widgetContainer));
    }

    StudyEditor.prototype = Object.create(InlineWidget.prototype);
    StudyEditor.prototype.constructor = StudyEditor;
    StudyEditor.prototype.parentClass = InlineWidget.prototype;

    StudyEditor.prototype.contextEditor = undefined;
    StudyEditor.prototype.currentLineEditor = undefined;

    StudyEditor.prototype.onAdded = function() {
        StudyEditor.prototype.parentClass.onAdded.apply(this, arguments);
        this.hostEditor.setInlineWidgetHeight(this, 500);

        var contextEditorContainer = this.$htmlContent.find("#context-editor").get(0);
        this.contextEditor = new CodeMirror(contextEditorContainer, {
            value:  "var regExpMetaCharacters = /* Replace this: */ /\S/g /* with your regexp */;\n" +
                    "var replacement = '\\$&';",
            mode: "javascript",
            lineNumbers: true
        });

        var currentLineEditorContainer = this.$htmlContent.find("#current-line-editor").get(0);
        this.currentLineEditor = new CodeMirror(currentLineEditorContainer, {
            value: "string.replace(regExpMetaCharacters, replacement);",
            mode: "javascript",
            lineNumbers: false
        });
    };

});