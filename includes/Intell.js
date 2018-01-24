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
	- Александру Орефкову aka orefkov, автору OpenConf, ..............
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
	Версия внутр.: $Revision: 0.51 $
	Автор: Трошин Дмитрий, trdmval@gmail.com, skype: trdmval
	Поддержать проект: яндекс-кошелек 410015947831889
	Функционал:
	- подсказка по методам и свойствам встроенных объектов языка javascript	
	
	Описание вспомогательных файлов:
	intell_otd.dict - файл содержащий словарь в виде объектов и имен файлов (otd - OtherTypesDefine)
		-------------------------------------------------------------
		Scripting.Dictionary,scripting_dictionary
		Scripting.FileSystemObject,scripting_filesystemobject
		excel.application,excel_application
		word.application,word_application
		--------------------------------------------------------------
		Используется еще и как словарь progid-ов для выбора в конструкциях:
		new ActiveXObject("|") и CreateObject("|")
	
	progIdDumped.dict - Используется как список progId-dumped, т.е. как список прогидов которые обработаны tlbinf32.dll
	*.lval и *.lvalu
		Каждый объект содержит свой ства и методы, которые возвращают значения определенного типа. Зная эти правила можно понять, кто оно такое....
		*.lval - "полный" словарь,
		*.lvalu - словарь уникальных методов и пропертей, по которым точно можно определить тип объекта.
		todo - какого фига я мучаюсь? ведь *.lvalu можно сделать из *.lval путем отсеивания не уникальных методов... вроде того...

	todo/hekgths:
	- можно ли как-то узнать от сцинтилы что позиция курсора находится в многострочном коментарии? тогда бы не пришлось парсить текст полностью. иотключить IntelliSense для коментариев.
		SCI_GETSTYLEAT(int position) http://novikovmaxim.livejournal.com/tag/scintilla
	- список задач в ..\Notepad++\plugins\jN\includes\disabled\_test.js
	- Требуемый в настоящий момент фраймверки можно глянуть тут: https://moikrug.ru/vacancies?skills%5B%5D=264
	- сделать распознавание по уникальным методам/свойствам: Ara = sss.split() split - уникален
	
	doc & tools:
	- https://www.regextester.com/ - тестирование RegExp для javascript
	- посмотреть C:\Progekts\_Utils\_Npp\sourcecookifier\sourcecookifier\SourceCookifier на предмет разбора файлов исходников.
	- посмотреть https://msdn.microsoft.com/ru-ru/library/bb385682.aspx IntelliSense для JavaScript для Visual Studio
	- Неполохое автодополнение у JetBrains WebStorm 7.0.3 посмотреть что умеет, подчерпнуть полезное :)
	- https://github.com/felixfbecker/php-language-server - хорошая презентация автодополнения. //todo - вводишь точку в коменте и идет ошибка.
 	gJsLvalDict = new ActiveXObject("Scripting.Dictionary"); 
	Вспомогательный словарь для определения типов, формат ТипОбъекта = ТипОбъекта.Свойство|Метод
	Инициализировать будем 1 раз в процедуре.
*/
require("lib/Window.js");
require("lib/scintilla.js");
require("lib/User32.dll.js");


var gJsLvalDict; 
var gJsLvalDictUni; 
var gStatuBar; // Статус бар Notepadd
var gMenuArray = new Array();
var gNjPluginDir = Editor.nppDir +"\\plugins\\jN\\";
var gIntelDir = gNjPluginDir+"Intell\\";
var gIntelCTagsUFPath = gNjPluginDir+"Intell\\u_ctagsU.txt";
var gIntelSystemDir = gNjPluginDir+"system\\";
var gIntelCTagsUExeFPath = gIntelSystemDir+"\\ctagsU.exe";
var gIntelFileOTD = gIntelDir + "intell_otd.dict"; //"OtherTypesDefine.txt";
var gCtagsMapLast = 0;

var gIntellDebug = false; 		// технология отключена
var gIntellEnabled = false; 	// технология отключена
var gOtherVarAsString = false; 	// Остальные переменные определять как строку 
var gIntellswitchStringModeMenuItem;
var gDeleteHelpString = true; 	// удалять документацию если есть
var gSendEscAfterSelect = true; // Проблема со стандартным автокомплитом
var gUsingTemplates = false; 	// Использовать шаблоны
var gBuiltInTypesJs = new ActiveXObject("Scripting.Dictionary"); 
var gTextParsingStrategy = 0; 	// сортировать методы и свойства переж выдачей.
var gSortMetodsBefore = 0; 		// сортировать методы и свойства переж выдачей.
var gSwitchDebugModeMenuItem; 	// Элемент меню "Переключение режимов отладки"
var gIntellModeModeMenuItem; 	// Элемент меню "Включить выключить сам интеллиценз"


var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gWshShell = new ActiveXObject("WScript.Shell");
var gShell = gWshShell;
var gSettingsIni = {};
var gSearchCount = 0; 	  // Счетчик запуска getSimleType_js()
var gSearchCountMax = 20; // Ограничение максимального кол-ва запуска.
var gCallCount = 0;

// templates|Шаблоны из *.tmpl .Не инициализированный gTemplatesFromLang - сигнал для loadTemplates()
var gTemplatesFromLang; // = new ActiveXObject("Scripting.Dictionary"); //gTemplatesFromLang.Add(lang,'Scripting.Dictionary-2') 'Scripting.Dictionary-2' ->> Add(templ_word,'templ_bodi')

// глобальная переменная с меню скриптами.
if (!jN.scriptsMenu){
	var scriptsMenu = Editor.addMenu("Скрипты");
	jN.scriptsMenu = scriptsMenu;
} else { 
	scriptsMenu = jN.scriptsMenu;
}

