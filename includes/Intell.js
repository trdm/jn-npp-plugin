/*	Notepad++ - прекрасный редактор, любимый многими. Обладая широким спектром возможностей,
	он стал неотъемлемым инструментом для многих, включая и меня. Я рад представить расширение,
	Notepad++, которое позволит разработчикам трудиться эффективнее и радовать продакшин своими 
	новыми гениальными продуктами.
	
	Данный скрипт реализует функционал Intellisense и завершения кода для javascript и 
	vbcsript (в перспективе). В данной разработке использовался опыт написания скриптов 
	в проекте OpenConf, автором которого является Александр Орефков, которому я черезвычайно 
	признателен за его труд. Так же хочу поблагодарить активных разработчиков проекта OpenConf,
	у которых я многому научился и общение с которыми мне доставляло много радости. 
	Выражаю благодарность:
	- Александру Орефкову aka orefkov, автору OpenConf, 
	- Алексею Дирксу aka ADirks, 
	- Артуру Артюханову aka artbear, 
	- Александру Куштанову aka a13x,
	- Дмитрию Реутову aka dimoff, 
	- Ушакову Сергею aka Phoenix,
	- MetaEditor
	Спасибо им огромное!
	---------------------------------------------------------------------
	Скрипт: Intell.js, 
	Версия: 0.1.0
	Версия внутр.: $Revision: 0.20 $
	Автор: Трошин Дмитрий, trdmval@gmail.com, skype: trdmval
	Поддержать проект: яндекс-кошелек 410015947831889
	Функционал:
	- подсказка по методам и свойствам встроенных объектов языка javascript	
	
	Тулзы и описание вспомогательных файлов
	- протестировать регулярки можно тут: https://www.regextester.com/
	intell_otd.dict - файл содержащий словарь в виде объектов и имен файлов (otd - OtherTypesDefine)
	-------------------------------------------------------------
	Scripting.Dictionary,scripting_dictionary
	Scripting.FileSystemObject,scripting_filesystemobject
	excel.application,excel_application
	word.application,word_application
	--------------------------------------------------------------
	Используется еще и как словарь progid-ов для выбора в конструкциях:
	new ActiveXObject("|") и CreateObject("|")
	а так же как список progId-dumped, т.е. как список прогидов которые обработаны tlbinf32.dll

	todo:
	- можно ли как-то узнать от сцинтилы что позиция курсора находится в многострочном коментарии? тогда бы не пришлось парсить текст полностью. иотключить IntelliSense для коментариев.
	- посмотреть C:\Progekts\_Utils\_Npp\sourcecookifier\sourcecookifier\SourceCookifier на предмет разбора файлов исходников.
	- посмотреть https://msdn.microsoft.com/ru-ru/library/bb385682.aspx IntelliSense для JavaScript для Visual Studio
	- список задач в ..\Notepad++\plugins\jN\includes\disabled\_test.js

 	gJsLvalDict = new ActiveXObject("Scripting.Dictionary"); 
	Вспомогательный словарь для определения типов, формат ТипОбъекта = ТипОбъекта.Свойство|Метод
	Инициализировать будем 1 раз в процедуре.
*/
require("lib/Window.js");
var gJsLvalDict; 
var gStatuBar; // Статус бар Notepadd
var gMenuArray = new Array();
var gNjPluginDir = Editor.nppDir +"\\plugins\\jN\\";
var gIntelDir = gNjPluginDir+"Intell\\";
var gIntelFileOTD = gIntelDir + "OtherTypesDefine.txt";

var gIntellDebug = false; // технология отключена
var gIntellEnabled = false; // технология отключена
var gOtherVarAsString = false; // Остальные переменные определять как строку 
var gIntellswitchStringModeMenuItem;
var gDeleteHelpString = true; // удалять документацию если есть
var gSendEscAfterSelect = true; // Проблема со стандартным автокомплитом
var gBuiltInTypesJs = new ActiveXObject("Scripting.Dictionary"); 
var gTextParsingStrategy = 0; // сортировать методы и свойства переж выдачей.
var gSortMetodsBefore = 0; // сортировать методы и свойства переж выдачей.
var gSwitchDebugModeMenuItem; // Элемент меню "Переключение режимов отладки"
var gIntellModeModeMenuItem; // Элемент меню "Включить выключить сам интеллиценз"

