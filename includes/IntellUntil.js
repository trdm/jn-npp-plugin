var gHelpDoc; //HTMLDocument
var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gHelpFolder = Editor.nppDir +"\\plugins\\jN\\help\\";
var gHelpFolderTFrame = gHelpFolder+'index.html';
var gHelpFolderBFrame = gHelpFolder+'about.html';

var gHelpDocum = null;
var gHelpWindow = null;

var gUntilMenu = null; // var gTranslate = Editor.addMenu("MyMemory");
gUntilMenu = scriptsMenu.addMenu("UntilMenu");




function convertHTML_EntriesCyrilic(psStr) {
	//trdm: 2018-01-27 15:28:15
	//debugger;
	var vStr1 = '&Agrave;&Aacute;&Acirc;&Atilde;&Auml;&Aring;&die;&AElig;&Ccedil;&Egrave;&Eacute;&Ecirc;&Euml;&Igrave;&Iacute;&Icirc;&Iuml;&Dstrok;&Ntilde;&Ograve;&Oacute;&Ocirc;&Otilde;&Ouml;&times;&Oslash;&Ugrave;&Uacute;&Ucirc;&Uuml;&Yacute;&THORN;&szlig;&agrave;&aacute;&acirc;&atilde;&auml;&aring;&cedil;&aelig;&ccedil;&egrave;&eacute;&ecirc;&euml;&igrave;&iacute;&icirc;&iuml;&eth;&ntilde;&ograve;&oacute;&ocirc;&otilde;&ouml;&divide;&oslash;&ugrave;&uacute;&ucirc;&uuml;&yacute;&thorn;&yuml;'; 
	var vStr2 = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'; 
	var vMap = vStr1.split(';');
	var rv = psStr, vHr = '';
	for(var i = 0; i<vMap.length; i++) {
		var vFragm = vMap[i];
		vFragm += ';';
		// Фишка в том, то replace делает только одну замену, что-бы заменить все полностью, надо гонять цикл.
		while(rv.indexOf(vFragm) != -1) {
			vHr = vStr2.substring(i,i+1); //vStr2.substring(i,1);
			rv = rv.replace(vFragm,vHr);			
        }		
    }	
	return rv;	
}

function processHhcFile(psFName) {
	// эксплорером пройтись или парсинг устроить с заменой
	if(!gFso.FileExists(psFName)) {
		return;
    }
	var rv = loadFromFile(psFName);
	
	return rv;
}

function makeHelpDocs() {
	var rv = '';
	var vFolderPs = Editor.nppDir +"\\plugins\\jN\\help\\";
	if(!gFso.FolderExists(vFolderPs)) {
		return;    
    }
	var vFolder = gFso.GetFolder(vFolderPs);
	if(!vFolder) {
		return;
    }
	debugger;
	var vTextTframe = '';
	var vFolCol = new Enumerator(vFolder.SubFolders);
	vFolCol.moveFirst();
	while(vFolCol.atEnd() == false) {
		vSFolder = vFolCol.item();
		if(vSFolder.ShortName != 'dtree_img') {
			vFName_HHC = vSFolder.Path+vSFolder.Name+'.hhc';
			if(gFso.FileExists(vFName_HHC)) {
				
            
            }
        }
        vFolCol.moveNext();
    } 	
	return rv;
}

//convertHTML_Entries('&Iacute;&aring;&ecirc;&icirc;&ograve;&icirc;&eth;&ucirc;&aring; &icirc;&aacute;&uacute;&aring;&ecirc;&ograve;&ucirc; Automation');
// "Некоторые объекты Automation"
// "Некот&icircры &aring; &icirc;бъ&aring;&ecirc;&ograve;&ucirc; Automation"