//MsgBox из vbscript, надо привести к его виду
function MsgBox() {
	//debugger;
	//MessageBoxW->> https://msdn.microsoft.com/ru-ru/library/windows/desktop/ms645505(v=vs.85).aspx
	var rv = User32.MessageBoxW(Editor.handle,"Вопрос вопроса","Привет",1);
	// 1 - Ok| 2 - cansel(и даже если нажат Esc)
	return rv;
}
//MsgBox()




GlobalListener.addListener({
	CHARADDED:function(v, pos){
		if (gIntellEnabled){
			var curWord = getWordList();
		}		
	}
});
// 1 и 2 - комментарии, 1 - многострочный
function curcorInComment(){
	var rw = false;
	var sci = new Scintilla(currentView.handle);
	var style = sci.Call("SCI_GETSTYLEAT",currentView.bytePos); 
	return (style == 1 || style == 2) ? true : false;
}
function curcorInSring(){
	var rw = false;
	var sci = new Scintilla(currentView.handle);
	var style = sci.Call("SCI_GETSTYLEAT",currentView.bytePos); 
	return (style == 7 /*|| style == 2*/) ? true : false;
}
function status( psStatusText ) {
	try { gStatuBar.SetWindowText(psStatusText); } catch(e) {}
}

// Вспомогашка, а то скриптинг-дикшионери возвращает не тот массив.
function toJSArray(vbaarray){
	useVBArray = new VBArray(vbaarray);
	var ara =  useVBArray.toArray(); 
	return ara;
}

// Шаблоны. Надо считывать при первом обращении в getCurWord
function loadTemplates() {
	if(!gUsingTemplates) return;
	
	if (gTemplatesFromLang) return;		//debugger;
	gTemplatesFromLang = new ActiveXObject("Scripting.Dictionary");
	var lang = IntellPlus.curLang; // todo ctags!!!!	И еще ITypeLib, что-б её...................
	if (lang == '') return;
	var fName = gIntelDir + lang + '.tmpl';
	if (!gFso.FileExists(fName)) return;
	var vTextAll = loadFromFile(fName);
	var vTemplIdent = 'Template:';
	var templMap;
	// Дикшионари не поддерживает в валуе дикшионери? Ну и хрен с тобой. Будем вставлять в него же, но вот так: lang+'.'+temlpId
	var keys = gTemplatesFromLang.Keys();
	keys = toJSArray(keys);
	for (i = 0; i<gTemplatesFromLang.Count; i++){
		var vTemplId = keys[i];
		var ara2 = vTemplId.split('.');
		if (ara2.length == 1) continue;		
		if (ara2[0] == lang) return; // уже разобрали этот ланг.
	}	
	vTextArr = vTextAll.split('TemplateEnd');
	for(i=0; i<vTextArr.length-1; i++){
		vTextAll = vTextArr[i];
		vTextAll = trimSimple(vTextAll);
		vPos = vTextAll.indexOf(vTemplIdent);
		if(vPos == -1) continue;		
		vTextAll = vTextAll.substring(vPos+vTemplIdent.length);
		var arr0 = vTextAll.split('\n');
		var vIdent = arr0[0];
		vIdent = trimSimple(vIdent);
		vTextAll = '';
		for(i2 = 1; i2<arr0.length; i2++){
			vTextAll = vTextAll + ((i2 == 1) ? '':'\n' ) +arr0[i2];
		}	
		try {
			gTemplatesFromLang.Add(lang+'.'+vIdent,vTextAll)
		} catch(e) {
			alert('Ошибка при вставке "'+vIdent+'"! ');
		}
		vTextAll = vTextAll;
	}
}

function onInsertTemplate() {
	if(!gUsingTemplates) return;
	
	loadTemplates();
	var lang = IntellPlus.curLang;
	if(!lang) return;
	var keysNeed = [];
	var keys = gTemplatesFromLang.Keys();
	keys = toJSArray(keys);
	for (i = 0; i<gTemplatesFromLang.Count; i++){
		var vTemplId = keys[i];
		var ara2 = vTemplId.split('.');
		if (ara2.length == 1) continue;		
		if (ara2[0] == lang) {
			keysNeed.push(ara2[1]);
		}
	}		
	if(keysNeed.length == 0) return;
	var templId = selectFromList_simple(keysNeed.join('\n'));
	if(templId){
		var vaLu = gTemplatesFromLang.Item(lang+'.'+templId);
	}
	Editor.currentView.selection = vaLu;	
}

function isTemplate(psWord){
	if(!gUsingTemplates) return '';
	
	var retVal = '';
	var lang = IntellPlus.curLang;
	if(!lang) return;
	if(!gTemplatesFromLang) loadTemplates();
	//for  
	var keys = gTemplatesFromLang.Keys();
	keys = toJSArray(keys);
	//for_t 
	for (i = 0; i<gTemplatesFromLang.Count; i++){
		var vTemplId = keys[i];
		var ara2 = vTemplId.split('.');
		if (ara2.length == 1) continue;		
		if (ara2[0] == lang && psWord == ara2[1]) {
			retVal = gTemplatesFromLang.Item(vTemplId);
			return retVal;
		}
	}		
	return retVal;	
}

function insertTemplate() {
	if(!gUsingTemplates) return;
	var rv = true;
	var template = IntellPlus.template;
	var tPos = currentView.pos;
	var re = /^([\s])+/;
	reRe = re.exec(IntellPlus.currentLineCl);
	var vIndent = '';
	if(reRe) {
		vIndent = reRe[0];
	}
	var vTemplArr = template.split('\n');
	for(var i = 1; i< vTemplArr.length; i++) {	
		vTemplArr[i] = vIndent + vTemplArr[i];
	} 
	template = vTemplArr.join('\n');
	currentView.pos = tPos;
	currentView.anchor = tPos-(1+IntellPlus.currentWord.length);
	Editor.currentView.selection = template;
	currentView.pos = tPos;
	currentView.anchor = tPos;
	return rv;
} 


