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
	gCtagsjNProjectFile = 'project.projc'; обычный ini-фал
		- Для проектов на c/c++ и php необходимо определиться с некими настройками:
			- Каталог проекта
			- каталог include, 
		Это сэекономит время сканирования каталогов утилитой ctags, т.к. время сканирования может быть намалым.

	todo/рулперы:
	- [ok] Реализация шаблонов при вводе.
	- [ok] Работа в скриптах *.js, *.vbs.
	- [ok] Подсказка по методам и пропертям: 
		- [ok] встроенных объектов, 
		- [ok] ActiveXObject-ов,
		- [ok] подсказка по методам пользовательских объектов;
		- Внутри объекта неважно реализовано.
		- реализовать подсказку по объектам, возвращаемым функциями.
		- Реализовать работу внутри html-файлов.
	- [ok] можно ли как-то узнать от сцинтилы что позиция курсора находится в многострочном коментарии? тогда бы не пришлось парсить текст полностью. иотключить IntelliSense для коментариев.
		SCI_GETSTYLEAT(int position) http://novikovmaxim.livejournal.com/tag/scintilla
	- [ok] список задач в ..\Notepad++\plugins\jN\includes\disabled\_test.js
	- [ok] сделать распознавание по уникальным методам/свойствам: Ara = sss.split() split - уникален
	- Требуемый в настоящий момент фраймверки можно глянуть тут: https://moikrug.ru/vacancies?skills%5B%5D=264
	- ctags не берет: D:\Program Files\Notepad++\plugins\jN\_tests\dtree.js
		C:\Progekts\_Utils\_Npp\__Intellisense\ExuberantCtags\src - компилябельная версия, можно патчить.
	- https://docs.emmet.io/cheat-sheet/ - сокращения из эммета
	- https://cloud.githubusercontent.com/assets/11839736/16642200/6624dde0-43bd-11e6-8595-c81885ba0dc2.png  - автодополнение не по первым символам, а по вхождению.
	- //todo - вводишь точку в коменте и идет ошибка.
	
	doc & tools:
	- https://msdn.microsoft.com/ru-ru/library/windows/desktop/ms646977(v=vs.85).aspx - информация о менюшках приложения. Понадобится для контроля акселераторов.
	- https://www.regextester.com/ - тестирование RegExp для javascript
	- посмотреть C:\Progekts\_Utils\_Npp\sourcecookifier\sourcecookifier\SourceCookifier на предмет разбора файлов исходников.
	- посмотреть https://msdn.microsoft.com/ru-ru/library/bb385682.aspx IntelliSense для JavaScript для Visual Studio
	- Неполохое автодополнение у JetBrains WebStorm 7.0.3 посмотреть что умеет, подчерпнуть полезное :)
	- https://github.com/felixfbecker/php-language-server - хорошая презентация автодополнения. 
	- https://www.codeproject.com/kb/winhelp/htmlhelp.aspx?msg=412226 - Htmlhelp Forensics
	- http://msdn.microsoft.com/en-us/library/dd375731(VS.85).aspx - Виртуальные коды клавиш

*/
require("lib/Window.js");
require("lib/scintilla.js");
require("lib/User32.dll.js");


var gJsLvalDict; 
var gJsLvalDictUni; 
var gStatuBar; // Статус бар Notepadd
var gMenuArray = new Array();
var gNjPluginDir = Editor.nppDir +"\\plugins\\jN\\";
var gNjPluginIncDir = Editor.nppDir +"\\plugins\\jN\\includes\\";
var gNjPluginLibDir = Editor.nppDir +"\\plugins\\jN\\lib\\";


var gIntelDir = gNjPluginDir+"Intell\\";
var gIntelCTagsUFPath = gNjPluginDir+"Intell\\u_ctagsU.txt";
var gIntelSystemDir = gNjPluginDir+"system\\";
var gIntelCTagsUExeFPath = gIntelSystemDir+"\\ctagsU.exe";
var gIntelFileOTD = gIntelDir + "intell_otd.dict"; //"OtherTypesDefine.txt";
var gCtagsMapLast = 0;
var gIntelShowParseLine = true;

var gIntellDebug = false; 		// отладка отключена
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
var gIntellModeMenuItem; 	// Элемент меню "Включить выключить сам интеллиценз"
// todo - реализовать эту хрень, а то не всегда находит определения..
var gIntellCtagsScanMode = 0; // 0-извлекать include; 1-парсить каталог
var gIntellCtagsScanModeMenuItem; 	// Элемент меню "Включить выключить сам интеллиценз"

var gCurentCharAdded = 0; 			// Текущий добавленный символ.
var gjN_ctags_ini = 'jN.ctags.ini'; // имя файла 'jN.ctags.ini'
var gCtagsjNProjectFile = 'project.projc'; // обычный ini-фал


var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gWshShell = new ActiveXObject("WScript.Shell");
var gShell = gWshShell;
var gSettingsIni = {};
var gSearchCount = 0; 	  // Счетчик запуска getSimleType_js()
var gSearchCountMax = 20; // Ограничение максимального кол-ва запуска.
var gCallCount = 0;
var gIntellLogger = 0; 	// будем логировать результат распознавания с именем файла

// todo - доделать его для учета рабочего времени.
var gWorkLoger = 0; 			// Логер котору мне нужен конкретно для работы
var gWorkLogerEnabled = false; 	// Логер котору мне нужен конкретно для работы

// templates|Шаблоны из *.tmpl .Не инициализированный gTemplatesFromLang - сигнал для loadTemplates()
var gTemplatesFromLang; // = new ActiveXObject("Scripting.Dictionary"); //gTemplatesFromLang.Add(lang,'Scripting.Dictionary-2') 'Scripting.Dictionary-2' ->> Add(templ_word,'templ_bodi')
var gTemplatesCurentLang = ''; // язык загруженных шаблонов, если требуется другой, прийдется перезагрузить шаблоны

// глобальная переменная с меню скриптами.
if (!jN.scriptsMenu){
	var scriptsMenu = Editor.addMenu("Скрипты");
	jN.scriptsMenu = scriptsMenu;
} else { 
	scriptsMenu = jN.scriptsMenu;
}

//MsgBox из vbscript, надо привести к его виду
function MsgBox() {
	//MessageBoxW->> https://msdn.microsoft.com/ru-ru/library/windows/desktop/ms645505(v=vs.85).aspx
	var rv = User32.MessageBoxW(Editor.handle,"Вопрос вопроса","Привет",1);
	// 1 - Ok| 2 - cansel(и даже если нажат Esc)
	return rv;
}

function writeToIntellLog(psStr) {
	if(gIntellDebug) { debugger; }
	if(!gIntellLogger) {
		gIntellLogger = new CIntellLoger('_intell');    
    }
	var cFile = IntellPlus.curPathFile;
	gIntellLogger.log(psStr+'; '+cFile);
}