//var strDoc = '<html><frameset rows = "50%, 50%" border = "6">	<frame src = "T:\\Web\\fr_left.htm"> <frame src = "T:\\Web\\rf_000000.htm" name = "price"></frameset>';
// done
function openHelp() {
	var rv = '';
	var strDoc = '';
	if(gHelpWindow) {
		return;
    }
	var option = {		
		name:'Документация',		
		docking:'right', 
		onclose:function(){
				gHelpWindow = '';
			}
		};	
	//debugger;
	// не хляют для MSIE '++' в пути. дурить начинает. пришлось перенести.
	//vPath = Editor.nppDir+'\\help\\'; 
	vPath = 'T:\\NppHelp\\help\\';	
	gHelpWindow = Editor.createDockable(option);
	//gHelpWindow.slient = true;
	var d = gHelpWindow.document;
	gHelpDocum = d;
	strDoc = '<html><head></head><frameset rows = "50%, 50%" border = "6">';
	strDoc +='<frame id = "frame_t" src = "'+vPath+'dtree.html">	<frame id = "frame_b" src = "'+vPath+'b_frame.html" name = "docs">';
	strDoc +='</frameset><noframes>ваш браузер не поддерживает фреймы</noframes>';

	d.write(strDoc);
	d.createComment();
	// Теперь надо заставить IE навигировать на нужную страницу в нижнем фрейме.
	//el.src = 'T:\\NppHelp\\help\\html\\Automatition\\HTML\\ObjectFSO_1.html';
	d.close();
	return rv;
}

var myHelpOpenCommand = {
    text: "Справка \tCtrl+F1", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x70, // "F1"
    cmd: openHelp	
};
// trdm 2018-08-15 07:54:24 - Отключаю, LanguageHelpU.dll - нормально
//scriptsMenu.addSeparator(); addHotKey(myHelpOpenCommand);  scriptsMenu.addItem(myHelpOpenCommand);


//}trdm: 2018-02-28 13:20:36


// 2017-11-17 14:52:19  formatData(Today,'yyyy-MM-dd HH:mm:ss');
function formatData(data, fmString) {
	//debugger;
	// yyyyMMdd_HHmmssmis
	var retVal = fmString;
	var re = /(dd|MMMM|MM|yyyy|yy|hh|HH|mm|ss|tt|ms|mis|S)/g;
	var monses = "январь,февраль,март,апрель,май,июнь,июль,август,сентябрь,октябрь,ноябрь,декабрь";
	var monsArr = monses.split(',');
	var td = {}
	td.hh = formatN(data.getHours(),2);
	td.mm = formatN(data.getMinutes(),2);
	td.ss = formatN(data.getSeconds(),2);
	td.DD = formatN(data.getDate(),2);
	td.MM = formatN(data.getMonth()+1,2);
	td.MMMM = monsArr[data.getMonth()];
	td.YY = formatN(data.getFullYear(),2);
	td.YYYY = formatN(data.getFullYear(),4);
	td.ms = formatN(data.getMilliseconds(),4);
		
	var reRe = "";
	while ((reRe = re.exec(fmString)) != null) {
		var fRes = reRe[0];
		switch(fRes) {
			case "hh":
			case "HH":
				retVal = retVal.replace(fRes,td.hh);
				break;
			case "ms":
			case "mis":
				retVal = retVal.replace(fRes,td.ms);
				break;
			case "mm":
				retVal = retVal.replace(fRes,td.mm);
				break;
			case "ss":
			case "SS":
				retVal = retVal.replace(fRes,td.ss);
				break;
			case "yyyy":
			case "YYYY":
				retVal = retVal.replace(fRes,td.YYYY);
				break;
			case "YY":
				retVal = retVal.replace(fRes,td.YY);
				break;
			case "dd":
			case "DD":
				retVal = retVal.replace(fRes,td.DD);
				break;
			case "MM":
				retVal = retVal.replace(fRes,td.MM);
				break;
			case "MMMM":
				retVal = retVal.replace(fRes,td.MMMM);
				break;
			default: {
				break;
			};
		}
	}
	return retVal;
}
//trdm: 2018-03-26 14:19:14
function test1() {
	var rv = new Array;
	rv[0] = 1;
	rv[1] = 100;
	rv[2] = 99;
	rv[3] = 7;
	message('#'+rv[0]+'_'+rv[1]+'_'+rv[2]+'_'+rv[3]);
	for(var i = 0; i<= 100; i++) {
		rv[0] += 1;
		rv[1] -= 2;
		rv[2] -= 3;
		rv[3] += 7;
		message('#'+rv[0]+'_'+rv[1]+'_'+rv[2]+'_'+rv[3]);
    }
	
	return rv;
}

