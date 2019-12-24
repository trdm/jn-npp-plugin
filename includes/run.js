(function(){
	var runMenu = Editor.addMenu("Run");

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

	var rsel_msg = {
		text:"Selection\tCtrl+Shift+F5",
		ctrl:true,
		shift:true,
		key:116,
		cmd: function(){
			var scr_t = ""+Editor.currentView.selection;
			var res = ""+eval(scr_t);
			message(scr_t+" = "+res);
		}
	};
	addHotKey(rsel_msg);
	runMenu.addItem(rsel_msg);

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