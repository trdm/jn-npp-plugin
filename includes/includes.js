// глобальная переменная с меню скриптами.
if (!jN.scriptsMenu_jN){
	var scriptsMenu_jN = Editor.addMenu("Скрипты jN");
	jN.scriptsMenu_jN = scriptsMenu_jN;
} else { 
	scriptsMenu_jN = jN.scriptsMenu_jN;
}


(function(){
	var incMenu = scriptsMenu_jN.addMenu("Includes");

	var includeDir = require.currentDir+"\\includes";
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var incDirObj = fso.GetFolder(includeDir);
	var openF = function(){
		Editor.open(this.path);
	}
	if (incDirObj){
		var filesEnum = new Enumerator(incDirObj.files);
		for (; !filesEnum.atEnd(); filesEnum.moveNext()){
			var file = filesEnum.item().Path;
			if (/\.js$/i.test(file)){
				incMenu.addItem({
					path:file,
					text:filesEnum.item().Name,
					cmd:openF
				});
			}
		}
	}
})();