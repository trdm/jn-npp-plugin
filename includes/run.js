// глобальная переменная с меню скриптами.
if (!jN.scriptsMenu_jN){
	var scriptsMenu_jN = Editor.addMenu("Скрипты jN");
	jN.scriptsMenu_jN = scriptsMenu_jN;
} else { 
	scriptsMenu_jN = jN.scriptsMenu_jN;
}

(function(){
	var runMenu = scriptsMenu_jN.addMenu("Run");

	var rview = {
		text:"Current View\tF5",
		key: 116,
		//ctrl:true,
		cmd: function(){
			addScript(Editor.currentView.text);
		}
	};
	runMenu.addItem(rview);
	addHotKey(rview);

	var rsel = {
		text:"Selection\tShift+F5",
		shift:true,
		key:116,
		cmd: function(){
			addScript(Editor.currentView.selection);
		}
	};
	addHotKey(rsel);
	runMenu.addItem(rsel);

	var rclip = {
		text:"Clipboard\tCtrl+F5",
		ctrl:true,
		key:116,	
		cmd: function(){
			addScript(System.clipBoard);
		}
	};
	runMenu.addItem(rclip);
	addHotKey(rclip);
})();