var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gSettingsIni = {};
var gSearchCount = 0; // Счетчик запуска getSimleType_js()
var gSearchCountMax = 20; // Ограничение максимального кол-ва запуска.
var gCallCount = 0;

jN.scriptsMenu = (!jN.scriptsMenu) ? {} : jN.scriptsMenu;
scriptsMenu = jN.scriptsMenu; // глобальная переменная с меню скриптами.
//endregion
GlobalListener.addListener({
	CHARADDED:function(v, pos){
		var rrr = 200; 
		//var cw = IntellPlus.getCurWord();  //getWordList(); 	
		if (gIntellEnabled){
			var cw = getWordList();
		}		
	}
});

function status( psStatusText ) {
	try {
		gStatuBar.SetWindowText(psStatusText);
	} catch(e) {}
}

//trdm: 2017-12-24 20:51:04
function switchIntellDebugMode(){
	gIntellDebug = !gIntellDebug;
	gSwitchDebugModeMenuItem.checked = gIntellDebug; // не пашет чекалка????
	//debugger;
	var vText = "ВЫключить";
	if (!gIntellDebug) vText = "Включить";
	gSwitchDebugModeMenuItem.text =  vText + " отладку Intell.js\tctrl+F9";
}

function switchIntellMode(){
	gIntellEnabled = !gIntellEnabled;
	gIntellModeModeMenuItem.checked = gIntellEnabled;	
}
function switchStringMode(){
	gOtherVarAsString = 1 - gOtherVarAsString;
	gIntellswitchStringModeMenuItem.checked = gOtherVarAsString == 1;	
	
}

function intellEnabled(){
	gIntellEnabled = true;
}
function intellDisabled(){
	gIntellEnabled = false;
}

//https://stackoverflow.com/questions/3870019/javascript-parser-for-a-string-which-contains-ini-data
function parseINIString(data){
    var regex = {
        section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
        param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
        comment: /^\s*;.*$/
    };
    var value = {};
    var lines = data.split(/[\r\n]+/);
    var section = null;
    lines.forEach(function(line){
        if(regex.comment.test(line)){
            return;
        }else if(regex.param.test(line)){
            var match = line.match(regex.param);
            if(section){
                value[section][match[1]] = match[2];
            }else{
                value[match[1]] = match[2];
            }
        }else if(regex.section.test(line)){
            var match = line.match(regex.section);
            value[match[1]] = {};
            section = match[1];
        }else if(line.length == 0 && section){
            section = null;
        };
    });
    return value;
}

//trdm: 2017-12-24 18:25:33
function loadFromFile( psFileName) {
	var rv = false;
	if (gFso.FileExists(psFileName)) {
		// если читается файл нулевого размера, тогда выдает ошибку...
		var fl = gFso.GetFile(psFileName);
		if(fl.Size){
			rv = fl.OpenAsTextStream(1).ReadAll();
		}
	}	
	return rv;
}

//trdm: 2017-12-24 17:51:33
function loadSettingth() {
	var iniFileName = gIntelDir + "intell.ini";
	var text = loadFromFile(iniFileName);
	if (text) {
		gSettingsIni = parseINIString(text);
		gIntellEnabled = gSettingsIni["Enabled"] == "1";
		gOtherVarAsString = gSettingsIni["OtherAsString"] == "1";
		gSendEscAfterSelect = gSettingsIni["SendEscAfterSelect"] == "1";
		gSortMetodsBefore = parseInt(gSettingsIni["SortMetods"]);
		gTextParsingStrategy = parseInt(gSettingsIni["TextParsingStrategy"]);
		gDeleteHelpString = gSettingsIni["DeleteHelpString"] == "1";
	}	
}


//trdm: 2017-12-23 20:47:42
function trimSimple( psLine ) {	
	var re = new RegExp("^[\\s]+|[\\s]+$", 'g');
	return psLine.replace(re, '');
}


//jN.prototype.

// особенности обработки текста
// "	."
//view.column - табуляция за 4 символа считается, т.е "[tab].I" где I-курсор>>
//line.charAt(0)	"	"	String
//line.charAt(1)	"."	String
//view.column	5	Number
//line.length	4	Number

