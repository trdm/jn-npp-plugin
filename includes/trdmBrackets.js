var gBr_js = new ActiveXObject("Scripting.Dictionary");
var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gBrFolder = Editor.nppDir +"\\plugins\\jN\\Intell\\\Brackets\\";
var gCurentFileDirPath = "";
var gCurentFilePath = "";

var gCurentBr = '(.)';
var gCurentSelText = '';
var gCurentTemplateText = '';
var gCurentTemplateData = '';


function getExtension(psFileName) {
	var rv = "";
	var vLi = psFileName.lastIndexOf(".")+1;
	if(vLi != -1) {
		rv = psFileName.substring(vLi);
    }	
	return rv;
}

function addToBrDict(psOperator) {
	var rv = psOperator;
	var rv2 = psOperator;
	if(rv == "") {
		return rv;
    }
	rv2 = rv2.replace(".","");
	try { 
		gBr_js.Add(rv,rv2);
	} catch(e) {
		
	}	
	return rv;
}

function getEngTextOnly(psText) {
//	debugger;
	var rv = '';
	var vChr = '';
	var vEngChars = 'abcdefghijklmnopqrstuvwxyz';
	var vRusChars = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
	for(var i = 0; i< psText.length; i++) {
		vChr = psText.charAt(i);
		vChr = vChr.toLowerCase();
		if(vRusChars.indexOf(vChr) == -1) {
			rv += psText.charAt(i);
        }		
    }
	return rv;
}

//getEngTextOnly('Семейство микропроцессоров Pentium');
function getCurentFileFolderPath() {
	var rv = '';
	view = Editor.currentView;
	gCurentFilePath = view.files[view.file];
	if (gCurentFilePath != undefined) {
		rv = gCurentFilePath;
		var vFileObj = gFso.GetFile(gCurentFilePath);
		gCurentFileDirPath = vFileObj.ParentFolder.Path;
	} else {
		gCurentFilePath = "";
	}
	return rv;
}
//getCurentFileFolderPath();

function findFileByName(psFolder, psPartFileName, psOpt) {
	var rv = ''; // Пустое имя файла
	var fc_folder = new Enumerator(psFolder.SubFolders);
	for (fc_folder.moveFirst(); !fc_folder.atEnd(); fc_folder.moveNext()) {
		var vFolderObj = fc_folder.item();
	    var fc_files = new Enumerator(vFolderObj.Files);
	    for (fc_files .moveFirst(); !fc_files.atEnd(); fc_files.moveNext()) {
		    var vFile = fc_files.item();
		    if (vFile.Name.indexOf(psPartFileName+'.') == 0) {
		        rv = vFile.Path;
		        return rv;
		    }
	    }
	    rv = findFileByName(vFolderObj, psPartFileName, psOpt);
	    if (rv != '') return rv;
	}
	return rv;
}

function selectExistFileName(values) {
	
    try    {
        var sel = new ActiveXObject('Svcsvc.Service')
    }
    catch(e)    {
		var strMess = "Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll";
        message(strMess)
        return false;
    }
	var vFiltrExam = "Файлы метаданных|*.md|Текстовые файлы (*.txt)|*.txt|Все файлы|*";
	var vFiltr = "Все файлы|*";
	try { 
		retVal = sel.SelectFile(false,values,vFiltr,false); //<< \todo
    } catch(e) {
		retVal = "";    
    }
   return retVal;    
}


function ensureSlash(psPath) {
	var rv = psPath;
	if(rv[rv.length] != "\\") {
		rv += "\\";
    }
	return rv;
}

function clearString(psStr, psKillFragm) {
	var rv = psStr;
	while(rv.indexOf(psKillFragm) != -1) {
    	rv = rv.replace(psKillFragm,'');
    }
	return rv;
}

function testTranslateTemplate(psTemlp, psSelText) {
	var rv = true;
	if(psTemlp.indexOf("%get_exist_file_name%") != -1) {
//debugger;
		rv = false;		
		if(gCurentFilePath == '') {
			return rv;
        }
		var vSellText = psSelText;
		vSellText = clearString(vSellText,':'); // иначе кое чего не работает
		vSellText = clearString(vSellText,'\\'); 
		vSellText = clearString(vSellText,'<'); 
		vSellText = clearString(vSellText,'>'); 
		vSellText = clearString(vSellText,'/'); 
		vSellText = clearString(vSellText,'"'); 
		vSellText = clearString(vSellText,"'"); 
		gCurentTemplateText = "%get_exist_file_name%";
		gCurentTemplateData = '';
		
		var vParam = {entirely: 1};
		var vFileObj = gFso.GetFile(gCurentFilePath);
		var vFolder = vFileObj.ParentFolder.ParentFolder;	
		var fName = findFileByName(vFolder,vSellText,1); // Задумывалось как поиск по части имени
		if(fName == '') {
			fName = selectExistFileName(vSellText);        
        }
		if(fName != '') {
			gCurentTemplateData = fName;
			var vFolder = gFso.GetFile(gCurentTemplateData).ParentFolder;
			var vFolderPath = vFolder.Path;
			if(gCurentTemplateData.indexOf(gCurentFileDirPath) != -1) {
				var vP = gCurentFileDirPath;
				vP = ensureSlash(vP);
				gCurentTemplateData = gCurentTemplateData.replace(vP,'');
            }
			gCurentTemplateData = gCurentTemplateData.replace("\\","/");
			rv = true;
        }
    }
	return rv;
}