//Парсим с помощью ctagsU.exe файл
function fileToCtags( psFileName, psFirst ) {
	var vFName = psFileName;
	if(!vFName) {
		return;
	}
	var vFirst = (psFirst) ? true : false;
	var vFChar = (vFirst) ? '' : ' -a ';
	if(!gFso.FileExists(vFName)) return;
	if(!gFso.FileExists(gIntelCTagsUExeFPath)) return;
	vComandLine = '"'+gIntelCTagsUExeFPath+'"'+vFChar+' -R -F --machinable=yes --if0=yes --list-fields --sort=no --excmd=number -f "'+gIntelCTagsUFPath+'" "'+vFName+'"';
	// --if0=yes --list-fields - не обрабатывается
	vComandLine = '"'+gIntelCTagsUExeFPath+'"'+vFChar+' -R -F --machinable=yes --sort=no --excmd=number -f "'+gIntelCTagsUFPath+'" "'+vFName+'"';
	// debugger;
	status('Parse: '+vFName);	// var gWshShell = new ActiveXObject("WScript.Shell");
	gWshShell.Run(vComandLine,0,true);
	return gFso.FileExists(gIntelCTagsUFPath);
}

function getShortFileName(psFName){
	var ara = psFName.split('\\');
	return ara[ara.length-1];
}

function findByName(psArr, psName) {
	var rv;
	for(var i = 0; i<psArr.length; i++) {
		var rv = psArr[i];
		if(rv.name == psName) {
			return rv;
		}
		rv = undefined;
	}	
	return rv;
}

function addClassUnique(psAra, psIndent) {
	var rv = findByName(psAra, psIndent);
	if(!rv) {		psAra.push(psIndent);    }
}

function ClassMap(clname){
	this.name = clname;
	this.lineStart = 0;  // Заготовка для пост парсинга, а то как-то слабовато stags выдает. или я не правильно прогаю.
	this.lineEnd = 0;
	this.vars = []; 	// масив переменных глобальных
	this.functions = []; // масив функций глобальных
	this.addVar 	 = function(psVName) {    	addClassUnique(this.vars, psVName);    }
	this.addFunction = function(psFName) {    	addClassUnique(this.functions, psFName);    }
	this.getMembers = function() {
		var apendix = '0000 ';
		var rw = [];
		for(var i = 0; i<this.vars.length; i++) {
			rw.push(apendix+this.vars[i]);
        }
		for(var i = 0; i<this.functions.length; i++) {
			rw.push(apendix+this.functions[i]+'()');
        }
		return rw.join('\n');
	}
	this.setPosition = function(psPos) {
		vPos = parseInt(psPos);
		if(vPos == 0) return;
		
		this.lineEnd = Math.max(this.lineEnd,psPos);
		if(this.lineStart == 0) {
			this.lineStart = psPos;
        } else {
			this.lineStart = Math.min(this.lineStart, psPos);
		}
    }
}

function ScriptMap(scrname){
	this.name = scrname; // Краткое имя скрипта
	this.NameFull = scrname; // Краткое имя скрипта
	this.functions = []; // масив функций 
	this.vars = []; 	// масив переменных глобальных
	this.classes = []; // масив функций глобальных
	var Arr = scrname.split('\\');
	this.name = Arr[Arr.length-1];
	this.getClass = function(className) {
    	var rv = findByName(this.classes,className);
		if(!rv) {	
			rv = new ClassMap(className);	
			this.classes.push(rv);
		}
    	return rv;
    }
	this.findClass = function(className) {
		return findByName(this.classes,className);
	}

}

/* Область в котрой работают скрипты, может включать множество скриптов, 
	доступных их данного контекста через:
	- require("lib/Window.js");
	- <script src="/path/to/script.js"></script> // https://learn.javascript.ru/external-script
*/
function ScopeMap(sname){
	sname = sname ? sname : 'clobal';
	this.sName = sname; // имя скрипта. Глобальные массивы:
	this.scripts = []; // масив скриптов
	this.getLastClassPosLine = function (psLine, psScrFName) {
		//debugger;
		var vShortName = getShortFileName(psScrFName);
		var rv = 0; 
		var scr = findByName(this.scripts, vShortName);
		var lastMax = 0;
		if(scr) {
			for(var i = 0; i<scr.classes.length; i++) {
				var cls = scr.classes[i];
				if(cls) {
					if(cls.lineStart < psLine) {
						lastMax = Math.max(lastMax, cls.lineStart)
                    }
					if(cls.lineStart < psLine && cls.lineEnd >=psLine) {
						return cls.lineStart;
                    }
                }
            }
		};
		if(rv == 0) {
			rv = lastMax;
        }
    	return rv;		
    }
	this.makeTime = Date.UTC;
	this.needUpdate = function(psFPath) {
    	var rv = false;
		if((Date.UTC - this.makeTime) > 15) { rv = true;  }
		if(psFPath != this.sName) { rv = true;  }
    	return rv;
    }
	this.getScript = function(scrName) {
		var vShortName = getShortFileName(scrName);
		var rw = findByName(this.scripts, vShortName);
		if(rw) return rw;
		rw = new ScriptMap(scrName);
		this.scripts.push(rw);
		return rw;
	}
	this.getMembersByClass = function(psVarName) {
	/*	return this.getMembers(psVarName);
	}
	this.getMembers = function(psVarName) {*/
    	var rv = '';
		for(var i = 0; i< this.scripts.length; i++) {
			scr = this.scripts[i];
			if(scr) {
				cls = scr.findClass(psVarName);
				if(cls) {	rv = cls.getMembers();		break;      }
            }
			
        }
    	return rv;
    }
}