function InputBox(psTxt, psCapt, psVal) {
	var rv = psVal;
	var so = new ActiveXObject("MSScriptControl.ScriptControl");
	so.Language = 'VBScript';
	var vCode = 
	' Function getInputNumber() \n'+
	' val = InputBox("'+psTxt+'","'+psCapt+'","'+psVal+'") \n'+
	' getInputNumber = val  \n'+
	'End Function \n';
	so.AddCode(vCode); 	
	rv = parseInt(so.Run("getInputNumber"));
	return rv;
}

// удаляем строки которые длинее n символов
function rowsOverLengthRemote(psOper) {
	var vOLen = 300;
	if(!psOper) {	psOper = 1;    }
	vOLen = InputBox('Input length',"For very long rows",vOLen);
	vOLen = parseInt(vOLen);
	if(vOLen <= 40 || vOLen == 0) {
		return;
    }
	// debugger;
	// return;
    var vTextAll = Editor.currentView.text;
    var vArr = vTextAll.split('\n');
    var vTextNeed = '';
	var vLine = '';
    for(var i = 0; i<vArr.length; i++) {
		vLine = vArr[i];
		if(vLine.length <= vOLen) {        
			vTextNeed = vTextNeed + '\n' + vLine;
        } else {
			if(psOper == 2) {
				message("Cut string N: "+i+' length" '+vLine.length+' >> '+vLine.substring(0, 500));
				vTextNeed = vTextNeed + '\n' + vLine.substring(0,vOLen);				
            } else if(psOper == 1) {
				message("Kill string N: "+i+' length" '+vLine.length+' >> '+vLine.substring(0, 500));
            }
			
		}
    }
    Editor.currentView.text = vTextNeed;    
}

var myKillVeryLengthRows = {
    text: "Удалить строки длинее N \tCtrl+Shift+K", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x4B, // "K key"
    cmd: rowsOverLengthRemote	
};


addHotKey(myKillVeryLengthRows); 
gUntilMenu.addItem(myKillVeryLengthRows);

function rowsOverLengthCut() {	rowsOverLengthRemote(2); }
var myCutVeryLengthRows = {
    text: "Обрезать строки длинее N ", 
    cmd: rowsOverLengthCut	
};
gUntilMenu.addItem(myCutVeryLengthRows);


// trdm 2018-04-10 14:58:14 {
function splitTheSelectedText() {
	//debugger;
	var rv = '';
	var vText = Editor.currentView.selection;
	var sLen = 110;
	var vTextLines = vText.split('\n');
	vText = '';
	for(var i = 0; i<vTextLines.length; i++) {
		var vLine = vTextLines[i];

		var steps = vLine.length / sLen;
		for (var s = 1; s<=steps; s++){
			var cPosS = /*s**/sLen;
			var cPosE = 0; //(s-1)*sLen;
			while(cPosS > cPosE) {
				charItem = vLine[cPosS];
				if (charItem == ' ' || charItem == '\t'){
					vText +=  trimSimple(vLine.substring(cPosE,cPosS)) +'\n';
					vLine = vLine.substring(cPosS)+'\n';
					// vLine[cPosS] = '\n';
					break;
				}
				cPosS--;
			}
		}
		vText += trimSimple(vLine) + '\n';		
    }
	Editor.currentView.selection = vText;
	return rv;
}

var mySplitTheSelectedText = {
    text: "Разбить строки на сегменты по 110 симв. \tCtrl+Shift+S", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x53, // "S key"
    cmd: splitTheSelectedText	
};

addHotKey(mySplitTheSelectedText); 
gUntilMenu.addItem(mySplitTheSelectedText);