var IntellPlus = {
	curChar : ""
	, enabled: '' 		// активна технология
	, currentLine: '' 	// текущая строка
	, curExtension: '' 	// текущее расширение файла
	, curLang: '' 		// язык для поиска. Понадобится когда будем работать во фрагментах html | php
	, getCurExtension : function(){
		var retVal = "";
		ext = "";
		view = Editor.currentView;
		curPathFile = view.files[view.file];
		if (curPathFile != undefined) {
			len = curPathFile.length-1;
			cChar = curPathFile.charAt(len);			
			while (cChar != '.' && len >= 0) {
				ext = cChar + ext;
				len = len - 1;
				cChar = curPathFile.charAt(len);			
			}
			ext = ext.toLowerCase();
		}
		retVal = Editor.langs[view.lang];
		retVal = retVal.toLowerCase();
		if (ext == 'vbs') {
			retVal = ext; // забывают про этот "язык". :)
		}
		this.curExtension = retVal;
		this.curLang = retVal;
		
		return retVal;
	}
	, getCurWord : function getWordUnderCursor(){
		//return '';
		// 	  document.| где: | - позиция курсора, 
		//if (this.debug) {debugger;}
		
		this.getCurExtension();
		/* Бага сработало в строке: "    vFName = gIntelDir+'\\js.|';"
		| - позиция сработки...
		*/
		
		// todo: надо отключить в комментариях. Опционально конечно.		
		var retVal = "";
		view  = Editor.currentView;
		
		var line = currentView.lines.get(view.line).text;
		line = line.replace(/[\t]/g,"    ");
		
		var isChar = /[\w\dА-я]/;
		this.currentLine = line;
		this.currentLine = trimSimple(this.currentLine);
		// страховка от срабатывания в строке.
		lLine = line.substring(0,view.column);
		line = line.replace(/('.*')/g,""); line = line.replace(/(".*")/g,"");
		if (line.indexOf(lLine) == -1) return "";
		
		
		var wordBegPos = view.column - 1;
		var wordEndPos = wordBegPos;
		this.curChar  = line.charAt(wordBegPos);
		if (this.curChar == '.' )  {
			wordEndPos = wordEndPos - 1;
			if (wordEndPos < 0) {
				return "";
			}
		} else {
			return "";
		}
			
		while (wordBegPos >= 0) {
			if (!isChar.test(line.charAt(wordBegPos - 1)))
				break;				
			wordBegPos--;
		}					
		retVal = line.substr(wordBegPos, wordEndPos - wordBegPos + 1);
		//alert(retVal);
		return retVal;		
	}	
}

//trdm 2017-12-23 19:58:50
function remoteCommentMLine(allText) {
	var retVal = allText;
	var re = /(\/\*([\s\S]*?)\*\/)/igm;
	var reRe = re.exec(retVal);
	while (reRe != null) {
		var fRes = reRe[0];
		retVal = retVal.replace(fRes,'');
		re = /(\/\*([\s\S]*?)\*\/)/igm; // нужно переинициализировать почему? флаг?
		reRe = re.exec(retVal);
	}
	return retVal;
}

//trdm: 2017-12-23 20:19:49
function remoteCommentSLine_js(psAllText) {
	var retVal = psAllText;
	var re = /(\/\/.*)/igm;
	var reRe = re.exec(retVal);
	while (reRe != null) {
		var fRes = reRe[0];
		retVal = retVal.replace(fRes,'');
		re = /(\/\/.*)/igm; // нужно переинициализировать почему? флаг?
		reRe = re.exec(retVal);
	}
	return retVal;
}

//trdm: 2017-12-23 20:30:15
function remoteOther(psAllText) {
	retVal = psAllText;
	retVal = retVal.replace(/\t/img," ");
	return retVal;
}

// PrepareModuleText(Line, Col) 
function PrepareModuleText(Line, Col) {
	// возможно лучше взять часть текста, включая текущую строку.
	var retVal = ""; 
	view  = Editor.currentView;
	retVal = view.text;
	if(gTextParsingStrategy == 1) {
		var ara = retVal.split('\n');
		retVal = "";
		for (tLine = 0; tLine<Line; tLine++){
			if (retVal == ""){
				retVal = ara[tLine];
			} else {
				retVal = retVal + '\n' + ara[tLine];
			}
		}
	}
	retVal = remoteCommentMLine(retVal);
	retVal = remoteCommentSLine_js(retVal);
	retVal = remoteOther(retVal);		
	return retVal;
}