function makeScriptMap( psScriptFName ) {	// todo ctags!!!!		
	var vFExist = false;
	if(psScriptFName instanceof String) {
		vFExist = fileToCtags(psScriptFName,true);
    } else if(psScriptFName instanceof Array) {
		for(var i = 0; i<psScriptFName.length; i++) {
			vFName = psScriptFName[i];
			vFExist = fileToCtags(vFName,((i == 0) ? true : false));
        }		
    }
	
	if(!vFExist) return 0;
	var vTextCtags = loadFromFile(gIntelCTagsUFPath);
	var vArrLines = vTextCtags.split('\n');
	var cntAll = vArrLines.length;
	var vPartLine = [];
	var scopeMap = new ScopeMap;
	
	var vName, vFile, vLileNo, vType, vOwner;
	var vLine;
	for(var iCntr = 0; iCntr<cntAll; iCntr++) {
		vLine = vArrLines[iCntr];
		vLine = trimSimple(vLine);
		if(vLine == "") continue;
		
		if(vLine.substring(0,1) == '!') continue;
		
		vPartLine = vLine.split('\t');
		vPartCnt = vPartLine.length;
		vName = vPartLine[0];
		vFile = vPartLine[1];
		vLileNo = vPartLine[2];		
		vLileNo = vLileNo.replace(';','').replace('"','');
		vType = vPartLine[3];
		// c-class, m-member, f-function, p-property(string) v-вариабла
		vOwner = vPartLine[4];
		var sObj = scopeMap.getScript(vFile);
		if (vOwner){
			vPos = vOwner.indexOf(':');
			if(vPos != -1) {
				vOwner = vOwner.substring(vPos+1); // овнера то мы поймали, но сам овнер как правило идет внизу, т.е. непонятно какого он типа. Но! как правило это класс.
				var vClass = sObj.getClass(vOwner);
				if(vType == 'm') vClass.addFunction(vName);
				if(vType == 'p' || vType == 'v') vClass.addVar(vName);
				vClass.setPosition(vLileNo);
            }			
		} else {
			if(vType == 'c') {
				var vClass = sObj.getClass(vName);
				vClass.setPosition(vLileNo);
			}
			
		}
	}
	//debugger;
	return scopeMap;
}

//makeScriptMap('D:\\Program Files\\Notepad++\\plugins\\jN\\includes\\Intell.js');

//trdm: 2017-12-24 20:51:04
function switchIntellDebugMode(){
	gIntellDebug = !gIntellDebug;
	gSwitchDebugModeMenuItem.checked = gIntellDebug; // не пашет чекалка????
	var vText = "ВЫключить";
	var vTextStatus = "Выключить отладку Intell.js";
	if (!gIntellDebug) {vText = "Включить"; vTextStatus = "+Включить отладку Intell.js";}
	gSwitchDebugModeMenuItem.text =  vText + " отладку Intell.js\tctrl+F9";
	status(vTextStatus);
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
		gUsingTemplates = gSettingsIni["UsingTemplates"] == "1";
	}	
}


//trdm: 2017-12-23 20:47:42
function trimSimple( psLine ) {	
	var re = new RegExp("^[\\s]+|[\\s]+$", 'g');
	return psLine.replace(re, '');
}
// Отсечь строку по первый не буквенный символ
function normalizeString(psStr) {
	//debugger;
	var rv = trimSimple(psStr);
	var wrongChrs = '(){}[]';
	var vPos = -1;
	for(var i = 0; i<rv.length; i++) {
		var ch = rv.charAt(i);
		vPos = wrongChrs.indexOf(ch);
		if(vPos != -1) { vPos = i;	break;  }
	}
	if(vPos != -1) {
		rv = rv.substring(0,vPos);
    }
	return rv;
} 

function getCleanString(psLine, psLeaveQuotes) {
	//var rv=prompt('Введите строку',100);
	vLQ = (psLeaveQuotes === undefined) ? true : false;
	var rv = psLine; //'line.replace(/(".*")/g,"").split()';
	var reQuotes = /("[^"]*")/ig; // Все что в апосторфах "" 
	var reApostr = /('[^']*')/ig; // Все что в апосторфах '' 
	var reReg = /(\/[^\/]*\/([mgi])*)/ig; // регулярки
	var reBras = /(\([^)]*\))/g;	// Все что в скобках () 
	var reBrasSq = /(\[[^\]]*\])/g; // Все что в скобках []
	var e = new Error;
	var tApo = vLQ ? '\'\'' : '';
	var tQuo = vLQ ? "\"\"" : '';
	try {
		rv = rv.replace(reReg,'').replace(reApostr,tApo).replace(reQuotes,tQuo).replace(reBras,'()').replace(reBrasSq,'');
	} catch(e) {
		alert(e.message);
	}
	return rv;
} //getCleanString()



function isWordCreateObj( psWord ) {
	var rw = false;
	vWord = psWord;
	vWord = vWord.toLowerCase();
	if (vWord == 'activexobject' || vWord == 'createobject') {
		rw = true;
	}	
	return rw;
}


