var gHelpDoc; //HTMLDocument
var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gHelpFolder = Editor.nppDir +"\\plugins\\jN\\help\\";
var gHelpFolderTFrame = gHelpFolder+'index.html';
var gHelpFolderBFrame = gHelpFolder+'about.html';


var gUntilMenu = null; // var gTranslate = Editor.addMenu("MyMemory");
gUntilMenu = scriptsMenu.addMenu("UntilMenu");
gUntilMenuCut = gUntilMenu.addMenu("UntilMenuCut");

require("lib/scintilla.js");
require("lib/Kernel32.dll.js");

function commentSelection() {
	// message('commentSelection');
	//debugger;
	var rv = '';
	var vText = Editor.currentView.selection;
	var vCommentPhrese = 110;
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
	// Editor.currentView.selection = vText;
	return rv;
	
}

var myCommentSelection = {
    text: "Comment selection \tCtrl+/", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x6F, 
	/* 
	/ -> 111 -> 6F
	* -> 106 -> 6A
	*/
    cmd: commentSelection
};

addHotKey(myCommentSelection);  
gUntilMenuCut.addItem(myCommentSelection);


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
gUntilMenuCut.addItem(myKillVeryLengthRows);

function rowsOverLengthCut() {	rowsOverLengthRemote(2); }
var myCutVeryLengthRows = {
    text: "Обрезать строки длинее N ", 
    cmd: rowsOverLengthCut	
};
gUntilMenuCut.addItem(myCutVeryLengthRows);


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


function ApendLines() {
	alert('Is todo...');
	return;
	
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

var myApendLines = {
    text: "Дополнить строки  \tCtrl+Shift+A", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x41, // "A key"
    cmd: ApendLines	
}
addHotKey(myApendLines); 
gUntilMenu.addItem(myApendLines);


function toUtf8(str){
	// determine necessary count of bytes 
	var newlen = Kernel32.WideCharToMultiByte(65001, 0, str, str.length, 0, 0, 0, 0); // 65001 means UTF-8

	// prepare buffer
	var buf = Kernel32.NativeLibrary.alloc(newlen+1); // returns javascript string of newlen+1
	Kernel32.NativeLibrary.writeByte(buf, newlen, 0); // terminate encoded string with 0

	// encode string as UTF-8
	var reallen = Kernel32.WideCharToMultiByte(65001, 0, str, str.length, buf, newlen, 0, 0);
	return buf;
}


function showAutoComplete(arr){ // Global scope
	var sci = new Scintilla(currentView.handle);

	var currentSep = String.fromCharCode(sci.Call("SCI_AUTOCGETSEPARATOR",0,0));
	var list = arr.join(currentSep);
	var listEncoded = toUtf8(list); // because Scintilla is working internally with UTF-8 
	
	sci.Call("SCI_AUTOCSHOW", 0, listEncoded);
}


function VimComplete_js() {
	//\todo C:\_ProgramF\1Cv77\Bin\Config\scripts\Intellisence\VimComplete.js
	debugger;
	var vRetVal = '';
	var vView  = Editor.currentView;	
	var vText = vView.text;
	var regexp = /([A-Za-z0-9]){4,}\w+/gi;
	var res;
	var vWord = "";
	var vDict = new ActiveXObject("Scripting.Dictionary");
	//vDict.
	while (res = regexp.exec(vText)) {
		vWord = res[0];
		if(vWord.length > 5) {        
			if(!vDict.Exists(vWord)) {
				message( vWord);
				vDict.Add(vWord,vWord)
			}        
        }		
	}
	var Keys = vDict.Keys();
	return vRetVal;
}
var myVimComplete_js = {
	// VK_SPACE 0x20 - SPACEBAR
    text: "VimComplete  \tCtrl+SPACEBAR", 
    ctrl: true,    shift: false,    alt: false,
    key: 0x20, // "SPACEBAR"
    cmd: VimComplete_js	
}
//addHotKey(myVimComplete_js); 
gUntilMenu.addItem(myVimComplete_js);



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
gUntilMenuCut.addItem(myTestCMakeParser);



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