function getBuiltInTypes(psCurLang, psCase) {
	var retVal = new ActiveXObject("Scripting.Dictionary");
	if(psCase == undefined) psCase = true; // все
	if(psCurLang == "js") {
		retVal.Add("Array","Array");
		retVal.Add("Boolean","Boolean");
		retVal.Add("Date","Date");
		retVal.Add("Error","Error");
		retVal.Add("EvalError","EvalError");
		retVal.Add("Function","Function");
		retVal.Add("Math","Math");
		retVal.Add("Number","Number");		
		retVal.Add("Object","Object");		
		retVal.Add("RangeError","RangeError");
		retVal.Add("ReferenceError","ReferenceError");
		retVal.Add("RegExp","RegExp");
		retVal.Add("String","String");		
		retVal.Add("SyntaxError","SyntaxError");
		retVal.Add("TypeError","TypeError");
		retVal.Add("URIError","URIError");
		retVal.Add("window","window"); 
		retVal.Add("document","document"); // работы полагаю тут валом...		
		//jN{ ну и раз програмим с помошью плагина jN, то и его типы встроить надо, хотя тут надо опционально разделять.
		if(psCase) {
			retVal.Add("MenuItem","MenuItem");
			retVal.Add("Menu","Menu");
			retVal.Add("CtxMenu","CtxMenu");		
			retVal.Add("Dialog","Dialog");
			retVal.Add("Library","Library");
			retVal.Add("CallBack","CallBack");
			retVal.Add("System","System");
			retVal.Add("ViewLine","ViewLine");
			retVal.Add("ViewLines","ViewLines"); // Represents lines of View
			retVal.Add("View","View"); // Represents an editor view.
			retVal.Add("Editor","Editor"); // Represents the Notepad++. Methods of this interface are globally available. It means you can omit keyword 'Editor' to access to its methods.
		//jN}
		}
		
	}
	return retVal;	
}
// Разбираем js.lval 
function getTypeFromLval(psOneType, psMeth) {
	var retVal = "";
	var vFName = gIntelDir+'\\js.lval';
	if(!gJsLvalDict){
		gJsLvalDict = new ActiveXObject("Scripting.Dictionary");
		var tBadMessage = "";
		vText = loadFromFile(vFName);
		var arr = vText.split('\n');	
		var tLine = "";
		for(i=0; i<arr.length; i++){
			tLine = arr[i];
			if(i == 86){ ddd = 20;}
			tLine = trimSimple(tLine);
			tLine = tLine.replace(/\s*/g,"");
			if(tLine == "") continue;
			tPos = tLine.indexOf("#");
			if(tPos != -1) { continue; }
			tLine = tLine.toLowerCase();
			tLine = tLine.replace(" ","");
			tPos = tLine.split("=");	
			try {
				gJsLvalDict.Add(tPos[1],tPos[0]);
				
			} catch(e) {
				tBm = "Не удалась вставка: "+arr[i] + " строка: "+ i;
				tBadMessage += tBm;
				tBadMessage += '\n';				
			}			
		}
		if (tBadMessage != "") {
			alert(tBadMessage);
		}
	}
	tText = psOneType+"."+psMeth;
	tText = tText.toLowerCase();
	if(gJsLvalDict.Exists(tText)){
		retVal = gJsLvalDict.Item(tText);
	}
	return retVal;
}