function translateTemplate(psStrTempl, psSelText) {
	var rv = psStrTempl;
	rv = rv.replace("%datatimemsstr%",formatData(new Date, "yyyyMMdd_HHmmssmis"));
	rv = rv.replace("%CurentSelText%",gCurentSelText);
	rv = rv.replace("%CST%",gCurentSelText);
	var vCurentSelTextEng = getEngTextOnly(gCurentSelText);
	if(gCurentTemplateText != "" && gCurentTemplateData != "") {
		rv = rv.replace(gCurentTemplateText,gCurentTemplateData);
    }
	return rv;
}

//testTranslateTemplate("<a href=""%get_exist_file_name%"">.</a>",selText)

function insertBracket() {
	if(IntellPlus.debugMode()) { debugger;    }
	
	var curView = Editor.currentView;
	var selText = curView.selection;
	var newSelText = selText;
	if(selText.length == 0) {
		return;
    }
	gCurentTemplateText = '';
	gCurentTemplateData = '';
	
	gCurentSelText = selText;
	var vCbArray = gCurentBr.split(".");
	if(vCbArray.length != 2) {
		return;
    }
	getCurentFileFolderPath();
	if(!testTranslateTemplate(gCurentBr,selText)) {
		return;
    }
	vCbArray[0] = translateTemplate(vCbArray[0],selText);
	vCbArray[1] = translateTemplate(vCbArray[1],selText);
	newSelText = "" + vCbArray[0] + selText + vCbArray[1];
	curView.selection = newSelText;	
}

function selectBracket() {
	var rv = '';
	reInitBr();
	if(gBr_js.Count == 0) {
		return;
    }
	var vKeys = gBr_js.Keys();
	
	
	var vVbsArr = (new VBArray(vKeys)).toArray();	// Get the keys.
	var vStr = "";
	for(var i = 0; i< gBr_js.Count; i++) {
		vStr += vVbsArr[i] + "\n";
    }

	rv = selectValue(vStr.split("\n"),"Выберите скобки!");
	if(rv.length > 0) {
		gCurentBr = rv;
		insertBracket();
    }
	return rv;
}

function reInitBr() {
	gBr_js = new ActiveXObject("Scripting.Dictionary");
	var vFolder = gFso.GetFolder(gBrFolder);
	var vFilesAra = new Array;
	var fc = new Enumerator(vFolder.Files);
	for (fc.moveFirst(); !fc.atEnd(); fc.moveNext()) {
		var vFileO = fc.item();
		var vFileNm = vFileO.Name;
		
		vFileNm = vFileNm.toLowerCase();
		var vExt = getExtension(vFileNm);
		if(vFileNm.indexOf("brackets") == -1) {
			continue;
        } else if(vExt != "txt") {
			continue;        
        }
		addToBrDict(gCurentBr);
		var vText = loadFromFile(vFileO.Path);
		var vLineAra = vText.split('\n');
		var vT = 200;
		var vLine = "";
		var vDelimIndent = "delim=";
		for(var i = 0; i< vLineAra.length; i++) {
			vLine = vLineAra[i];
			if(vLine.indexOf(vDelimIndent) != -1) {
				continue; // пока пропустим 
            }
			addToBrDict(vLine);			
        }		
		break; // предполагается? что файл один		
	}	
}


function initBr() {
	var rv = 0;
	if(gBr_js.Count > 0) {
		return;
    }
	reInitBr();
	
	return rv;
}

var gScriptsMenu;
// глобальная переменная с меню скриптами.
if (!jN.scriptsMenu){
	gScriptsMenu = Editor.addMenu("Скрипты");
	jN.scriptsMenu = gScriptsMenu;
} else { 
	gScriptsMenu = jN.scriptsMenu;
}

gScriptsMenu.addSeparator(); 

var myInsertBracket = {
    text: "Выбрать скобки  \tCtrl+B", 
    ctrl: true,    shift: false,    alt: false,
    key: 0x42, // "B key"
    cmd: insertBracket	
}
addHotKey(myInsertBracket); 
gScriptsMenu.addItem(myInsertBracket);


var mySelectBracket = {
    text: "Вставить скобки  \tCtrl+Shift+B", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x42, // "B key"
    cmd: selectBracket	
}
addHotKey(mySelectBracket); 
gScriptsMenu.addItem(mySelectBracket);


initBr();
//selectBracket();
//WScript.