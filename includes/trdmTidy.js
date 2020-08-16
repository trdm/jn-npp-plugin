var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gTempFolder = Editor.nppDir +"\\plugins\\jN\\Intell\\";
var gTidyConfig = "tidy_config.txt";
var gTidyConfigFPath = Editor.nppDir +"\\plugins\\jN\\Intell\\"+gTidyConfig;
var gTidyExe = Editor.nppDir +"\\plugins\\jN\\system\\tidy.exe";
var gShell = new ActiveXObject("WScript.Shell");



var scriptsMenu;
if (!jN.scriptsMenu){
	scriptsMenu = Editor.addMenu("Скрипты");
	jN.scriptsMenu = scriptsMenu;
} else { 
	scriptsMenu = jN.scriptsMenu;
}
function saveToFile(psDumpString, psFileName){
	var File;
	var vFExist = gFSO.FileExists( psFileName );
	if (!vFExist) {
		File = gFSO.CreateTextFile( psFileName, false);
	} 
	if(vFExist) {              
		File0 = gFSO.GetFile( psFileName );
		File = File0.OpenAsTextStream(1);
		if (File0.Size > 0) {
			TextStream = File.ReadAll();
			if (InStr(LCase(TextStream), LCase(psDumpString))>0) {
				File.Close();
				return;
			}
		}
		File = File0.OpenAsTextStream(8);

	}
	File.WriteLine(psDumpString);
	File.Close();
}

function extractTextBetween(psText, psTag){
	var rv = psText;
	var vTagStart = "<"+psTag+">";
	var vTagEnd = "</"+psTag+">";
	var idx = rv.lastIndexOf(vTagStart);
	if(idx) {
		rv = rv.substring(idx + vTagStart.length);
	}
	idx = rv.lastIndexOf(vTagEnd);
	if(idx) {
		rv = rv.substring(0, idx);
	}	
	return rv;
}


function extractNecessaryText(psText) {
	var rv = psText;
	var vOtherCase = false;
	var idx = rv.lastIndexOf("<body>");
	var idx2 = rv.lastIndexOf("</body>");
	if((idx2 - idx) <10 ) { //  <body>\n</body> присутствует. 
		rv = extractTextBetween(rv,"html");    
		idx = rv.lastIndexOf("<body>");
		if(idx >= 0) {
			rv = rv.substring(0, idx);
        }
    } else {
		rv = extractTextBetween(rv,"body");
	}
	return rv;
}

function formatText(psSelText) {
	var rv = psSelText;
	if(!gFso.FileExists(gTidyExe)) {
		return rv;
    }
	//debugger;
	var dt = new Date;
	var vTempFile1 = formatData(dt,"yyyyMMdd_hhmmss_ms")+".html";
	var vTempFile1F = gTempFolder +  vTempFile1;
	var vTempFile2 = formatData(dt,"yyyyMMdd_hhmmss_ms2")+".html";
	var vTempFile2F = gTempFolder + vTempFile2;
	saveToFile(rv, vTempFile1F);
	gShell.CurrentDirectory = gTempFolder;
	var gFilePath = gFso.GetFile(gTidyExe);	
	var cmdLine = ""+gFilePath.ShortPath+" -i -o "+ vTempFile2; //var cmdLine = ""+gFilePath.ShortPath+" -i -o "+ vTempFile2 + " -raw --wrap 120 " + vTempFile1;
	if(gFso.FileExists(gTidyConfigFPath)) {
		cmdLine = cmdLine + " -config "+gTidyConfig+" ";
    }
	cmdLine = cmdLine + " -raw --wrap 200 " + vTempFile1;	//message(cmdLine);
	gShell.Run(cmdLine,0,true);
	
	rv = loadFromFile(vTempFile2F);
	if (rv ) {
	    var vBodyPresentSrc = psSelText.indexOf('<body>');
	    var vBodyPresent = rv.indexOf('<body>');
	    if(vBodyPresentSrc == -1 && vBodyPresent>0) {    
		    // если добавлены теги. Даже с настройками не хочет убирать разметку.
		    rv = extractNecessaryText(rv);
        }	
    	
	    gFso.DeleteFile(vTempFile2F);
	    gFso.DeleteFile(vTempFile1F);
	}  else {
	    rv = '';
	}
	return rv;
}