var IntellPlus = {
	  curChar : ""
	, enabled: '' 		// активна технология
	, startLineNo: '' 	// стартовая строка, номер.
	, currentLine: '' 	// текущая строка
	, curPathFile: '' 	// текущая строка
	, currentLineNo: '' // номер текущей проверенной строки, нужен, что-бы исключить повторное сканирование и зацикливание
	, currentWord: '' 	// текущая распознаваемое выражение
	, curWordIsActiveX: false 	// текущая распознаваемое выражение
	, curWordType: '' 	// текущая распознаваемое выражение
	, currentLineCl: ''	// Чистая, для разбора
	, curExtension: '' 	// текущее расширение файла
	, wordIsTemplate: '' 	// текущее расширение файла
	, template: '' 	// текущее расширение файла
	, curLang: '' 		// язык для поиска. Понадобится когда будем работать во фрагментах html | php
	, clear : function(){
		this.curWordIsActiveX = false;
	}
	, isActiveX : function() {
    	return this.curWordIsActiveX;
    }
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
		this.curPathFile = curPathFile;
		retVal = Editor.langs[view.lang];
		retVal = retVal.toLowerCase();
		if (ext == 'vbs') {
			retVal = ext; // забывают про этот "язык". :)
		}
		this.curExtension = retVal;
		this.curLang = retVal;
		
		return retVal;
	}
	, getCurWord : function(){		// 	  document.| где: | - позиция курсора, 
		this.clear();
		this.getCurExtension();
		this.currentLineNo = '';
		this.wordIsTemplate = false;
		this.template = '';
		/* Бага сработало в строке: "    vFName = gIntelDir+'\\js.|';"		| - позиция сработки...		*/
		// todo: надо отключить в комментариях. Опционально конечно.		
		var retVal = "";
		view  = Editor.currentView;
		this.startLineNo = view.line;
		var line = currentView.lines.get(view.line).text;
		line = line.replace(/[\t]/g,"    ");
		this.currentLineCl = line;
		this.currentLine = line;
		this.currentLine = trimSimple(this.currentLine);
		// мне не нужна целая строка, достаточно куска до введенного символа
		lLine = line.substring(0,view.column);
		line = lLine;
		
		var isChar = /[\w\dА-я@$_]/; // только символы строк
		var isCharPlus = /([\w\dА-я@\(\)\.$_])/; // только символы строк + символы: '().$_'
		var isNotAlf = /([\(\)\.])/;
		// страховка от срабатывания в строке.
		line = line.replace(/('.*')/g,""); line = line.replace(/(".*")/g,"");
		//if (line.indexOf(lLine) == -1) return "";
		
		line = getCleanString(line);		
		var wordBegPos = line.length-1;
		var wordEndPos = wordBegPos;
		
		var checkTemplate = false;
		
		//if(gIntellDebug) {	debugger;	}	
		this.curChar  = line.charAt(wordBegPos);
		if (this.curChar == '.')  {
			wordEndPos = wordEndPos - 1;
			if (wordEndPos < 0) {
				return "";
			}
		} else if (this.curChar == '"'){
		    // Может курсор тут: "var gWSH = new ActiveXObject("|" | - позиция курсора
		    var ara = line.split(' ');
		    retVal = ara[ara.length-1];
		    retVal = retVal.replace('(','').replace('"','');
		    retVal = retVal.toLowerCase();
		    if (retVal == "activexobject" || retVal == "createobject") {
		        this.currentWord = retVal;
		        return retVal;
		    }
		} else if(this.curChar == " " || this.curChar == "	"/*'\t'*/){
			// это может быть шаблон
			checkTemplate = true;			
		} else {
			return "";
		}
			
		while (wordBegPos >= 0) {
		    var ch = line.charAt(wordBegPos - 1);
			if (!isCharPlus.test(ch))
				break;				
			wordBegPos--;
		}					
		retVal = line.substr(wordBegPos, wordEndPos - wordBegPos + 1);
		retVal = trimSimple(retVal);
		if (checkTemplate){
			var vTText = isTemplate(retVal);
			if(!vTText) return '';
			this.template = vTText;
			this.wordIsTemplate = (vTText) ? true : false;
			this.currentWord = retVal;
			return retVal;
			//ащк 
		}
		
		if (retVal.indexOf('.') == -1){
			if(isNotAlf.test(retVal)){
				// перечитаем, точки нет, но есть скобки, не хорошо
				wordBegPos = line.length-1;
				wordEndPos = wordBegPos;
				while (wordBegPos >= 0) {
					var ch = line.charAt(wordBegPos - 1);
					if (!isChar.test(ch))
						break;				
					wordBegPos--;
				}					
				retVal = line.substr(wordBegPos, wordEndPos - wordBegPos + 1);
				// Бывае застревает непарная точка сзади. Уберем.
				//while(retVal.substring(retVal.length))
				rr = retVal.substring(retVal.length-1);
				while(rr == '.'){
					retVal = retVal.substring(0,retVal.length-1);
					rr = retVal.substring(retVal.length-1);
				}
					
			}
		}
			
		this.currentWord = retVal;
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
		for (tLine = 0; tLine<=Line; tLine++){
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

function fillLValDict(psFileName, psDict, psCase) {
	var tBadMessage = "";
	vText = loadFromFile(psFileName);
	if(!vText) return;
	var vDictNu = new ActiveXObject("Scripting.Dictionary");
	var arr = vText.split('\n');	
	var tLine = "";
	// debugger;
	for(i=0; i<arr.length; i++){
		tLine = arr[i];
		tLine = trimSimple(tLine);
		tLine = tLine.replace(/\s*/g,"");
		if(tLine == "") continue;
		tPos = tLine.indexOf("#");
		if(tPos != -1) { continue; }
		tLine = tLine.replace('(',''); 	tLine = tLine.replace(')','');
		tLine = tLine.toLowerCase();
		tLine = tLine.replace(" ","");
		tPos = tLine.split("=");	
		try {
			if(psCase == 1) { 
				//Object = Editor.addHotKey() to psDict.Add(Editor.addHotKey,Object); 
				psDict.Add(tPos[1],tPos[0]); 				
			}
			if(psCase == 2) { 
				//Object = Editor.addHotKey() to psDict.Add('addHotKey','Editor.Object'); 
				ara2 = tPos[1].split('.');
				v1 = ara2[ara2.length-1];
				v2 = tPos[0]+'.'+ara2[0];
				
				if(!psDict.Exists(v1)) {
					psDict.Add(v1,v2); // Так?
				} else if(!vDictNu.Exists(v1)){
					vDictNu.Add(v1,v1);
				}
			}
		} catch(e) {
			tBm = "Не удалась вставка: "+arr[i] + " строка: "+ i;
			tBadMessage += tBm;
			tBadMessage += '\n';				
		}			
	}
	if(psCase == 2) {
		// надо удалить все не уникальные ключи из 
		var keys = vDictNu.Keys();
		for(var i = 0; i<(keys.count-1); i++) {
			var key = keys[i];
			vDictNu.Remove(key);
		}
	}
	if (tBadMessage != "") {
		status(tBadMessage);
		alert(tBadMessage);
	}	
}

// Разбираем js.lval и Разбираем js.lvalu
function initLValDictions() {
	if (!gJsLvalDict) {
		var vFName = gIntelDir+'\\js.lval'; 
		var vFName2 = gIntelDir+'\\_common.lval'; 
		gJsLvalDict = new ActiveXObject("Scripting.Dictionary");
		gJsLvalDictUni = new ActiveXObject("Scripting.Dictionary");
		
		fillLValDict(vFName, gJsLvalDict,1);
		fillLValDict(vFName2, gJsLvalDict,1);
		fillLValDict(vFName, gJsLvalDictUni,2);
		fillLValDict(vFName2, gJsLvalDictUni,2);
	}
}


function getTypeFromLval(psOneType, psMeth) {
	var retVal = "";
	if(!gJsLvalDict){
		initLValDictions();
	}
	var vMeth = psMeth;
	if (!vMeth) {
		// todo, плохо, не должно так быть
		return;
	}
	vMeth = vMeth.replace('(',''); 	vMeth = vMeth.replace(')','');
	var tText = psOneType+"."+vMeth;
	tText = tText.toLowerCase();
	
	if(gJsLvalDict.Exists(tText)){
		retVal = gJsLvalDict.Item(tText);
	}
	return retVal;
}

// опознавание переменной по уникальным методам
function getTypeFromLvalUni(psMeth, psCase) {
	if(!gJsLvalDict){
		initLValDictions();
	}
	vMeth = psMeth;
	if (!vMeth) {		// todo, плохо, не должно так быть
		return '';
	}
	var vCase = (psCase) ? psCase : 0;
	vMeth = vMeth.replace('(','').replace(')','').toLowerCase().replace('\'','').replace('"','');
	if (gJsLvalDictUni.Exists(vMeth)) {
		//gJsLvalDictUni.Add('split','array.string')
		retVal = gJsLvalDictUni.Item(vMeth);
		retVal = retVal.split(".")[vCase];
		return retVal;
	}
	return "";
	
}

function getTypeFromLongDot(psLine, psAllText) {
	var rv = "";
	vLine = psLine;
	// document.forms["newmsg_form"]- надо убрать [\.] и (\.)
	patern = /(\[.*\])/g; 	vLine = vLine.replace(patern,"");
	patern = /(\(.*\))/g; 	vLine = vLine.replace(patern,"");
	var wArr = vLine.split(".");
	rv = getTypeFromLvalUni(wArr[wArr.length-1],0);
	if(rv == ""){
		vLine = "";
		
		if(wArr.length>1){
			wOne = wArr[0];
			
			wOneType = getSimleType_js(wArr[0],psAllText);
			if (wOneType != "") {
				for(iw = 1; iw<wArr.length; iw++){
					wTwo = wArr[iw];
					if(wTwo == '') continue;
					wOneType = getTypeFromLval(wOneType,wTwo);
					if(wOneType == "") break;
				}
			}		     
			rv = wOneType;
		} else {
			rv = getSimleType_js(wArr[0],psAllText);
		}	
	}
	return rv;
}

function normalizeResult(psStr) {
	var rv = '';
	return rv;
}

function checkActiveXDictionary() {
	var rv = '';
	if(IntellOle) {
		/* 	todo Вот тут лажа, т.к. контекст тут общий для скриптов, находящихся в каталоге '\Notepad++\plugins\jN\includes'
		а я этого не учитываю при формировании с использованием ctags	*/
		if(IntellOle.isProgID(IntellPlus.curWordType)) {
			IntellOle.MakeData(IntellPlus.curWordType);
		} 
    }
	return rv;
}


//trdm: Работа сразу со всем текстом не оправдана, надо разбирать построчно.
function getSimleType_js(psCurWord, psAllText) {
	gSearchCount++;
	if(gSearchCount >= gSearchCountMax) {
		return "";
	}
	var allText = psAllText;
	
	if (psCurWord == "") return "";
	
	var retVal = "";
	var curLang = 'js';
	bi_types = getBuiltInTypes(curLang);
	if (bi_types.Exists(psCurWord)){
		return psCurWord;
	}
	// if(gIntellDebug) {	debugger;	}	
	if (psCurWord.indexOf('.') != -1) {
	    retVal = getTypeFromLongDot(psCurWord,allText);
	    if (retVal/* != ""*/) {
	        return retVal;
	    }
	}
	retVal = getTypeFromLvalUni(psCurWord,0); // зарезервированное слово/метод.
	if(retVal) return retVal;
	
	paternNew = psCurWord+"\\s*\\=\\s*new\\s*([a-zA-Z_]+[0-9]?)"; //re = new RegExp(paternNew, 'img');
	paternActive = psCurWord+'\\s*\\=\\s*new\\s*ActiveXObject\\(\\"([a-zA-Z_0-9\\.]+\\")\\)';  		//retVal = new ActiveXObject("Scripting.Dictionary");		
	paternLVal = psCurWord+'\\s*\\=\\s*([a-zA-Z_\\(\\)\\[\\]"\'\\.\\]+[0-9]*)';	
	paternLVal = psCurWord+'\\s*\\=\\s*([a-zA-Z_\\(\\)\\[\\]"\'\\.\\\/]+[0-9]*)';	
	paternLValWe = psCurWord+'\\s*\\.\\s*([a-zA-Z_]+[0-9]*)';	
	try {
		// при незакрытой скобке в psCurWord, к примеру: "while(vText" возникает эксепшинз.
		reNew = new RegExp(paternNew, 'img');
		reActive = new RegExp(paternActive, 'img');
		reLVal = new RegExp(paternLVal, 'img');
		reLValWe = new RegExp(paternLValWe, 'img');
		reResu;
		isChar = /[\w\dА-я$_]/; // только символы строк
	} catch(e) {
		vBadString = 'Ошибка при распознавании: '+ psCurWord+' строка: '+IntellPlus.currentLineNo;
		status(vBadString);
	}
	
	allText = allText.replace(';','\n'); // аукнется конечно, но ничего переивем
	allText = allText.replace('\n\n','\n'); // аукнется конечно, но ничего переивем
	var vTextLines = allText.split('\n');
	var vTLLen = vTextLines.length-1; // Надо сканировать не с начала текста, а запоминать позицию. И почему я начинаю с верхней строки, вдруг кто-то пишет код слитно???
	if(IntellPlus.currentLineNo == ''){
		IntellPlus.currentLineNo = vTLLen;
	} else { vTLLen = IntellPlus.currentLineNo - 1;}
	for (var iL = vTLLen; iL>=0; iL-- ) {
		IntellPlus.currentLineNo = iL;
		var tLine = vTextLines[iL];	//	alert(tLine);
		tLine = trimSimple(tLine);
		if (tLine == '') continue;
		if (!/[\w\dА-я$_]/.test(tLine)) continue;
		
		
		//tLine = todo // сделать трим и проверить на пустую строку, или на строку содержащую символы, если символы есть, то-ок, нет - нафиг, т.е. может и просто { или } быть
		var reResu = reNew.exec(tLine);
		if (reResu != null) {
			retVal = reResu[1]; // нужна последняя
			//break; // не нужно, вдруг поймаем "ActiveXObject"
		}
		if (retVal == "" || retVal == "ActiveXObject") {
			var reResu = reActive.exec(tLine);
			if (reResu != null) {
				IntellPlus.curWordIsActiveX = true;
				retVal = reResu[1];
				retVal = retVal.replace('"','');
				IntellPlus.curWordType = retVal;
				break;
			}
		}	
		//tLine = getCleanString(tLine, true); 
		if (!retVal) {		
			var reResu = reLVal.exec(tLine);
			if (reResu != null) {
				retVal = reResu[1];				
			}
			if(retVal != ""){
				var tCharOne = retVal.substring(0,1);
				if(tCharOne == '"' || tCharOne == '\'') {
					retVal = "String";
				} else if (tCharOne == '/'){   retVal = "RegExp";
				} else if (tCharOne == '['){   retVal = "Array";
				} else {
					retVal = normalizeString(retVal); // todo ломает  uStrung.substring().split(). //<< сломалось, не хочет join
				    iLLast = iL; // Для восстановления сканирования с предыдущей строки.
					retVal = getTypeFromLongDot(retVal, allText);
					iL = iLLast;
				}
			}
		}
		if (!retVal) {
			var reResu = reLValWe.exec(tLine);
			if (reResu != null) {
				retVal = ''+getTypeFromLvalUni(reResu[1],1);
				if(retVal) return retVal;
			}
		}		
		if (retVal) break;
	}
	// Настала очередь ctags?
	if(retVal != ""){
		IntellPlus.curWordType = retVal;
		if(IntellPlus.isActiveX()) {
			checkActiveXDictionary();
		}
	}
	if (retVal)	retVal = retVal.replace('"','');
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
function selectFromList_simple(psStrList) {
	var arr = new Array;	
	strList = psStrList;
	arr = strList.split('\n');
	arr.sort();
	strList = arr.join('\n');
    try   {        var sel = new ActiveXObject('Svcsvc.Service');    }
    catch(e)    {
        alert("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll");
        return false;
    }	
	var rv = sel.FilterValue(strList, 1 + 4 + 16);
	if (gSendEscAfterSelect) {
		var wshShell = new ActiveXObject("WScript.Shell");
		wshShell.sendKeys("{ESC}");
	}
	//tPos = rv.indexOf(";"); 	if(tPos != -1) {		rv = tLine.substring(0,tPos);			}	
	return rv;
	
	
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
    try   {        var sel = new ActiveXObject('Svcsvc.Service');    }
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

function arrayPushUniStr(psAra, psStr) {
	var has = false;
	for(var i = 0; i<psAra.length; i++) {
		if(psAra[i] == psStr) {
			has = true;
			break;			
        }
    }
	if(!has) {
		psAra.push(psStr);
		has = true;
    }
	return has;
}

function getThisScopeFiles(psFName){
	//debugger;
	var rv = new Array;
	var vFName = psFName;
	rv.push(vFName);
	if(vFName.indexOf(gNjPluginDir) != -1) {
		//\todo любопытная с точки зрения подсказки по методам ситуация, можно вычленить тип коллекции.
		vFolderN = gNjPluginDir+'includes\\';
		vFolderO = gFso.GetFolder(vFolderN);
		var fc = new Enumerator(vFolderO.Files);
		for (fc.moveFirst(); !fc.atEnd(); fc.moveNext()) {
			vFileO = fc.item();
			arrayPushUniStr(rv, vFileO.Path);
		}
    }
	rv.sort();
	return rv;
}

//getThisScopeFiles("D:\\Program Files\\Notepad++\\plugins\\jN\\includes\\Intell.js");

function getMembersFromCtags() {
	var rv = '';
	// возможно имеем лело с переменной, объявленной как var curWord = {} или с классом, возвращаемыйм функцией.			
	//debugger;
	var vFName = IntellPlus.curPathFile;
	var vArrFilePath = getThisScopeFiles(vFName);
	var needMk = false;
	if(0) { gCtagsMapLast = new ScopeMap('');       }
	if(!gCtagsMapLast) { needMk = true;	}
	if(gCtagsMapLast) { needMk = gCtagsMapLast.needUpdate(); }
	if(needMk) { gCtagsMapLast = makeScriptMap(vArrFilePath); /*makeScriptMap(vFName);*/  }
	if(gCtagsMapLast) {
		//vPos = gCtagsMapLast.getLastClassPosLine(IntellPlus.|); \\todo на непарную скобку реакция плохая
		if(IntellPlus.currentWord == 'this') {
			vPos = gCtagsMapLast.getLastClassPosLine(IntellPlus.startLineNo, IntellPlus.curPathFile);
			if(vPos>0) {
				rv = getMethodsForThis(vPos, IntellPlus.startLineNo);
            }
		} else {
			rv = gCtagsMapLast.getMembersByClass(IntellPlus.typeCWD);
		}
	}
	if(!rv) {
		gCtagsMapLast = makeScriptMap(vFName);
		if(gCtagsMapLast) {
			rv = gCtagsMapLast.getMembersByClass(IntellPlus.currentWord);
			rv = rv + '\n' + gCtagsMapLast.getMembersByClass(IntellPlus.typeCWD);
			rv = trimSimple(rv);
			//if(Methods.) {}
		}
	}	
	return rv;
}

//trdm: 2018-01-18 10:29:24
function getMethodsForThis(psPosS, psPosE){
	var rv = '';
	var vTextBetween = '';
	var view = Editor.currentView;
	for(var i = psPosS; i< psPosE; i++) {
		vTextBetween = vTextBetween + '\n' + view.lines.get(i).text;
    }
	var dict = new ActiveXObject("Scripting.Dictionary");
	var reThis = /this.([A-z]+)/g;
	var reRe = reThis.exec(vTextBetween);
	while (reRe != null) {
		var fRes = reRe[1];
		if(fRes) {
			if(!dict.Exists(fRes)) {
				fRes2 = '0000 '+ fRes;
				rv = rv + fRes2 + '\n';
				dict.Add(fRes,fRes);
            }			
        }
		reRe = reThis.exec(vTextBetween);
	}	
	return rv;
}



/*	UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU
	Основная процедура запуска скрипта. Обеспечивает распознавание возможности коде-комплита, 
	парсинг, выбор вваринта и встравку результата во view. -_-
*/
function getWordList() {
 	if(gIntellDebug) {debugger;}	
	gSearchCount = 0;
	var retVal = '';
	var curWord = IntellPlus.getCurWord(); 
	if (!curWord) { /*insertTemplate();*/ return; }
	if (IntellPlus.curLang != "js") return;
	
	if (curcorInComment()) return;
	if (curcorInSring()) return;
	
	if (IntellPlus.wordIsTemplate) {
		return insertTemplate();
	}
	loadTemplates();
	
	
	view  = Editor.currentView;
	var currentLine = IntellPlus.currentLine;
	var allText = PrepareModuleText(view.line, view.column);
	var Methods = "";
	var ProgIdS = "";
	var attrib = "";
	// todo отработать: gJsLvalDict = new ActiveXObject("|") << вставка из списка прог-идов
	if (IntellPlus.currentLine == '') {
		/*insertTemplate();*/		
		return;
	} else if (isWordCreateObj(curWord)){
		ProgIdS = loadFromFile(gIntelFileOTD);
	} else {
		var typeCWD = getSimleType_js(curWord, allText);
		if (!typeCWD){
			// Прикинемся что объект строка? .....
			if(gOtherVarAsString)	Methods = getAtributesFromType("String");
		}
		if (typeCWD){
			Methods = getAtributesFromType(typeCWD, curWord);
		}
		
		if(IntellOle) {
			var ttt = 12;
			
			// вот тут надо проверить не создавался ли объект конструкцией ActiveXObject и есть ли у него словари, а если нет - то запустить IntellOle.MakeData(psProgID)
        }
		if(!Methods  && !ProgIdS) {
			IntellPlus.typeCWD = typeCWD;			
			Methods = getMembersFromCtags();
		}
	}
	
	gCallCount++;
	if(Methods) {
		status("Готово: " + gCallCount + " "+curWord+"->"+typeCWD);
		attrib = selectFromList(Methods, curWord);
	} else if(ProgIdS){
		attrib = selectFromList_simple(ProgIdS);
	} else {
		status("Не удалось распознать: " +curWord+", вызовов: "+gCallCount); /*  +' style: '+curcorInComment() */
	}
	if(attrib) {
		Editor.currentView.selection = attrib;
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
	//loadTemplates(); 
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
scriptsMenu.addSeparator();
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
// а мне норм, я уже на 1588 строке....  