//trdm: Работа сразу со всем текстом не оправдана, надо разбирать построчно.
function getSimleType_js(psCurWord, psAllText) {
	if(gIntellDebug) {	debugger;	}	
	gSearchCount++;
	if(gSearchCount >= gSearchCountMax) {
		return "";
	}
	
	var retVal = "";
	var curLang = 'js';
	var bi_types = getBuiltInTypes(curLang);
	if (bi_types.Exists(psCurWord)){
		return psCurWord;
	}
	
	var paternNew = psCurWord+"\\s*\\=\\s*new\\s*([a-zA-Z_]+[0-9]?)"; //re = new RegExp(paternNew, 'img');
	var reNew = new RegExp(paternNew, 'img');
	var paternActive = psCurWord+'\\s*\\=\\s*new\\s*ActiveXObject\\(\\"([a-zA-Z_\\.]+[0-9]*\\")\\)';  		//retVal = new ActiveXObject("Scripting.Dictionary");		
	var reActive = new RegExp(paternActive, 'img');
	var paternLVal = psCurWord+'\\s*\\=\\s*([a-zA-Z_\\(\\)\\[\\]"\\.]+[0-9]*)';	//patern = psCurWord+'\\s*\\=\\s*([a-zA-Z_\\.]+[0-9]*)'; 
	var reLVal = new RegExp(paternLVal, 'img');
	var reResu;
	
	var allText = psAllText;

	var vTextLines = allText.split('\n');
	var vTLLen = vTextLines.length-1;
	for (iL = vTLLen; iL>=0; iL-- ) {
		var tLine = vTextLines[iL];	//	alert(tLine);
	
		var reResu = reNew.exec(tLine);
		if (reResu != null) {
			retVal = reResu[1]; // нужна последняя
			//break; // не нужно, вдруг поймаем "ActiveXObject"
		}
		if (retVal == "" || retVal == "ActiveXObject") {
			var reResu = reActive.exec(tLine);
			if (reResu != null) {
				retVal = reResu[1];
				break;
			}
		}
		if (retVal == "") {		
			var reResu = reLVal.exec(tLine);
			if (reResu != null) {
				retVal = reResu[1];				
			}
			if(retVal != ""){
				var tCharOne = retVal.substring(0,1);
				if(tCharOne == '"' || tCharOne == '\'') {
					retVal = "String";
				} else if (tCharOne == '/'){
					retVal = "RegExp";
				} else {
					
					patern = /(\[.*\])/g; // document.forms["newmsg_form"]- надо убрать [\.]
					retVal = retVal.replace(patern,"");
					var wArr = retVal.split(".");
					retVal = "";
					if(wArr.length>1){
						wOne = wArr[0];
						wOneType = getSimleType_js(wArr[0],psAllText);
						if (wOneType != "") {
							for(iw = 1; iw<=wArr.length; iw++){
								wOneType2 = getTypeFromLval(wOneType,wArr[iw]);
								if(wOneType2 != "") {
									wOneType = wOneType2;
								} else {
									break;
								}
							}
						}		     
						retVal = wOneType;
					} else {
					    // var vLine = arr[iLine]; arr = ttt.split() vLine <- String
					    retVal = getSimleType_js(wArr[0],psAllText);
					}
				}
			}
		}
		if (retVal != "") break;
	}
	retVal = retVal.replace('"','');
	return retVal;
}
function getSimleType_jsOld(psCurWord, psAllText) {
	if(gIntellDebug) {	debugger;	}	
	var retVal = "";
	var curLang = 'js';
	var bi_types = getBuiltInTypes(curLang);
	if (bi_types.Exists(psCurWord)){
		return psCurWord;
	}
	
	var patern = psCurWord+"\\s*\\=\\s*new\\s*([a-zA-Z_]+[0-9]?)"; //re = new RegExp(patern, 'img');
	var re = new RegExp(patern, 'img');
	var allText = psAllText;
	var reRe = re.exec(allText);
	while (reRe != null) {
		retVal = reRe[1]; // нужна последняя
		reRe = re.exec(allText);
	}
	if (retVal == "" || retVal == "ActiveXObject") {
		//retVal = new ActiveXObject("Scripting.Dictionary");		
		patern = psCurWord+'\\s*\\=\\s*new\\s*ActiveXObject\\(\\"([a-zA-Z_\\.]+[0-9]*\\")\\)'; 
		re = new RegExp(patern, 'img');
		var reRe = re.exec(allText);
		while (reRe != null) {
			retVal = reRe[1];
			reRe = re.exec(allText);
		}
	}
	if (retVal == "") {
		patern = psCurWord+'\\s*\\=\\s*([a-zA-Z_\\(\\)\\[\\]"\\.]+[0-9]*)';	//patern = psCurWord+'\\s*\\=\\s*([a-zA-Z_\\.]+[0-9]*)'; 
		re = new RegExp(patern, 'img');
		var reRe = re.exec(allText);
		while (reRe != null) {
			retVal = reRe[1];
			reRe = re.exec(allText);
		}
		if(retVal != ""){
		    // "tDate.toLocaleString()" | document.forms["newmsg_form"]- надо убрать [\.]
		    patern = /(\[.*\])/g;
		    retVal = retVal.replace(patern,"");
		    // "tDate.toLocaleString()" | document.forms - убрали [\.]
		    var wArr = retVal.split(".");
		    retVal = "";
		    if(wArr.length>1){
		        wOne = wArr[0];
		        wOneType = getSimleType_js(wArr[0],psAllText);
		        if (wOneType != "") {
		            for(iw = 1; iw<=wArr.length; iw++){
		                wOneType2 = getTypeFromLval(wOneType,wArr[iw]);
		                if(wOneType2 != "") {
		                    wOneType = wOneType2;
		                } else {
		                    break;
		                }
		            }
		        }		     
		        retVal = wOneType;
		    }
		}
	}
	retVal = retVal.replace('"','');
	return retVal;
}