function deleteEmptyLines() {
	//debugger;
	var v8Tab = '\t\t\t\t\t\t\t\t';
	var vText = Editor.currentView.text;
	var vTextLines = vText.split('\n');
	//vTextLines.sort();
	vText = '';
	for(var i = 0; i<vTextLines.length; i++) {
		var vLine = vTextLines[i];
		while(vLine.indexOf('\t') != -1 ){
			vLine = vLine.replace('\t','');			
		}
		vLine = vLine.replace('\r','');
		while(vLine.indexOf(' ') != -1 ){
			vLine = vLine.replace(' ','');
		}
		if(vLine.length > 0) {
			vLine = vTextLines[i];
			while(vLine.indexOf(v8Tab) == 0){
				vLine = vLine.replace(v8Tab,'\t');
			}
			vText += vLine+'\n';        
        }
	}
	Editor.currentView.text = vText;
}

var myDeleteEmptyLines = {
    text: "Удалить пустые строки  \tCtrl+Shift+E", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x45, // "S key"
    cmd: deleteEmptyLines	
}
addHotKey(myDeleteEmptyLines); 
gUntilMenu.addItem(myDeleteEmptyLines);


function sortLines() {
	var rv = '';
	var vText = Editor.currentView.text;
	var vTextLines = vText.split('\n');
	vTextLines.sort();
	vText = vTextLines.join('\n');
	Editor.currentView.text = vText;
	return rv;
}

var mySortLinesItem = {
    text: "Сортировать строки", 
    cmd: sortLines	
}
gUntilMenu.addItem(mySortLinesItem);

function sortLinesDesc() {
	var rv = '';
	var vText = Editor.currentView.text;
	var vTextLines = vText.split('\n');
	vTextLines.sort();
	vTextLines.reverse();
	vText = vTextLines.join('\n');
	Editor.currentView.text = vText;
	return rv;
}

var mySortLinesDescItem = {
    text: "Сортировать строки Desc", 
    cmd: sortLinesDesc	
}
gUntilMenu.addItem(mySortLinesDescItem);

// trdm 2020-01-08 11:41:39  
/* Задача - получить спискок файлов для построения индекса подсказки и готудефинишинз 
	регулярка для CMake*.txt (https://regexr.com/)
		[\s|$]([a-zA-Z_]+)\s*\(([^\)]*)\)
	однако сначала надо убить все строки начиная с #
*/
function CMakeParser(psDirOrFile) {
	this.initData = psDirOrFile;
	this.initFolder = '';
	this.checkInitData = function() {
		//debugger;
		this.initFolder = '';
		if(this.initData != '') {
			if(gFso.FileExists(this.initData)) {
				var vFileObj = gFso.GetFile(this.initData);
				this.initFolder = vFileObj.ParentFolder.Path;
				
			}
        } else {
			this.initFolder = '';
		}
	}	
	this.parse = function () {
    	var rv = '';
    	return rv;
    }
	this.checkInitData();
	if(this.initFolder != '') {
		
    }
	
}

function testCMakeParser() {
	var rv = 'C:\\Progekts\\_Ros\\master\\m\\base\\shell\\filebrowser\\CMakeLists.txt';
	var ObjCMP = new CMakeParser(rv);
	return rv;
}

var myTestCMakeParser = {
    text: "testCMakeParser\tAlt+T", 
    ctrl: true,    shift: false,    alt: false,
    key: 0x54, // "alt+T key"
    cmd: testCMakeParser
	
}
gUntilMenu.addItem(myTestCMakeParser);



// trdm 2018-04-10 14:58:14 }
function myStr(psStr) {
	this.str = psStr;
	this.cntr = 0;
	this.toString = function(){
		this.cntr += 1;
		return this.str+'_'+this.cntr;		
	}
	return this;
}

function exampleMessage() {
	var vMyMessage = new myStr('My cool mesage');
	message(vMyMessage);
	status(""+vMyMessage);
	alert(vMyMessage);
}
//exampleMessage()