GlobalListener.addListener({
	CHARADDED:function(v, pos){		// Tab не счистается символом? Не срабатывает функция..
		if (gIntellEnabled){			//debugger;
			gCurentCharAdded = v;
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
	if(IntellPlus.curLang == 'js') {
		rw = (style == 7 /*|| style == 2*/) ? true : false;
    } else if(IntellPlus.curLang == 'html') {
		rw = (style == 6 /*|| style == 2*/) ? true : false;
    }
	return rw;
}

function curcorInLexer(){
	var rw = 0;
	// var sci = new Scintilla(currentView.handle);
	// rw = sci.Call("SCI_GETLEXER"/*,currentView.bytePos*/); 
	return rw;
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

// Надо проверить текущий лагнг и соответствуют ли ему шаблоны
function checkTemplate() {
	var rv = '';
	if(IntellPlus.curLang != gTemplatesCurentLang) {
		gTemplatesCurentLang = '';
		gTemplatesFromLang = '';
    }	
	return rv;
}

function loadTemplatFromFile(psFileName) {
	var vTextAll = loadFromFile(psFileName);
	if(!vTextAll) {
    	return;
    }
	var vTemplIdent = 'Template:';
	var templMap;
	// Дикшионари не поддерживает в валуе дикшионери? Ну и хрен с тобой. Будем вставлять в него же, но вот так: lang+'.'+temlpId
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
		vIdent = vIdent.toLowerCase();
		vTextAll = '';
		for(i2 = 1; i2<arr0.length; i2++){
			vTextAll = vTextAll + ((i2 == 1) ? '':'\n' ) +arr0[i2];
		}	
		try {
			// gTemplatesFromLang.Add(lang+'.'+vIdent,vTextAll);
			gTemplatesFromLang.Add(vIdent,vTextAll);
		} catch(e) {
			alert('Ошибка при вставке "'+vIdent+'"! ');
		}
		vTextAll = vTextAll;
	}
}

function addToTemplatesFromLang(psKey, psVal) {
	var rv = '';
	if(!gTemplatesFromLang.Exists(psKey)) {
    	gTemplatesFromLang.Add(psKey,psVal);
    }
	return rv;
}


// Шаблоны. Надо считывать при первом обращении в getCurWord
function loadTemplates() {
	if(!gUsingTemplates) return;
	checkTemplate();
	if (gTemplatesFromLang) return;		//debugger;
	gTemplatesFromLang = new ActiveXObject("Scripting.Dictionary");
	var lang = IntellPlus.curLang; // todo ctags!!!!	И еще ITypeLib, что-б её...................
	fName = vTmplDir + '_common.tmpl';
	if(gFso.FileExists(fName)) {
    	loadTemplatFromFile(fName);
    }
	var Today = new Date;
	addToTemplatesFromLang('trdm','// trdm '+formatData(Today, 'yyyy-MM-dd hh:mm:ss '));
	
	if (lang == '') return;
	var vTmplDir = gIntelDir + 'tmpl\\';
	var fName = vTmplDir + lang + '.tmpl';
	if (!gFso.FileExists(fName)) {		fName = vTmplDir +'_' +lang + '.tmpl';
		if(!gFso.FileExists(fName)) {			fName = vTmplDir +'__' +lang + '.tmpl';
			if(!gFso.FileExists(fName)) {
				// А то чистить каталог устал, надо отсортировать нормально			
				return;	
            }
        }
	}
	loadTemplatFromFile(fName);
}

function reLoadTemplates() {
	// debugger;
	gTemplatesFromLang = '';
	status("Перечитываем шаблоны...");
	loadTemplates();
	status("reLoadTemplates done...");
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
		keysNeed.push(vTemplId);
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
	checkTemplate();
	var retVal = '';
	var vWord = psWord;
	vWord = vWord.toLowerCase();
	var lang = IntellPlus.curLang;
	if(!lang) return;
	if(!gTemplatesFromLang) loadTemplates();
	if(gTemplatesFromLang.Exists(vWord)) {
		retVal = gTemplatesFromLang.Item(vWord);
		return retVal;
	}
	return retVal;	
}

function insertTemplate() {
	if(!gUsingTemplates) return false;
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
	/* todo.... 2018-3-07_19-25
	может не страдать херней, а для проектов на си и си++ использовать рекурсивные запуски типа:
	ctags.exe -R -f u_ctagsU.txt --language=c --excmd=number
	???? гораздо быстрее получается и гораздо точнее, что немаловажно..
	*/
	var vComandLine = '';
	var isFolder = gFso.FolderExists(psFileName);
	if(!isFolder) {
		var vFirst = (psFirst) ? true : false;
		var vFChar = (vFirst) ? '' : ' -a ';
		if(!gFso.FileExists(vFName)) return;
		if(!gFso.FileExists(gIntelCTagsUExeFPath)) return; 	// --if0=yes --list-fields - не обрабатывается
		vComandLine = '"'+gIntelCTagsUExeFPath+'"'+vFChar+' -R -F --machinable=yes --if0=yes --list-fields --sort=no --excmd=number -f "'+gIntelCTagsUFPath+'" "'+vFName+'"';
		vComandLine = '"'+gIntelCTagsUExeFPath+'"'+vFChar+' -R -F --machinable=yes --sort=no --excmd=number -f "'+gIntelCTagsUFPath+'" "'+vFName+'"';	// debugger;
    } else {
		vComandLine = '"'+gIntelCTagsUExeFPath+'" -R -F --machinable=yes --sort=no --excmd=number -f "'+gIntelCTagsUFPath+'" "'+vFName+'"';	// debugger;
	}
	if(!gIntelShowParseLine) { 
		status('Parse: '+vFName);	// var gWshShell = new ActiveXObject("WScript.Shell");
	}
	status('WshShell.Run: '+vComandLine);	// var gWshShell = new ActiveXObject("WScript.Shell");
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

function clearArray(paAra) {
	while(paAra.length>0) {
		paAra.pop();
    	// break; continue;
    }
}

function ClassMap(clname){
	this.name = clname;
	this.line = 0;  	// текущая строка
	this.lineStart = 0; // Заготовка для пост парсинга, а то как-то слабовато stags выдает. или я не правильно прогаю.
	this.lineEnd = 0;
	this.vars = []; 	// масив переменных глобальных
	this.functions = []; // масив функций глобальных
	this.addVar 	 = function(psVName) {    	addClassUnique(this.vars, psVName); 	this.registerPosition(psVName);   }
	this.addFunction = function(psFName) {    	addClassUnique(this.functions, psFName);this.registerPosition(psFName);    }
	this.parent = 0; // ScriptMap
	this.clear = function() {
    	this.parent = 0;
		clearArray(this.vars);
		clearArray(this.addFunction);		
    }
	
	this.registerPosition = function(psMName) {
		//todo - debugger this. -> почемуто this->regexp
    	if(this.parent) { 
			vNameFull = this.name+'.'+psMName;
			this.parent.registerPosition(vNameFull);			
		}		
    }
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
		this.line = vPos;  	// текущая строка
		
		this.lineEnd = Math.max(this.lineEnd,psPos);
		if(this.lineStart == 0) {
			this.lineStart = psPos;
        } else {
			this.lineStart = Math.min(this.lineStart, psPos);
		}
    }
    this.curentLine = function() {
		if(this.parent) {
			return this.parent.line;
        } else {
			return 0;
		}
    }
}

function ScriptMap(scrname){
	this.name = scrname; 	// Краткое имя скрипта
	this.NameFull = scrname;// Полное имя скрипта
	this.functions = []; 	// масив функций 
	this.vars = []; 		// масив переменных глобальных
	this.classes = []; 		// масив функций глобальных	
	this.line = 0;  		// текущая строка
	this.parent = 0; // ScopeMap
	var Arr = scrname.split('\\');
	this.name = Arr[Arr.length-1];
	this.addVar 	 = function(psVName) {    	addClassUnique(this.vars, psVName); 	this.registerPosition(psVName);   }
	this.addFunction = function(psFName) {    	addClassUnique(this.functions, psFName);this.registerPosition(psFName);    }	
	this.getClass = function(className) {
    	var rv = findByName(this.classes,className);
		if(!rv) {	
			rv = new ClassMap(className);	
			rv.parent = this;
			this.classes.push(rv);
			this.registerPosition(className);
		}
    	return rv;		
    }
	
	this.registerPosition = function (psNameFull) {
		if(this.parent) {
			var vFaileEndLine = this.NameFull+'#'+this.line;
			this.parent.registerPosition(psNameFull,vFaileEndLine);
		}
    }
	this.findClass = function(className) {
		return findByName(this.classes,className);
	}
    this.setCurentLine = function(psLineNo) {
		vPos = parseInt(psLineNo);
		if(vPos == 0) return;
		this.line = vPos;
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
	this.lineMap = new ActiveXObject("Scripting.Dictionary"); // Хешь Ключ: класс.метод, значение: ПутьКФайлу+номерСтроки
	// todo надо регистрировать класс 
	this.registerPosition = function (psNameFull, psPosFull, psBeSure) {
		if(psBeSure) {
			if(this.lineMap.Exists(psNameFull)) {
				this.lineMap.Remove(psNameFull);
            }
        }
		if(!this.lineMap.Exists(psNameFull)) {
			if(psNameFull.indexOf('AnonymousFunction') == -1) {
				// Ну не смогла....
				this.lineMap.Add(psNameFull,psPosFull);
            }
		}
	}
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
		if((Date.UTC - this.makeTime) > 150) { 
			/* \todo
			ну ваще так не годится, надо просто запомнить дату/время последнего сохранения скрипта и 
			спросить, не изменились ли оне. Изменились - апдейтить. А еще лучше дополнительно спросить нотепад++ 
			о модифицированности и принять энто во внимание.
			*/
			rv = true;  
		}
		if(psFPath) { 
			// Если скрипт не опознан, тогда почему бы и нет.
			var scrObj = this.existScript(psFPath);
			if(!scrObj) {
				var rv = true;
            }	
		}
    	return rv;
    }
	this.existScript = function(scrName) {
		var vShortName = getShortFileName(scrName);
		var rw = findByName(this.scripts, vShortName);
		if(rw) return rw;
		return false;
	}	
	this.getScript = function(scrName) {
		var vShortName = getShortFileName(scrName);
		var rw = findByName(this.scripts, vShortName);
		if(rw) return rw;
		rw = new ScriptMap(scrName);
		rw.parent = this;
		this.scripts.push(rw);
		return rw;
	}
	this.getAllMembers = function(psFileName) {
		//todo - доделать.. Все собрано в this.lineMap		
		var rv = '';
		var vFName = psFileName;
		if(vFName) {
			var a = vFName.split('\\');
			vFName = a[a.length-1];        
        } else {
			vFName = '';
		}
		var add = false;
		var val = '';
		if(this.lineMap.Count > 0) {
			var objEnum = new Enumerator(this.lineMap);			
			objEnum.moveFirst();
			while(!objEnum.atEnd()) {
				k = objEnum.item(); 
				add = true;
				if(vFName) {
					add = false;
					val = this.lineMap.Item(k);
					if(val.indexOf(vFName) != -1) {
						add = true;
                    }
                }
				if(add) {
					rv += k+'\n';
                }
				objEnum.moveNext();
			}       
        }
    	return rv;
	}
	
	this.findPosByObjectString = function(psObjStr) {
    	var rv = '';
		if(this.lineMap.Exists(psObjStr)) {
			rv = this.lineMap.Item(psObjStr);
        }		
    	return rv;
    }
	// найти вхождение строки объекта, нужно для метода
	this.findAllMembersByObject = function (psObjStr) {
    	var rv = '';
		if(this.lineMap.Count > 0 && psObjStr) {
			var objEnum = new Enumerator(this.lineMap);			
			objEnum.moveFirst();
			while(!objEnum.atEnd()) {
				k = objEnum.item(); 
				try { 
					if(k.indexOf(psObjStr) != -1) { rv += k+'\n'; }				
                } catch(e) {
                }
				objEnum.moveNext();
			}       
        }
    	return rv;
    }
	
	this.getMembersByClass = function(psVarName) {
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
} // ScopeMap


function makeScriptMapParseCtagsResult( psScriptFName ) {	// todo ctags!!!!		
	if(gIntellDebug) { debugger;}
	var vFExist = false;
	status('makeScriptMapParseCtagsResult-Intell');
	if(typeof(psScriptFName) == 'string') {
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
	
	var vName, vFile, vFileOld, vLileNo, vType, vOwner;
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
		vLileNo = parseInt(vLileNo);
		vType = vPartLine[3];
		if(vFileOld != vFile) {
			vFileOld = vFile;
			status('makeScriptMapParseCtagsResult-'+vFileOld);
        }
		// c-class, m-member, f-function, p-property(string) v-вариабла d-define
		vOwner = vPartLine[4];
		if(vOwner == 'file:') {
			vOwner = '';
		} else 	if(typeof(vOwner) == 'string') {
			if(vOwner.indexOf('typeref:') != -1) {
				vOwner = '';            
			}			
		}
		if(vName.substring(0,6)	== "__anon") {
			continue;
        }
		var sObj = scopeMap.getScript(vFile);
		if(0) {
			sObj = new ScriptMap;        
        }
		sObj.setCurentLine(vLileNo);
		if (vOwner){
			vPos = vOwner.indexOf(':');
			if(vPos != -1) {
				vOwner = vOwner.substring(vPos+1); // овнера то мы поймали, но сам овнер как правило идет внизу, т.е. непонятно какого он типа. Но! как правило это класс.
				var vClass = sObj.getClass(vOwner);
				vClass.setPosition(vLileNo);
				if(vType == 'm' || vType == 'f') vClass.addFunction(vName);
				if(vType == 'p' || vType == 'v' || vType == 'e') vClass.addVar(vName);
            }			
		} else {
			if(vType == 'c' || vType == 'e' || vType == 't') {
				var vClass = sObj.getClass(vName);				
				vClass.setPosition(vLileNo);
				scopeMap.registerPosition(vName,vFile+'#'+vLileNo, true);
			} else if(vType == 'm' || vType == 'f') {	sObj.addFunction(vName);
			} else if(vType == 'v' || vType == 'd') {	sObj.addVar(vName); //sObj.
			//d-define
            }
			
		}
	}
	//debugger;
	return scopeMap;
}

//makeScriptMapParseCtagsResult('D:\\Program Files\\Notepad++\\plugins\\jN\\includes\\Intell.js');

//trdm: 2017-12-24 20:51:04
function switchIntellDebugMode(){
	gIntellDebug = !gIntellDebug;
	gSwitchDebugModeMenuItem.checked = gIntellDebug; // не пашет чекалка????
	var vText = "ВЫключить";
	var vTextStatus = "Выключить отладку Intell.js";
	if (!gIntellDebug) {vText = "Включить"; vTextStatus = "+Включить отладку Intell.js";}
	gSwitchDebugModeMenuItem.text =  vText + " отладку Intell.js\tCtrl+Shift+F9";
	status(vTextStatus);
}

function switchIntellMode(){
	gIntellEnabled = !gIntellEnabled;
	gIntellModeMenuItem.checked = gIntellEnabled;	
}
function switchStringMode(){
	gOtherVarAsString = 1 - gOtherVarAsString;
	gIntellswitchStringModeMenuItem.checked = gOtherVarAsString == 1;	
	
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
		gIntellCtagsScanMode = parseInt(gSettingsIni["IntellCtagsScanMode"]);
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

function normaliseCW_needBreak(psAra, psNeedBr) {
	var rv = false;
	if(psAra.length == 0) {
		rv = true;
    } else {
		var el = psAra.shift();
		if(el != psNeedBr) {
			rv = true;
		}		
	}
	return rv;
}
//"if(this.lineMap"  - не хорошо, надо подсчитать непарные скобки и убрать их
// "if(this.lineMap" >> 'this.lineMap'
function normaliseCuretnWord(psCW) {
	//debugger;
	var arrBr = new Array;
	var rv = '';
	var nBreak = false;
	for(var i = psCW.length; i>0; i--) {
		var ch = psCW[i-1];
		switch(ch) {
          case ')':  arrBr.unshift(ch);     break;
          case '(': if(normaliseCW_needBreak(arrBr,')')) { nBreak = true;  break; }	break;
          case '{': if(normaliseCW_needBreak(arrBr,'}')) { nBreak = true;  break; }	break;
		  case '}':  arrBr.unshift(ch);     break;
          case '[': if(normaliseCW_needBreak(arrBr,']')) { nBreak = true;  break; }	break;
		  case ']':  arrBr.unshift(ch);     break;
		default:    
        }
		if(nBreak) {	break;    }
		rv = ch + rv;
    }
	return rv;
}

//normaliseCuretnWord("if(this.lineMap");


var IntellPlus = {
	  curChar : ""
	, enabled: '' 		// активна технология
	, startLineNo: '' 	// стартовая строка, номер.
	, currentLine: '' 	// текущая строка
	, curPathFile: '' 	// текущий файл полный путь
	, curFileName: '' 	// текущий файл имя
	, curDirPath: '' 	// текущая директорий
	, currentLineNo: '' // номер текущей проверенной строки, нужен, что-бы исключить повторное сканирование и зацикливание
	, currentWord: '' 	// текущая распознаваемое выражение
	, curWordIsActiveX: false 	// текущая распознаваемое выражение
	, curWordType: '' 	// текущая распознаваемое выражение
	, currentLineCl: ''	// Чистая, для разбора
	, curExtension: '' 	// текущее расширение файла
	, wordIsTemplate: '' 	// текущее расширение файла
	, template: '' 	// текущее расширение файла
	, curLang: '' 		// язык для поиска. Понадобится когда будем работать во фрагментах html | php
	, includedFileList: '' // список файлов включенных в html для разбора 
	// \todo - а если там ссылка на веб, типа https://www.google.com/js/jquery-1.9.1.min.js что делать то???
	, clear : function(){
		this.curWordIsActiveX = false;
		this.currentLineNo = '';
		this.wordIsTemplate = false;
		this.template = '';		
		this.curChar = '';
		this.currentWord = '';		
	}
	, isActiveX : function() {
    	return this.curWordIsActiveX;
    }
	, getCurExtension : function(){
		//todo. придумать как. Функция работает для целосных файлов. А для сегментных, HTML, PHP - не работает.
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
			var araFD = curPathFile.split('\\');
			this.curFileName = araFD[araFD.length-1];
			araFD[araFD.length-1] = '';
			this.curDirPath = araFD.join('\\');
		}
		this.includedFileList = new Array;
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
	, init : function(){
		this.clear();
		this.getCurExtension();
	}
	, isWordTemplate : function (psWord) {
		var vTText = isTemplate(psWord);
		if(!vTText) return '';
		this.template = vTText;
		this.wordIsTemplate = (vTText) ? true : false;
		this.currentWord = psWord;
		return psWord;		
    }
	, getCurWordSimple : function () {
		this.init();
    	var rv = getWordUnderCursor(Editor.currentView); // funclist.js
		this.currentWord = rv;
    	return rv;
    }
	, getCurWord : function(){		// 	  document.| где: | - позиция курсора, 
		this.init();
		
		/* Бага сработало в строке: "    vFName = gIntelDir+'\\js.|';"		| - позиция сработки...		*/
		// todo: надо отключить в комментариях. Опционально конечно.		
		var retVal = "";
		view  = Editor.currentView;
		
		this.startLineNo = view.line;
		var line = currentView.lines.get(view.line).text;
		var columnChar = line.charAt(Editor.currentView.column-2); // 2 - это конец строки и сам символ.
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
		this.curChar  = /*columnChar; */ line.charAt(wordBegPos);
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
			if(this.curChar == " ") {
				--wordBegPos;
            } else if(this.curChar == "	"/*'\t'*/) {
				// лшучше прочитать настройки.
            	for(var it = 0; it<= 4; it++) {		--wordBegPos;	}
            }  
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
		// retVal = "if(this.lineMap" - не хорошо, надо подсчитать непарные скобки и убрать их
		retVal = normaliseCuretnWord(retVal);
		if (checkTemplate){
			retVal = this.isWordTemplate(retVal);
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
	var re; //= /(\/\/.*)/igm;
	var re2 = ''; //= /(\/\/.*)/igm;
	if(IntellPlus.curLang == 'vbs') {
		re = /(\'.*)/igm;    
    } else {
		var cLang = IntellPlus.curLang;
		switch(cLang) {
          case 'php':
          case 'php3':
          case 'phtml':
			re2 = /(#.*)/igm;
          case 'c':
          case 'cpp':
          case 'js':
			re = /(\/\/.*)/igm;
            break;
          default:    
        }
    }
	if(re) {
		var reRe = re.exec(retVal);
		while (reRe != null) {
			var fRes = reRe[0];
			retVal = retVal.replace(fRes,'');
			re = /(\/\/.*)/igm; // нужно переинициализировать почему? флаг?
			if(IntellPlus.curLang == 'vbs') {
				re = /(\'.*)/igm;    
			}
			reRe = re.exec(retVal);
		}
    }
	
	if(re2) {
		var reRe = re2.exec(retVal);
		while (reRe != null) {
			var fRes = reRe[0];
			retVal = retVal.replace(fRes,'');
			reRe = re2.exec(retVal);
		}
    }
	return retVal;
}

//trdm: 2017-12-23 20:30:15
function remoteOther(psAllText) {
	retVal = psAllText;
	retVal = retVal.replace(/\t/img," ");
	return retVal;
}

function remoteAllComments( psText, psLang ) {
	psText = remoteCommentMLine(psText);
	psText = remoteCommentSLine_js(psText);
	return psText;
}

function extractJSFromHtmlTextGetSrc(psScrTagProps, psReScript3) {
	var rv = '';
	var reRe = psReScript3.exec(psScrTagProps);
	while(reRe) {
		var tagName = reRe[1]; tagName = tagName.toLowerCase();
		var tagSrc = reRe[2];
		reRe = psReScript3.exec(psScrTagProps);
		if(tagName == 'src') {
			tagSrc = Replace(tagSrc,'/','\\');
			if(tagSrc[0] == '\\') {
				tagSrc = tagSrc.substring(1,tagSrc.length);
            }
			rv = tagSrc;
			return rv;
        }
    	// break; continue;
    }
	return rv;	
}

function strDub(psStr, psCnt) {
	var rv = '';
	for(var i = 1; i<= psCnt; i++) {
		rv += psStr;
    }	
	return rv;
}

function strCount(psSrcStr, psFindStr) {
	// debugger;
	var rv = 0;
	var lastIndex = psSrcStr.indexOf(psFindStr);
	while(lastIndex != -1) {
		++rv;
		lastIndex = psSrcStr.indexOf(psFindStr,lastIndex+1);
    }
	//alert(''+psFindStr+' cnt =  ' + rv);
	return rv;
} // strCount('onclick="ajax();return false false"',' ');

function extractJSFromHtmlText( psText ) {
	//debugger;
	var rv = '', textFragment = '';
	var reScript1 = /<script\s+([^>]*)>/ig; 			// <script type="text/javascript" src="dtree.js">
	var reScript2 = /<\/script>/ig; 					// </script>
	var reScript3 = /\s+([a-zA-Z-]+)\s*\=\s*"([^"]+)"/ig;// type="text/javascript" AND src="dtree.js"
	var reScript4 = /\s+(on[a-z]+\s*\=\s*"[^"]+")/ig; 	// onclick="ajax();return false"
	var reRe1 = reScript1.exec(psText);
	var vPathF = IntellPlus.curDirPath;
	var li1 = 0, li2 = 0, li3 = 0;
	var indexFirst = 0;
	var otherText = '';
	var lines = 0;
	var reRe2 = '';
	while(reRe1) {
		var tag = reRe1[1]; // какой скрипт? внешний или 
		EditorMessageDT(tag);
		var src = extractJSFromHtmlTextGetSrc(tag, reScript3);
		if(src) {
			vPathF = IntellPlus.curDirPath+src;
			IntellPlus.includedFileList.push(vPathF);
        } else {
			otherText = psText.substring(indexFirst, reRe1.index);
			lines = strCount(otherText,'\n');
			otherText = strDub('\n',lines);
			
			reScript2.lastIndex = reScript1.lastIndex;
			reRe2 = reScript2.exec(psText);
			if(reRe2) {
				indexFirst = reRe2.lastIndex;
				li1 = reScript1.lastIndex;
				li2 = reScript2.lastIndex;
				li3 = reRe2[0].length;
				textFragment = psText.substring(li1, (li2 - li3));
				textFragment = trimSimple(textFragment);
				rv += otherText+textFragment;
				rv += '\n'
            }
			
		}
		//rv += tag+'\n';		
    	reRe1 = reScript1.exec(psText);
    }	
	//alert(rv);
	return rv;
}

//var ttext = loadFromFile('D:\\Program Files\\Notepad++\\plugins\\jN\\_tests\\dtree_.html');
//ttext = extractJSFromHtmlText( ttext );

// PrepareModuleText(Line, Col) 
function PrepareModuleText(Line, Col, psText) {
	// возможно лучше взять часть текста, включая текущую строку.
	var retVal = ""; 
	var view  = Editor.currentView;	
	if(psText) { retVal = psText;    
    } else { 	 retVal = view.text;	}
	
	if(IntellPlus.curLang == 'html') {
		retVal = extractJSFromHtmlText(retVal);
    }
	
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
	retVal = remoteAllComments(retVal);
	retVal = remoteOther(retVal);		
	return retVal;
}

function getBuiltInTypes_addTypes(psDict, psString) {
	var ara = psString.split(',');
	for(var i = 0; i<ara.length; i++) {
		var sa = ara[i];
		psDict.Add(sa,sa);
	}
}
function getBuiltInTypes(psCurLang, psCase) {
	var retVal = new ActiveXObject("Scripting.Dictionary");
	if(psCase == undefined) psCase = true; // все
	var strToDict = '';
	if(psCurLang == "js") {
		strToDict = 'Array,Boolean,Date,Error,EvalError,Function,Math,Number,Object,RangeError,ReferenceError,RegExp,String,SyntaxError,TypeError,URIError,window,document';
		getBuiltInTypes_addTypes(retVal, strToDict);
		//jN{ ну и раз програмим с помошью плагина jN, то и его типы встроить надо, хотя тут надо опционально разделять.
		if(psCase) {
			strToDict = 'MenuItem,Menu,CtxMenu,Dialog,Library,CallBack,System,ViewLine,ViewLines,View,Editor';
			getBuiltInTypes_addTypes(retVal, strToDict); 		
		} //jN		
	}
	return retVal;	
}

function fillLValDict(psText, psDict, psCase) {
	var tBadMessage = "";
	vText = psText; //loadFromFile(psFileName);
	if(!vText) return;
	var vDictNu = new ActiveXObject("Scripting.Dictionary");
	var arr = vText.split('\n');	
	var tLine = "";	// debugger;
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
				psDict.Add(tPos[1],tPos[0]); 				
			}
			if(psCase == 2) { 
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
		var unu1 = new Enumerator(vDictNu);
		unu1.moveFirst();
		while(!unu1.atEnd()) {
			k = unu1.item(); // key?
			psDict.Remove(k);
			unu1.moveNext();
        }		
	}
	if (tBadMessage != "") {
		status(tBadMessage);
		alert(tBadMessage);
	}	
} //fillLValDict

// Разбираем js.lval и Разбираем js.lvalu
function initLValDictions() {
	if (!gJsLvalDict) {
		var vFName = gIntelDir+'\\js.lval'; 
		var vFName2 = gIntelDir+'\\_common.lval'; 
		//debugger;
		var vText = loadFromFile(vFName);
		var vText2 = loadFromFile(vFName2);
		vText = vText + '\n'+vText2
		gJsLvalDict = new ActiveXObject("Scripting.Dictionary");
		gJsLvalDictUni = new ActiveXObject("Scripting.Dictionary");
		
		fillLValDict(vText, gJsLvalDict,1);
		fillLValDict(vText, gJsLvalDictUni,2);
	}
}


function getTypeFromLval(psOneType, psMeth) {
	var retVal = "";
	if(!gJsLvalDict){
		initLValDictions();
	}
	var vMeth = psMeth;
	if (!vMeth) {	// todo, плохо, не должно так быть
		return;
	}
	vMeth = vMeth.replace('(',''); 	vMeth = vMeth.replace(')','');
	var tText = psOneType+"."+vMeth;
	tText = tText.toLowerCase();
	
	if(gJsLvalDict.Exists(tText)){
		retVal = gJsLvalDict.Item(tText);
	}
	if(!retVal) {
		retVal = getInterfaceFromProgID(psOneType);    
		if (retVal) {
            retVal = getInterfaceFromProgID(retVal+'.'+psMeth);
		}
    }
	return retVal;
}
// вернем из _common.lval ведещий интерфейс, который туда пишется intelOle.js
function getInterfaceFromProgID( psProgId) {
	var retVal = '';
	vProgId = ''+psProgId;
	vProgId = vProgId.toLowerCase();
	if(gJsLvalDict.Exists(vProgId)){
		retVal = gJsLvalDict.Item(vProgId);
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
	var rv = false;
	if(IntellOle) {
		/* 	todo Вот тут лажа, т.к. контекст тут общий для скриптов, находящихся в каталоге '\Notepad++\plugins\jN\includes'
		а я этого не учитываю при формировании с использованием ctags	*/
		if(IntellOle.isProgID(IntellPlus.curWordType)) {
			rv = IntellOle.MakeData(IntellPlus.curWordType);
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
	curLang = IntellPlus.curLang;
	bi_types = getBuiltInTypes(curLang);
	if (bi_types.Exists(psCurWord)){
		return psCurWord;
	}
	if (psCurWord.indexOf('.') != -1) {
	    retVal = getTypeFromLongDot(psCurWord,allText);
	    if (retVal/* != ""*/) {
	        return retVal;
	    }
	}
	if (psCurWord == 'this') {
	    //retVal = getMethodsForThis()
	}
	retVal = getTypeFromLvalUni(psCurWord,0); // зарезервированное слово/метод.
	if(retVal) return retVal;
	
	paternNew = psCurWord+"\\s*\\=\\s*new\\s*([a-zA-Z_]+[0-9]?)"; //re = new RegExp(paternNew, 'img');
	paternActive = psCurWord+'\\s*\\=\\s*new\\s*ActiveXObject\\(\\"([a-zA-Z_0-9\\.]+\\")\\)';  		//retVal = new ActiveXObject("Scripting.Dictionary");
	if(curLang == 'vbs') {
		paternActive = psCurWord+'\\s*\\=\\s*CreateObject\\s*\\(\\"([a-zA-Z_0-9\\.]+\\")\\)';  		//retVal = CreateObject("Scripting.Dictionary")
    }
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
		if(curLang == 'vbs') {
			reNew = 0;
		}
	} catch(e) {
		vBadString = 'Ошибка при распознавании: '+ psCurWord+' строка: '+IntellPlus.currentLineNo;
		status(vBadString);
	}
	
	allText = allText.replace(';','\n'); // аукнется конечно, но ничего переивем
	allText = allText.replace('\n\n','\n'); // аукнется конечно, но ничего переивем
	var vTextLines = allText.split('\n');
	var vTLLen = vTextLines.length-1; // Надо сканировать не с начала текста, а запоминать позицию. И почему я начинаю с верхней строки, вдруг кто-то пишет код слитно???
	if(gIntellDebug) {	debugger;	}	
	if(IntellPlus.currentLineNo == ''){
		IntellPlus.currentLineNo = vTLLen;
	} else { vTLLen = IntellPlus.currentLineNo - 1;}
	for (var iL = vTLLen; iL>=0; iL-- ) {
		if(gIntelShowParseLine) { status('Parse: '+iL+' line ');	 }
		

		IntellPlus.currentLineNo = iL;
		var tLine = vTextLines[iL];	//	alert(tLine);
		tLine = trimSimple(tLine);
		if (tLine == '') continue;
		if (!/[\w\dА-я$_]/.test(tLine)) continue;
	
		var reResu = '';
		if(reNew) {
			reResu = reNew.exec(tLine);		//	var reResu = reNew.exec(tLine);
			if (reResu != null) {
				retVal = reResu[1]; // нужна последняя
				//break; // не нужно, вдруг поймаем "ActiveXObject"
			}
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
					vType = getTypeFromLongDot(retVal, allText);
					retVal = vType;
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
			var isp = checkActiveXDictionary();
			if(isp) {
				gJsLvalDict = 0;
				initLValDictions();				
            }
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
			if(!retVal) {	
				var vIFace = getInterfaceFromProgID(psTypeCWD);
				if(vIFace) {
					fileName = gIntelDir + vIFace+".ints";	// js_array.ints
					retVal = loadFromFile(fileName);
                }            
            }
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

function selectFromString(psStrList, psCaption) {
	var arr = new Array;	
	strList = psStrList;
	if(gSortMetodsBefore) {
		arr = strList.split('\n');
		arr.sort();
		strList = arr.join('\n');
    }
    try   {        
		var sel = new ActiveXObject('Svcsvc.Service');    
	}  catch(e)    {
        alert("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll");
        return false;
    }	
	try { 		// 256 - сортировка списка
		rv = sel.FilterValue(strList, 1 /*| 4 */| 32 | 256, psCaption, 0, 0, 0, 0);    
    } catch(e) {
		rv = sel.FilterValue(strList, 1 /*| 4 */| 32, psCaption, 0, 0, 0, 0);    
    }
	
	return rv;
}



//trdm: 2017-12-24 19:39:46
function selectFromList(psStrList, psCurWord) {
	var rv = "";
	var vCurWord = psCurWord; 
	vCurWord = vCurWord + ".";
	var spPross = false;
	if(IntellPlus.curLang == "js") {
		spPross = true;
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
		tPos = tLine.indexOf(".");
		if(spPross) {
			if(vCurWord){			// строки, разделенные запятой, если там есть выражения psCurWord.[a-z], то брать только их и отсекать psCurWord.
				tPos = tLine.indexOf(vCurWord);
				if(tPos != -1) {
					tLine = tLine.substring(vCurWord.length+1);
				} else { continue;
				}
			} else {		    
				if (tPos != -1) continue; // Методы/свойства, которые используются только с предопределенными литералами, типа "Number.MAX_VALUE" надо отсекать, если объект не встроенный тип.
			}
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
	return rv;
}

function arrayPushUniStr(psAra, psStr) {
	var has = false;
	var added = false;
	for(var i = 0; i<psAra.length; i++) {
		if(psAra[i] == psStr) {
			has = true;
			break;			
        }
    }
	if(!has) {
		psAra.push(psStr);
		added = true;		
    }
	return added;
}

/* строим список объектов для перехода к ним. Аналог funclist.js->listFunctions */
//trdm: 2018-02-24 17:19:52  
function goToDefinitionsByCtagsGlobal(psCurScr, psFileName) {
	var rerVal = false;
	if(gIntellDebug) { debugger; }
	
	writeToIntellLog('goToDefinitionsByCtagsGlobal: '+ psCurScr);
	
	var curWord = IntellPlus.getCurWord(); // просто для инициализации.
	var found = false;
	var rv = '';
	status('selectGoToDefinitionIntell - search: '+psCurScr);
	var vOnlyCurScr = (psCurScr) ? true : false;
	checkUpdateScopeMapCtags();
	if(gCtagsMapLast) {
		rv = gCtagsMapLast.getAllMembers(psFileName);
    }
	if(rv) {
		var addCaption = (psFileName) ? ' '+IntellPlus.curFileName : '';
		if(!vOnlyCurScr) {
			var objStr = selectFromString(rv, 'Переход к объекту'+addCaption);
        } else {
			objStr = psCurScr;
		}
		if(objStr) {
			vPosF = gCtagsMapLast.findPosByObjectString(objStr);
			if(!vPosF) {
				rv = gCtagsMapLast.findAllMembersByObject(objStr);
				if(rv) {					
					if(strCount(rv,'\n') > 1) {
						objStr = selectFromString(rv, 'Возможные переходы к: '+psCurScr);
                    } else {
						objStr = trimSimple(rv);
					}					
					if(objStr) {
						vPosF = gCtagsMapLast.findPosByObjectString(objStr);
                    }
                }
			}				
			if(vPosF) {
				found = true;
				var ara = vPosF.split('#');
				status(vPosF);
				if(ara.length != 2) {
					return rv;
                }
				var filePath = ara[0];
				var fileLine = parseInt(ara[1]);
				addToHistory(); //funclist.js
				open(filePath); //IEditor
				goToLine(fileLine, false); //funclist.js				
				rerVal = true;
            }
        }
    }
	if(vOnlyCurScr) {
		if(!found) {
			status(psCurScr + ' - не найдено!');        
        }
    }
	return rerVal;
}
var listScriptsObjectsItem = {
    text: "Список объектов\tCtrl+2", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x32,
    cmd: goToDefinitionsByCtagsGlobal
};
addHotKey(listScriptsObjectsItem);
scriptsMenu.addItem(listScriptsObjectsItem);

function selectGoToDefinitionCurFile() {
	IntellPlus.init();
	return goToDefinitionsByCtagsGlobal('', IntellPlus.curPathFile);
}

var selectGoToDefinitionCurFileItem = {
    text: "Список объектов тек.файла\tCtrl+3", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x33,
    cmd: selectGoToDefinitionCurFile
};
addHotKey(selectGoToDefinitionCurFileItem);	
scriptsMenu.addItem(selectGoToDefinitionCurFileItem);

var gFileDictionary = 0;

// ищем вверх/вглубь на 1 уровень по короткому имени файла
function findFileByPathSpec(psSFileName, psPath) {
	var rv = '';
	if(gFileDictionary) {
		if(gFileDictionary.Exists(psSFileName)) {
			rv = gFileDictionary.Item(psSFileName);
			return rv;
		}
    }
	var vFPath = psPath;
	if(vFPath[vFPath.length-1] == '\\') {
		vFPath = vFPath.substr(0,vFPath.length-1);
    }
	var vFPathA = vFPath.split('\\');
	vFPathA[vFPathA.length-1] = '';
	var vFPath = vFPathA.join('\\');
	var vFoldarsAra = new Array;
	arrayPushUniStr(vFoldarsAra, vFPath);
	
	gFileDictionary = new ActiveXObject("Scripting.Dictionary");
	var vFolderObj = gFso.GetFolder(psPath);
	if(IntellPlus.curLang == 'c' || IntellPlus.curLang == 'cpp') {
		vFolderObj = gFso.GetFolder(vFPath);
    }
	var fc = new Enumerator(vFolderObj.SubFolders);
	for (fc.moveFirst(); !fc.atEnd(); fc.moveNext()) {
		vFileO = fc.item();
		arrayPushUniStr(vFoldarsAra, vFileO.Path);
	}
	
	for(var i = 0; i< vFoldarsAra.length; i++) {
		vFPath = vFoldarsAra[i];
		status('Find files by: '+vFPath);
		vFolderObj = gFso.GetFolder(vFPath);
		fc = new Enumerator(vFolderObj.Files);
		for (fc.moveFirst(); !fc.atEnd(); fc.moveNext()) {
			vFileO = fc.item();
			try { 
				gFileDictionary.Add(vFileO.Name,vFileO.Path);
            } catch(e) {
            }
		}
    }
	if(gFileDictionary.Exists(psSFileName)) {
		rv = gFileDictionary.Item(psSFileName);    
    }
	return rv;
}

/*
var listScriptsObjectsItem = {
    text: "Список объектов скрипта\tCtrl+2", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x32,
    cmd: goToDefinitionsByCtagsGlobal
};
addHotKey(listScriptsObjectsItem);
scriptsMenu.addItem(listScriptsObjectsItem);
*/
//trdm: 2018-03-04 21:52:36
function getIncludedFileNamesFromText( psText, psFileNmArray, psLavel) {
	if(!psText) 		{ psText = PrepareModuleText();        }
	if(!psFileNmArray)  { psFileNmArray = new Array;    }
	if(!psLavel) 		{ psLavel = 1;     }
	var vFilesCatche = new Array;
	var cLang = IntellPlus.curLang;
	var vFolder = IntellPlus.curDirPath;
	var vFileName = '';
	var cLang = cLang.toLowerCase();
	switch(cLang) {
	case 'c':
	case 'cpp':
	{
		//debugger;
		status('Searche include: ...');
		var allText = psText;
		var regExpr = /#include\s+([<>\\"a-zA-Z.]+)/g;		
		var re = regExpr.exec(allText);
		var isLocal = false;
		while(re) {				  
			var isLocal = false;
			var rere = re[1];
			if(rere) {				
				rereD = rere;
				if(rere.indexOf('"') != -1) {
					isLocal = true;
					rere = Replace(rere, '"', '');
				} else if(rere.indexOf('<') != -1) {
					rere = Replace(rere, '<', '');
					rere = Replace(rere, '>', '');
                }
				wt = 0;
				vFileName = vFolder+rere;
				if(gFso.FileExists(vFileName)) {
					arrayPushUniStr(vFilesCatche, vFileName); // Ну мало ли...
					wt = 1;
				} else {
					vFileName = findFileByPathSpec(rere, vFolder);
					if(gFso.FileExists(vFileName)) {
						arrayPushUniStr(vFilesCatche, vFileName); 
						wt = 1;
					}
				}
				if(gIntellDebug) {
					if(!vFileName) {
						EditorMessage(''+wt+' '+rere +'<='+rereD+' = '+vFileName);
                    }
				}
            }
			
			re = regExpr.exec(allText);
		} // while(re)
	}		
	break;
	case 'php': {
		var allText = psText;
		var regExpr = /((require_once|require|include|include_once)\s*[^;]+\;)/g;
		var re = regExpr.exec(allText);
		var wt = 0;
		while(re) {				  
			var rere = re[0];
			if(rere.length > 100) {
				re = regExpr.exec(allText);
				continue;
				}
			rereD = rere;	//	  EditorMessage('1-'+rere);
			// require_once( 'core.php' );
			var t1 = /((require_once|require|include|include_once)\(\s*['"_a-zA-Z.]*\s*\)\s*;)/g.test(rere); 
			if(t1) {
				t1 = /\(\s*(['"_a-zA-Z\.]+)\s*\)/g.exec(rere);
				if(t1) { rere = t1[0]; } else {rere = '';}
			
			} else {
				// require_once 'core.php' ;
				t1 = /((require_once|require|include|include_once)\s*['"_a-zA-Z.]*\s*\s*;)/g.test(rere);
				if(t1) {
					t1 = /\s+['"]+([_a-zA-Z\.]*)["']+\s*/g.exec(rere);
					if(t1) { rere = t1[0]; } else {rere = '';}
				} else {
					// затейники. итерпретировать или подбирать?
					//"require_once( dirname( __FILE__ ).DIRECTORY_SEPARATOR.'custom_constant_inc.php' );"
					rere = '';
				}
			}
			if(rere) {
				rere = Replace(rere,'\t','');	  rere = Replace(rere,' ','');	  
				rere = Replace(rere,'(','');	  rere = Replace(rere,')','');	  
				rere = Replace(rere,'\'','');	  rere = Replace(rere,'"','');
			}
			if(rere.length == 0) {
				re = regExpr.exec(allText);
				continue;
			}
			// По идее осталось только имя файла
			// rere	"core.php"	String
			vFileName = vFolder+rere;
			if(gFso.FileExists(vFileName)) {
				arrayPushUniStr(vFilesCatche, vFileName); // Ну мало ли...
				wt = 1;
				} else {
				vFileName = findFileByPathSpec(rere, vFolder);
				if(gFso.FileExists(vFileName)) {
					arrayPushUniStr(vFilesCatche, vFileName); 
					wt = 1;
				}
			}
			if(gIntellDebug) {            
				EditorMessage(''+wt+' '+rere +'<='+rereD);
            }

			re = regExpr.exec(allText);
		}			  
	}
		break;
	default:    
	}
	
	for(var i = 0; i<= vFilesCatche.length; i++) {
		vFileName = vFilesCatche[i];
		if(gFso.FileExists(vFileName)) {
			var added = arrayPushUniStr(psFileNmArray, vFileName); // Ну мало ли...
			if(added) {
				// нет смысла обрабатывать каждый раз.
				var vText = loadFromFile(vFileName);
				vText = remoteAllComments(vText,cLang);
				getIncludedFileNamesFromText( vText, psFileNmArray, 1+psLavel);
            }			
        }
    }
}


function getThisScopeFiles(psFName){
	var rv = new Array;
	var vFName = psFName;
	rv.push(vFName);
	var vFile = gFso.GetFile(psFName);
	var vFolder = vFile.ParentFolder.Path; 
	vFolder += '\\';
	//if(vFName.indexOf(gNjPluginDir) != -1) {
	if(vFolder == gNjPluginIncDir) {
		//\todo любопытная с точки зрения подсказки по методам ситуация, можно вычленить тип коллекции.
		vFolderO = gFso.GetFolder(gNjPluginIncDir);
		var fc = new Enumerator(vFolderO.Files);
		for (fc.moveFirst(); !fc.atEnd(); fc.moveNext()) {
			vFileO = fc.item();
			arrayPushUniStr(rv, vFileO.Path);
		}
    } else if(IntellPlus.curExtension == 'html') {
		rv = IntellPlus.includedFileList;
    } else {
		delete gFileDictionary;
		var cLang = IntellPlus.curLang;
		cLang = cLang.toLowerCase();
		var vText = '';
		//rv.push(IntellPlus.curPathFile);
		//debugger;
		getIncludedFileNamesFromText(vText,rv,1);
	}
	rv.sort();
	return rv;
}

function ctagsjNProjectFile_find(psCurFilePath) {
	var rv = '';
	// debugger;
	if(gFso.FileExists(psCurFilePath)) {
		var vFile = gFso.GetFile(psCurFilePath);
		var vFolder = vFile.ParentFolder;
		var vFPath = vFolder.Path +'\\'+ gjN_ctags_ini;
		for(var i = 1; i<= strCount(vFPath,'\\'); i++) {
			if(gFso.FileExists(vFPath)) {
				rv = vFPath;
				break;
            }
			vFolder = vFolder.ParentFolder;
			vFPath = vFolder.Path +'\\'+ gjN_ctags_ini;			
        }		
    }
	return rv;
}

function checkUpdateScopeMapCtags() {
	if(gIntellDebug) { debugger; }  
	var needSm = false;
	
	if(0) { gCtagsMapLast = new ScopeMap('');       }
	if(!gCtagsMapLast) { needSm = true;	}
	if(gCtagsMapLast) { needSm = gCtagsMapLast.needUpdate(IntellPlus.curPathFile); }
	if(needSm) { 
		var vArrFilePath = '';
		if(IntellPlus.curLang == 'c' || IntellPlus.curLang == 'cpp'|| IntellPlus.curLang == 'php') {
			var vFile = gFso.GetFile(IntellPlus.curPathFile);
			var vFolder = vFile.ParentFolder.Path;
			if(strCount(vFolder,'\\') > 2) {
				// дохрена в некоторых случаях, лучше парет фолдер1 2018-03-30 20:26:37 
				//vFolder = vFile.ParentFolder.ParentFolder.Path;
            }
			var vjN_ctags_iniFPath = ctagsjNProjectFile_find(IntellPlus.curPathFile);
			vArrFilePath = vFolder;
			if(vjN_ctags_iniFPath) {
				vFile = gFso.GetFile(vjN_ctags_iniFPath);
				vArrFilePath = ''+vFile.ParentFolder.Path;
            }
			
        } else {
			vArrFilePath = getThisScopeFiles(IntellPlus.curPathFile);
		}
		gCtagsMapLast = makeScriptMapParseCtagsResult(vArrFilePath); /*makeScriptMapParseCtagsResult(vFName);*/  
	}
	return needSm;
}

function getMembersFromCtags() {
	var rv = '';
	// возможно имеем лело с переменной, объявленной как var curWord = {} или с классом, возвращаемыйм функцией.			
	if(gIntellDebug) { debugger; }
	var vFName = IntellPlus.curPathFile;
	var vArrFilePath = getThisScopeFiles(vFName);
	checkUpdateScopeMapCtags();
	if(gCtagsMapLast) {
		//vPos = gCtagsMapLast.getLastClassPosLine(IntellPlus.|); \\todo на непарную скобку реакция плохая
		if(IntellPlus.currentWord == 'this') {
			vPos = gCtagsMapLast.getLastClassPosLine(IntellPlus.startLineNo, IntellPlus.curPathFile);
			if(vPos>0) {
				rv = getMethodsForThis(vPos, IntellPlus.startLineNo);
            }
		} else {
			rv = gCtagsMapLast.getMembersByClass(IntellPlus.typeCWD);
			if(!rv) {
            	rv = gCtagsMapLast.getMembersByClass(IntellPlus.currentWord);
            }
		}
	}
	if(!rv) {
		gCtagsMapLast = makeScriptMapParseCtagsResult(vFName);
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
	writeToIntellLog('getWordList fore: '+ curWord);
	var cLang = IntellPlus.curLang;
	if (cLang != "js") {
		if (IntellPlus.wordIsTemplate) {
			return insertTemplate();
		}
		if(!(cLang == "vbs" || cLang == 'html')) {
			//trdm: 2018-03-08 16:47:22
			// Попробуем релизовать автодополнение в html
			return; 
        }
	}	
	if (curcorInComment()) return;
	if (curcorInSring()) { 
		if(cLang == 'html') {   
			// Попробуем автодополнение в строках типа: <a href="javascript: d.openAll(); d.">
		}   else {
			return;
		}
	}
	
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
	} else if (curWord == 'this'){
	    Methods = getMembersFromCtags();
	} else if (!Methods){
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

//trdm: 2018-01-25 12:51:59
function gotoObject() { //\todo Функция для перехода к объекту, построить на словаре из ctags  
	checkUpdateScopeMapCtags();
	if(0) { gCtagsMapLast = new ScopeMap('');       }
	var rv = '';
	var rv = gCtagsMapLast.getMembersByClass()
	return rv;
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

function insertTab() {
	Editor.currentView.selection = '\t';
}

function tryInsertTemplateImpl() {
	var rv = false;
	var curWord = IntellPlus.getCurWordSimple(); 
	if (!curWord) { return rv; }
	curWord = IntellPlus.isWordTemplate(curWord);
	writeToIntellLog('tryInsertTemplateImpl fore: '+ curWord);
	var cLang = IntellPlus.curLang;
	if (cLang != "js") {
		if (IntellPlus.wordIsTemplate) {
			return insertTemplate();
		}
		if(!(cLang == "vbs" || cLang == 'html')) {
			//trdm: 2018-03-08 16:47:22
			// Попробуем релизовать автодополнение в html
			return rv; 
        }
	}	
	if (curcorInComment()) return;
	if (curcorInSring()) { 
		if(cLang == 'html') {   
			// Попробуем автодополнение в строках типа: <a href="javascript: d.openAll(); d.">
		}   else {
			return rv;
		}
	}
	
	if (IntellPlus.wordIsTemplate) {
		loadTemplates();
		return insertTemplate();
	}	
	return rv;
}

// Юзер нажал Tab, надо проверить текущее слово, если оно является шаблоном, подставить тело шаблона, если нет, то '\t'
function tryInsertTemplate() {
 	if(gIntellDebug) {debugger;}
	if(!tryInsertTemplateImpl()) {
    	insertTab();
    } 	
}

//trdm 

//debugger;
var mySwitchIntellDebugMode = {
    //text: "Вкл. отладку Intell\tctrl+F9", не воспринимает "Выключить" исключает из меню. Разобрался, в кодировке win-1251 не воспринимаются русские буквы меню. Пришлось в UTF-8
    text: "Включить отладку Intell\tCtrl+Shift+F9", 
    ctrl: true,
    shift: true, //false,
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

var myTabCatcher = {
    text: "Вставить шаблон\tTab", 
    ctrl: false,
    shift: false,
    alt: false,
    key: 0x09, // "Tab"    //cmd: getWordListTab
    cmd: tryInsertTemplate //   cmd: insertTab
}
addHotKey(myTabCatcher); scriptsMenu.addItem(myTabCatcher);


var mySwitchIntellMode = {
    text: "Intellisense (вкл/выкл)\tctrl+F8", //"Switch intell mode\tctrl+F8", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x77,
    cmd: switchIntellMode
};

addHotKey(mySwitchIntellMode); 
gIntellModeMenuItem = scriptsMenu.addItem(mySwitchIntellMode);
gIntellModeMenuItem.checked = gIntellEnabled;



var mySwitchReloadTempl = {
    text: "Перечитать шаблоны", // \tctrl+5",
	/*
    ctrl: true,
    shift: false,
    key: 0x35, // '5'
    alt: false,*/
    cmd: reLoadTemplates
}
addHotKey(mySwitchReloadTempl); 
gIntellReLoadTemplatesMenuItem = scriptsMenu.addItem(mySwitchReloadTempl);
// а мне норм, я уже на 1588 строке....  