function getAtributesFromType(psTypeCWD, psCurWord) {
	var retVal = "";
	
	var fileName = gIntelDir + IntellPlus.curLang+"_"+psTypeCWD+".ints";	// js_array.ints
	if (!(retVal = loadFromFile(fileName))){
		fileName = gIntelDir + psTypeCWD+".ints";				// array.ints
		if (!(retVal = loadFromFile(fileName))){
			// excel.application >>> excel_application
			fileName = psTypeCWD;
			fileName = fileName.replace(".","_")+ ".ints"; // excel_application.ints
			fileName = gIntelDir + fileName;
			retVal = loadFromFile(fileName);
		}
	}
	if(gSortMetodsBefore>0 && retVal != ""){
		//debugger;
		// Cортировать методы и свойства переж выдачей: 0 - не сортировать, 1 - сортировать потоком; 2 - сортировать отдельно
		var arrP = new Array;
		var arrM = new Array;
		var arr = retVal.split('\n');		
		for(iLine = 0; iLine <arr.length; iLine++){
			var vLine = arr[iLine];
			if (gSortMetodsBefore == 1) {
				arrM.push(vLine);
			} else {
				if(vLine.indexOf('(') != -1){	// function			
					arrM.push(vLine);
				} else {
					arrP.push(vLine);				
				}
			}
		}
		if (gSortMetodsBefore == 1){
			arrM.sort();
			retVal = arrM.join('\n');
		} else {
			arrM.sort();
			arrP.sort();
			arr = arrP.concat(arrM);
			retVal = arr.join('\n');
		}		
	}
	return retVal;
}

