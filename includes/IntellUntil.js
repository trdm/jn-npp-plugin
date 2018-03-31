var gHelpDoc; //HTMLDocument
var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gHelpFolder = Editor.nppDir +"\\plugins\\jN\\help\\";
var gHelpFolderTFrame = gHelpFolder+'index.html';
var gHelpFolderBFrame = gHelpFolder+'about.html';

var gHelpDocum = null;
var gHelpWindow = null;

var gMessageWindow = null;
var gMessageDocum = null;

//require("User32.dll.js");
// глобальная переменная с меню скриптами.
var scriptsMenu;
if (!jN.scriptsMenu){
	scriptsMenu = Editor.addMenu("Скрипты");
	jN.scriptsMenu = scriptsMenu;
} else { 
	scriptsMenu = jN.scriptsMenu;
}

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
scriptsMenu.addSeparator();
addHotKey(myHelpOpenCommand); 
scriptsMenu.addItem(myHelpOpenCommand);


//{trdm: 2018-02-28 13:20:36
function createMessageWindow() {
	var option = {		
		name:'Сообщения (Закрыть: Ctrl+Shift+Z):',		
		docking:'bottom', 
		onclose:function(){
				gMessageWindow = '';
				gMessageDocum = '';
			}
		};	
	gMessageWindow = Editor.createDockable(option);
	gMessageDocum = gMessageWindow.document;
	// ul{margin-left: 20px;} - виден маркер ul{margin-left: 3px;} - не виден
	strDoc = '<html><head><style type="text/css">body{font-size: 14px; font-family:courier ; margin: 2px; padding:2px;} ul{margin-left: 3px;}</style> '+
	'</head><body><UL id="main"></UL></body>';
	gMessageDocum.write(strDoc);
}

// using: message('bla-bla-bla');
function message(psStr) {
	if(!gMessageWindow) {
		createMessageWindow();
    }
	if(gMessageDocum) {
		var main = gMessageDocum.getElementById("main");
		var p = gMessageDocum.createElement('li');
		p.innerText = psStr;// + 'dlh.handle = ' + gMessageWindow.handle;
		main.appendChild(p);
    }
}
function EditorMessage(psMessage) {	message(psMessage); }
function EditorMessageDT(psMessage) {	
	var Today = new Date;
	var dts = formatData(Today,'yyyy-MM-dd HH:mm:ss');
	message(dts+' '+psMessage); 
}
var mDebud = false;

if(mDebud) {
	message('Hello!');
	message('Hello!-2');
	message('Пример 2. Использование :before и content');
	EditorMessageDT('<- Строка с датой и временем. ');
	EditorMessage('bla-bla-bla');
}

function CloseMessageWnd() {
	if(gMessageWindow) {
		gMessageWindow.visible = false; // это работает
		gMessageWindow.close();
		gMessageWindow = '';
		gMessageDocum = '';
    }
}

var myCloseMessageWndCommand = {
    text: "Закрыть окно сообщений \tCtrl+Shift+Z", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x5A, // "F1"
    cmd: CloseMessageWnd	
};

addHotKey(myCloseMessageWndCommand); 
scriptsMenu.addItem(myCloseMessageWndCommand);


//}trdm: 2018-02-28 13:20:36


function testNavigate() {
	if(gHelpDocum) {
		debugger;
		var el = gHelpDocum.getElementById('b_frame');
		var el2 = gHelpDocum.getElementById('frame_t');
		var list = el2.getElementsByTagName("a");
		for(var i = 0; i<= list.length; i++) {
			var elA = list.item(i);
		}
    }
	
}

// 2017-11-17 14:52:19  formatData(Today,'yyyy-MM-dd HH:mm:ss');
function formatData(data, fmString) {
	//debugger;
	var retVal = fmString;
	var re = /(dd|MMMM|MM|yyyy|yy|hh|HH|mm|ss|tt|S)/g;
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
		
	var reRe = "";
	while ((reRe = re.exec(fmString)) != null) {
		var fRes = reRe[0];
		switch(fRes) {
			case "hh":
			case "HH":
				retVal = retVal.replace(fRes,td.hh);
				break;
			case "mm":
				retVal = retVal.replace(fRes,td.mm);
				break;
			case "ss":
			case "SS":
			case "S":
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
function remoteRowOverLength() {
	var vOLen = 1000;
	vOLen = InputBox('Input length',"For very long rows",vOLen);
	vOLen = parseInt(vOLen);
	if(vOLen <= 100) {
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
			vTextNeed = vTextNeed + '\n' + vArr[i];
        }
    }
    Editor.currentView.text = vTextNeed;    
}

var myKillVeryLengthRows = {
    text: "Удалить строки длинее N \tCtrl+Shift+K", 
    ctrl: true,    shift: true,    alt: false,
    key: 0x4B, // "K key"
    cmd: remoteRowOverLength	
};

addHotKey(myKillVeryLengthRows); 
scriptsMenu.addItem(myKillVeryLengthRows);