// форматирование выделения
function myFormatTextPlus(psLang) {
	var rv = '';
	var selText = ""; 	
	var selText = Editor.currentView.selection;
	var selText2 = '';
	var useSelection = true;
	if(selText.length == 0) {
		useSelection = false;
		selText = Editor.currentView.text;
	}
	if(selText.length > 0) {
		var selText2 = '';
		if(psLang == 'html') {
			selText2 = formatText(selText);
        } else if(psLang == 'js') {
			var jsdecoder = new JsDecoder();
			jsdecoder.s = selText;
			selText2 = jsdecoder.decode();
        }
		if(selText2 != selText && selText2 != '') {
			if(useSelection) {
				Editor.currentView.selection = selText2;
            } else {
				Editor.currentView.text = selText2;
			}
        }
    
    }	
	return rv;
}

// форматирование выделения
function myFormatText() {
	if(IntellPlus.debugMode()) {    	debugger;    }
	var rv = '';
	IntellPlus.init();
	var isNew = IntellPlus.isNewFile();
	var vLang = 'html';
	if((IntellPlus.curExtension == "js" || IntellPlus.curLang == "js")){
		 vLang = 'js';
	} else 	if((IntellPlus.curExtension == "html" || IntellPlus.curExtension == "htm")) {        
		vLang = 'html';
    } else 	if(isNew) {	
		vLang = 'html';
    }
	if(vLang != '') {
		myFormatTextPlus(vLang);    
    }
	return rv;
}


// структура для добавления хоткея и меню
var myFormatTextCommand = {
    text: "Форматировать \tCtrl+Y", 
    ctrl: true,    shift: false,    alt: false,
    key: 0x59, // "F1"
    cmd: myFormatText
};

addHotKey(myFormatTextCommand); 
scriptsMenu.addItem(myFormatTextCommand);

function getExt(psFileName) {
	var rv = '';
	var vIdx = psFileName.lastIndexOf(".");
	if(vIdx != -1) {
		rv = psFileName.substring(vIdx + 1);
		rv = rv.toLowerCase();
    }
	return rv;
}

function formatHtmlFile( psFileName, psAll, psCur ) {
	var rv = '';
	var vCurFile = gFso.GetFile(psFileName);
	
	gShell.CurrentDirectory = vCurFile.ParentFolder.Path;	//			"C:\Progekts\chm\__asm\Assembler_cf\Src"	String
	var vTempFile = "\""+vCurFile.Name+"\"";
	var gFilePath = gFso.GetFile(gTidyExe);	
	var cmdLine = "";
	// удаляет гугле скрипты, но не все скрипты.
	cmdLine = ""+gFilePath.ShortPath+" -i -gdoc -o "+ vTempFile + " -raw --wrap 250 " + vTempFile;	//message(cmdLine);
	cmdLine = ""+gFilePath.ShortPath+" -i -o "+ vTempFile + " -raw --wrap 250 " + vTempFile;	//message(cmdLine);
	var cmdLineAdd = '('+psAll+ '/'+psCur+') ';
	message(cmdLineAdd +  cmdLine);
	gShell.Run(cmdLine,0,true);
	
	return rv;
}

function myFormatHtmlFiles() {
	//debugger;
	var rv = '';
	IntellPlus.init();
	var vCurFilePath = IntellPlus.curPathFile;
	if(!gFso.FileExists(vCurFilePath)) {
		message('File not saved!');
		return;
    }
	//debugger;
	var vCurFile = gFso.GetFile(vCurFilePath);
	var vFolder = vCurFile.ParentFolder;
	

	var vFile = gFso.GetFile(vCurFilePath);
	
	// сначала подсчитаем
	var vCntFiles = 0, vCntr = 0;
	var fc = new Enumerator(vFolder.Files);
	for (; !fc.atEnd(); fc.moveNext())
	{
		vFile = fc.item();
		var vFileName = vFile.Name;	//"Assembler_cf.chm"	String
		var vExt = getExt(vFileName);
		if(vExt == 'html' || vExt == 'htm') {
			//formatHtmlFile(vFile.Path);
			vCntFiles++;
        }
	}	
	fc = new Enumerator(vFolder.Files);
	for (; !fc.atEnd(); fc.moveNext())
	{
		vFile = fc.item();
		var vFileName = vFile.Name;	//"Assembler_cf.chm"	String
		var vExt = getExt(vFileName);
		if(vExt == 'html' || vExt == 'htm') {
			vCntr++;
			formatHtmlFile(vFile.Path, vCntFiles, vCntr);
        }
	}	
	message("Форматирование завершено!");
	
	return rv;
}

var myFormatTextCommand = {
    text: "Форматировать *.html (тек.дир) \tCtrl+true+Y", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x59, // "Y"
    cmd: myFormatHtmlFiles
};

addHotKey(myFormatTextCommand); 
scriptsMenu.addItem(myFormatTextCommand);