//trdm: 2017-12-24 19:39:46
function selectFromList(psStrList, psCurWord) {
	var rv = "";
	var vCurWord = psCurWord; 
	vCurWord = vCurWord + ".";
	if(IntellPlus.curLang == "js") {		
		var bi_types = getBuiltInTypes(IntellPlus.curLang,false); // Отсечку сделаем только по встроенным js типам. 
		if(!bi_types.Exists(psCurWord)) {
			vCurWord = '';
		}
	}
	strList = psStrList;
	var arr = strList.split('\n');
	var arr2 = new Array;
	var tLine = "";
	//debugger;
	for(i=0; i<arr.length; i++){
		tLine = arr[i];
		tLine = arr[i].substring(4);
		tPos = tLine.indexOf("|"); // А надо окументацию убирать? Опционально?
		if(tPos != -1) {			tLine = tLine.substring(0,tPos);		}
		/*if (gDeleteHelpString) {
			tPos = tLine.indexOf("|"); // А надо окументацию убирать? Опционально?
			if(tPos != -1) {			tLine = tLine.substring(0,tPos);		}
		} else {
			// todo
			tLine = tLine.replace("|",';        ');
		} */
		tPos = tLine.indexOf(".");
		if(vCurWord){			// строки, разделенные запятой, если там есть выражения psCurWord.[a-z], то брать только их и отсекать psCurWord.
			tPos = tLine.indexOf(vCurWord);
			if(tPos != -1) {
				tLine = tLine.substring(vCurWord.length+1);
			} else { continue;
			}
		} else {		    
		    if (tPos != -1) continue; // Методы/свойства, которые используются только с предопределенными литералами, типа "Number.MAX_VALUE" надо отсекать, если объект не встроенный тип.
		}
		arr2[i] = tLine;
	}
	strList = arr2.join('\n');
    try   {
        var sel = new ActiveXObject('Svcsvc.Service');
    }
    catch(e)    {
        alert("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll");
        return false;
    }
	
	rv = sel.FilterValue(strList, 1 + 4 + 16);
	if (gSendEscAfterSelect) {
		var wshShell = new ActiveXObject("WScript.Shell");
		wshShell.sendKeys("{ESC}");
	}
	//tPos = rv.indexOf(";"); 	if(tPos != -1) {		rv = tLine.substring(0,tPos);			}	
	return rv;
}
/*	UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU
	Основная процедура запуска скрипта. Обеспечивает распознавание возможности коде-комплита, 
	парсинг, выбор вваринта и встравку результата во view. -_-
*/
function getWordList() {
	gSearchCount = 0;
	var retVal = '';
	var cw = IntellPlus.getCurWord(); 
	if (!cw) return;
	if (IntellPlus.curLang != "js") return;
	
	view  = Editor.currentView;
	var currentLine = IntellPlus.currentLine;
	var allText = PrepareModuleText(view.line, view.column);
	var Methods = "";
	// todo отработать: gJsLvalDict = new ActiveXObject("|") << вставка из списка прог-идов
	if (IntellPlus.currentLine == '') {
	} else {
		var typeCWD = getSimleType_js(cw, allText);
		if (!typeCWD){
			// Прикинемся что объект строка?
			if(gOtherVarAsString)	Methods = getAtributesFromType("String");
		}

		if (typeCWD){
			Methods = getAtributesFromType(typeCWD, cw);
		}		
	}
	gCallCount++;
	status("Готово: " + gCallCount + " "+cw+"->"+typeCWD);
	if(Methods) {
		attrib = selectFromList(Methods, cw);
		if(attrib) {
			Editor.currentView.selection = attrib;
		}			
	}	
	return retVal;
}

function MethodList() {
	return getWordList();
}

//trdm: 2017-12-24 16:26:21
function initScript() {
	try {			
		gStatuBar = Window.FindByClass(Editor.handle, "msctls_statusbar32");
	} catch(e) {	gStatuBar = undefined;	}
	gStatuBar = Window.FindByClass(Editor.handle, "msctls_statusbar32"); // https://github.com/sieukrem/jn-npp-plugin/wiki/Helpful-scripts#change-the-text-of-statusbar
	loadSettingth();
}

initScript();
/* Виртуальные коды клавиш см. по ссылке: 
http://msdn.microsoft.com/en-us/library/dd375731(VS.85).aspx */

var mySwitchIntellDebugMode = {
    //text: "Вкл. отладку Intell\tctrl+F9", не воспринимает "Выключить" исключает из меню. Разобрался, в кодировке win-1251 не воспринимаются русские буквы меню. Пришлось в UTF-8
    text: "Включить отладку Intell\tctrl+F9", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x78, // "F9"
    cmd: switchIntellDebugMode	
};

addHotKey(mySwitchIntellDebugMode); 
gSwitchDebugModeMenuItem = scriptsMenu.addItem(mySwitchIntellDebugMode);
gSwitchDebugModeMenuItem.checked = gIntellDebug;

var myMethodListItem = {
    text: "Intelisense run\tctrl+I", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x49, // "I"
    cmd: getWordList
};
addHotKey(myMethodListItem); scriptsMenu.addItem(myMethodListItem);


var mySwitchIntellMode = {
    text: "Intellisense (вкл/выкл)\tctrl+F8", //"Switch intell mode\tctrl+F8", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x77,
    cmd: switchIntellMode
};

addHotKey(mySwitchIntellMode); 
gIntellModeModeMenuItem = scriptsMenu.addItem(mySwitchIntellMode);
gIntellModeModeMenuItem.checked = gIntellEnabled;

var mySwitchOVAS = {
    text: "Остальные - строки  (вкл/выкл)\tctrl+5",
    ctrl: true,
    shift: false,
    key: 0x35, // '5'
    alt: false,
    cmd: switchStringMode	
}
addHotKey(mySwitchOVAS); 
gIntellswitchStringModeMenuItem = scriptsMenu.addItem(mySwitchOVAS);
gIntellswitchStringModeMenuItem.checked = gOtherVarAsString == 1;

//gOtherVarAsString