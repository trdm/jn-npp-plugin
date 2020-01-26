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
	Версия: 0.1.99
	Версия внутр.: $Revision: 0.99 $
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
	- Реализация шаблона "gFilesAlready(++|--|**|/|)" при вводе.
	- [20181229020703] var sel = new ActiveXObject('Svcsvc.Service'); sel.|<<не подбирается
	- WScript. - нет распознавания	
	- [20190109103825] <table| => "<table>...</table>" > надо подавить реакцию для "<table" и оставить только table..
	*/
	
	
	/*

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
	
	- emmet
		https://docs.emmet.io/cheat-sheet/ - сокращения из эммета (emmet)
		https://github.com/emmetio/npp#readme
		
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
var gIntelCTagsUFPath2 = gNjPluginDir+"Intell\\u_ctagsU2.txt";
var gIntelSystemDir = gNjPluginDir+"system\\";

var gIntelCTagsUExeFPath = gIntelSystemDir+"ctagsU.exe";
var gIntelCTagsUExeFPathSpeshl = gIntelSystemDir+"ctags.exe"; // для 1s, vbs

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

var gProjectRootFileName = 'ProjectRoot.ctag'; // имя файла для определения корня проекта для разбора исходников
// стоит добавить команду в меню "Выбрать каталог проекта файла" и создавать там gProjectRootFileName
var gCtagsFileMaxSize = 2000000; // Максимальный размер файла gIntelCTagsUFPath, ибо на бОльших файлах N++ захлебывается
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

function writeToIntellLog(psStr, psIncCIFn) {
	//if(gIntellDebug) { debugger; }
	if(arguments.length == 1) {
		psIncCIFn = 1;
    }
	if(!gIntellLogger) {
		gIntellLogger = new CIntellLoger('_intell');    
    }
	var cFile = IntellPlus.curPathFile;
	var vSaveStr = psStr+'; ';
	if(vSaveStr.indexOf(cFile) == -1 && psIncCIFn) {
		// Иногда логируются операции с файлом и передается его полное имя, так что добавлять его еще раз не нужно.
		vSaveStr = psStr +" "+ cFile;    
    }	
	gIntellLogger.log(vSaveStr);
}


GlobalListener.addListener({
	CHARADDED:function(v, pos){		// Tab не счистается символом? Не срабатывает функция..
		if (gIntellEnabled){			//debugger;
			gCurentCharAdded = v;
			var curWord = getWordList();				 
		}		
	}
});

function clearLogString(psStr) {
	//debugger;
	var vStr = psStr;
	vStr = vStr.replace(';','');
	var ara = vStr.split(' ');
	if(ara.length >= 3 ) {
		if(ara[1] == ara[2]) {
			ara[2] = '';
        }
    }
	vStr = ara.join(' ');
	return vStr;
}
GlobalListener.addListener({
	FILESAVED:function(){		// Tab не счистается символом? Не срабатывает функция..
		var vString = 'FILESAVED: '+Editor.currentView.files[Editor.currentView.file]+" ";
		vString = clearLogString(vString);
		writeToIntellLog(vString,0);
	}
});

GlobalListener.addListener({
	FILEOPENED:function(){		// Tab не счистается символом? Не срабатывает функция..
		var vString = 'FILEOPENED: '+Editor.currentView.files[Editor.currentView.file]+" ";
		vString = clearLogString(vString);
		writeToIntellLog(vString,0);
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
	// debugger;
	var vTemplIdent = 'Template:';
	var vTemplIdentL = 'TemplateLine:';
	var templMap;
	// Дикшионари не поддерживает в валуе дикшионери? Ну и хрен с тобой. Будем вставлять в него же, но вот так: lang+'.'+temlpId
	vTextArr = vTextAll.split('TemplateEnd');
	for(i=0; i<vTextArr.length-1; i++){
		vTextAll = vTextArr[i];
		vTextAll = trimSimple(vTextAll);
		vPos = vTextAll.indexOf(vTemplIdent);
		if(vPos == -1) {
			vPos = vTextAll.indexOf(vTemplIdentL);
			if(vPos != -1) {
				vTextAll = vTextAll.substring(vPos+vTemplIdentL.length);
				var arr2 = vTextAll.split('\n');
				for(i2 = 1; i2<arr2.length; i2++){
					vTextLine = arr2[i2];
					var arr3 = vTextLine.split(":");
					vIdent = arr3[0]; //	"div"	String
					vIdent = vIdent.toLowerCase(); // trdm 2018-12-21 18:01:34 
					vTextAll = arr3[1]; //	"div"	String	" <div></div>"	String
					try {
						// gTemplatesFromLang.Add(lang+'.'+vIdent,vTextAll);
						gTemplatesFromLang.Add(vIdent,vTextAll);
					} catch(e) {
						message('Ошибка при вставке "'+vIdent+'"! ');
					}					
				}            
            }
			continue;		
		}
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
			message('Ошибка при вставке "'+vIdent+'"! ');
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
	var vTmplDir = gIntelDir + 'tmpl\\';
	gTemplatesFromLang = new ActiveXObject("Scripting.Dictionary");
	var lang = IntellPlus.curLang; // todo ctags!!!!	И еще ITypeLib, что-б её...................
	fName = vTmplDir + '_common.tmpl';
	if(gFso.FileExists(fName)) {
    	loadTemplatFromFile(fName);
    }
	var Today = new Date;
	var vCommentChar = IntellPlus.getComentChar();
	if(IntellPlus.curLang == 'vbs') {} // тут другой комментарий

	
	addToTemplatesFromLang('trdm',vCommentChar+" trdm "+formatData(Today, 'yyyy-MM-dd hh:mm:ss ')+'@ ');//+'@ ');
	addToTemplatesFromLang('трдм',vCommentChar+" trdm "+formatData(Today, 'yyyy-MM-dd hh:mm:ss ')+'@ ');//+'@ ');
	
	if (lang == '') return;
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
	// гд -> ul
	try { 
		vWord = reQuerty(vWord); // TemplaterF.js
		if(gTemplatesFromLang.Exists(vWord)) {
			retVal = gTemplatesFromLang.Item(vWord);
			return retVal;
		}
    } catch(e) {
    }
	return retVal;	
}
// trdm 2018-12-23 10:29:47 
function getCharCaretPos(psStartCol, psStartAnchor) {
	var vCharCaret = "@";
	var rv = psStartAnchor;
	var vView = currentView;
	// trdm 2018-12-23 10:45:25 
	var vLine = vView.lines.get(vView.line-1).text; // отсчет с нуля начинается? 
	vLine = vLine.replace('\t',"    ");
	var vColChar = "";
	var vCntr = 0;
	for(var i = psStartCol; i<= vLine.length; i++) {
		var vColChar = vLine.charAt(i); // 2 - это конец строки и сам символ.
		vCntr++;
		if(vColChar == vCharCaret) {
			rv = rv + vCntr;
			break;
        }
    }
	return rv;
}

function insertTemplate() {
	if(IntellPlus.debugMode()) {
		debugger; // <<<< Вызов встроенного в ОС дебугера.
    }
	if(!gUsingTemplates) return false;
	var rv = true;
	var vTemplate = IntellPlus.template;
	var tPos = currentView.pos;
	var re = /^([\s])+/; // отступ
	reRe = re.exec(IntellPlus.currentLineCl);
	var vIndent = '';
	if(reRe) {
		vIndent = reRe[0];
	}
	var vTemplArr = vTemplate.split('\n');
	for(var i = 1; i< vTemplArr.length; i++) {	
		vTemplArr[i] = vIndent + vTemplArr[i];
	} 
	vTemplate = vTemplArr.join('\n');
	currentView.pos = tPos;
	currentView.anchor = tPos-(1+IntellPlus.currentWord.length);
	var vStartCol = currentView.column - IntellPlus.currentWord.length;
	var vStartAnchor = currentView.anchor;
	var vPos3 = vTemplate.indexOf("@");
	vTemplate = vTemplate.replace('@','');
	var vPos4 = tPos;
	if(vPos3 != -1) {
		vPos4 = tPos + vPos3-(1+IntellPlus.currentWord.length);
    }
	Editor.currentView.selection = vTemplate;
	currentView.pos = vPos4;
	currentView.anchor = vPos4;
	return rv;
} 

/* 
\todo.... 2018-3-07_19-25
	может не страдать херней, а для проектов на си и си++ использовать рекурсивные запуски типа:
	ctags.exe -R -f u_ctagsU.txt --language=c --excmd=number
	???? гораздо быстрее получается и гораздо точнее, что немаловажно..
	
// trdm 2019-02-14 08:05:07    
\todo - при сканировании директории C:\Progekts\_E\ReactOS 
	файл еквь.txt вырос до 80 мб. этот объем не осилить js.
	тут надо придумать что-то другое.
*/
//Парсим с помощью ctagsU.exe файл
function fileToCtags( psFileName, psFirst, psFIndex ) {
	var vFName = psFileName;
	if(!vFName) {
		return;
	}
	if(!psFIndex) {		psFIndex = 1;    }
	var vComandLine = '';
	var ctagExePath = gIntelCTagsUExeFPath;
	if(IntellPlus.curExtension == '1s' || IntellPlus.curExtension == 'vbs') {
		ctagExePath = gIntelCTagsUExeFPathSpeshl;
    }
	var resFile = (psFIndex == 1) ? gIntelCTagsUFPath : gIntelCTagsUFPath2;
	var isFolder = gFso.FolderExists(psFileName);
	if(!isFolder) {
		var vFirst = (psFirst) ? true : false;
		var vFChar = (vFirst) ? '' : ' -a ';
		if(!gFso.FileExists(vFName)) return;
		if(!gFso.FileExists(ctagExePath)) return; 	// --if0=yes --list-fields - не обрабатывается
		vComandLine = '"'+ctagExePath+'"'+vFChar+' -R -F --machinable=yes --sort=no --excmd=number -f "'+resFile+'" "'+vFName+'"';	// debugger;
		if(psFIndex == 2) {
			vComandLine = '"'+ctagExePath+'"'+vFChar+' -R -F --sort=no --excmd=number -f "'+resFile+'" "'+vFName+'"';	// debugger;
        }
    } else {
		vComandLine = '"'+ctagExePath+'" -R -F --machinable=yes --sort=no --excmd=number -f "'+resFile+'" "'+vFName+'"';	// debugger;
	}
	if(!gIntelShowParseLine) { 
		status('Parse: '+vFName);	// var gWshShell = new ActiveXObject("WScript.Shell");
	}
	status('WshShell.Run: '+vComandLine);	// var gWshShell = new ActiveXObject("WScript.Shell");
	if(gIntelShowParseLine) {
		//message(vComandLine);    
    }
	writeToIntellLog('gWshShell.Run: '+vComandLine);
	
	gWshShell.Run(vComandLine,0,true);
	return gFso.FileExists(resFile);
}

function getShortFileName(psFName){
	var ara = psFName.split('\\');
	return ara[ara.length-1];
}

function findByName(psArr, psName) {
	var rv;
	for(var i = 0; i<psArr.length; i++) {
		rv = psArr[i];
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

function ClassMap(clname /*, psPath*/){
	this.name = clname;
	/*this.path = psPath;*/
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
function ScopeMap(sname,psPath){
	sname = sname ? sname : 'clobal';
	this.sName = sname; // имя скрипта. Глобальные массивы:
	this.Path = psPath ? psPath : '???'; // имя скрипта. Глобальные массивы:
	/*{ для больших файлов нужен другой метод********************/
	this.FileSize = 0; 
	this.FileIsBig = false; 
	/*} для больших файлов нужен другой метод********************/
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
		if((Date.UTC - this.makeTime) > 150) { // не работает, исправить.
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

function getObjectListFromFileByCtags(psFileName) {
	var rv = '';
	if(gIntellDebug) { debugger;}
	var vFExist = false;
	status('getObjectListFromFileByCtags-Intell');
	vFExist = fileToCtags(psFileName,true,2);
	
	if(!vFExist) return 0;
	var vFileObj = gFso.GetFile(gIntelCTagsUFPath2);
	var vSize = vFileObj.Size;
	var vFileTs = vFileObj.OpenAsTextStream(1);
	
	//todo - очень большой файл попадается, надо что-то придумать.
	/*
	var vTextCtags = loadFromFile(gIntelCTagsUFPath2);
	var vArrLines = vTextCtags.split('\n');
	var cntAll = vArrLines.length;*/
	var vPartLine = [];
	var vName, vFile, vFileOld, vLileNo, vType, vOwner;
	var vLine;
	while(!vFileTs.AtEndOfStream) {
    	
	//for(var iCntr = 0; iCntr<cntAll; iCntr++) {		//vLine = vArrLines[iCntr];
		vLine = vFileTs.ReadLine();
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
			status('getObjectListFromFileByCtags-'+vFileOld);
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
		if(vName.indexOf("__anon") != -1) {
			continue;        
        }	//vOwner	"struct:__anon6029f53e0108"	String
		if(vOwner) {
			try { 
				if(vOwner.indexOf("__anon") != -1) {
					continue;
				}        
            } catch(e) {
				var yyy = 200;
            }
        }
		var resStrTmp = '';
		if (vOwner){
			vPos = vOwner.indexOf(':');
			if(vPos != -1) {
				vOwner = vOwner.substring(vPos+1); // овнера то мы поймали, но сам овнер как правило идет внизу, т.е. непонятно какого он типа. Но! как правило это класс.
				if(vType == 'm' || vType == 'f') resStrTmp = vOwner+':'+vName+'|'+vLileNo+'|f';
				if(vType == 'p' || vType == 'v' || vType == 'e') resStrTmp = vOwner+':'+vName+'|'+vLileNo+'|v';
            }			
		} else {
			if(vType == 'c' || vType == 'e' || vType == 't') {		resStrTmp = vName+'|'+vLileNo+'|c';
			} else if(vType == 'm' || vType == 'f') {	resStrTmp = vName+'|'+vLileNo+'|f';
			} else if(vType == 'v' || vType == 'd') {	resStrTmp = vName+'|'+vLileNo+'|v'; //sObj.		//d-define
            }			
		}
		if(resStrTmp) {
			rv += resStrTmp + '\n';
        }
		
	}
	return rv;
}


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
	// todo - для больших проектов сделать свой gIntelCTagsUFPath
	// fixme - если проект большой N++ виснет.
	if(!vFExist) return 0;
	var vTextCtags = loadFromFile(gIntelCTagsUFPath);
	var vArrLines = vTextCtags.split('\n');
	var cntAll = vArrLines.length;
	var vPartLine = [];
	var scopeMap = new ScopeMap('', psScriptFName);
	
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
			status('makeScriptMapParseCtagsResult: '+vFileOld);
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
		if(vName.indexOf("__anon") != -1) {
			continue;        
        }	//vOwner	"struct:__anon6029f53e0108"	String
		if(vOwner) {
			try { 
				if(vOwner.indexOf("__anon") != -1) {
					continue;
				}        
            } catch(e) {
				var yyy = 200;
            }
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
	IntellPlus.intellDebug = gIntellDebug;
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
function loadFromFile( psFileName ) {
	var rv = false;
	if (gFso.FileExists(psFileName)) {
		// если читается файл нулевого размера, тогда выдает ошибку...
		var fl = gFso.GetFile(psFileName);
		if(fl.Size){
			// gCtagsFileMaxSize = 300000
			if(fl.Size < gCtagsFileMaxSize) {
				var vTs = fl.OpenAsTextStream(1);
				rv = vTs.ReadAll();
				vTs.Close(); // trdm 2018-08-27 10:28:49  - иначе файло просто блокировалось..
            } else {
				message('File: '+psFileName+' is Big (size:'+fl.Size+' b), read part: '+gCtagsFileMaxSize+' b');
				var vTs = fl.OpenAsTextStream(1);
				while(!vTs.AtEndOfStream) {
					rv += vTs.ReadLine()+"\n";
					if(rv.length > gCtagsFileMaxSize) {
						break;
                    }
                }
			}
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
//trdm: 2017-12-23 20:47:42
function trimRight( psLine ) {	
	var re = new RegExp("[\\s]+$", 'g');
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
//"if(this.lineMap"  - не хорошо, надо подсчитать непарные скобки и убрать их для определения типа выражения
// "if(this.lineMap" >> 'this.lineMap'
function normalizeCurrentExpression(psCW) {
	//debugger;
	var arrBr = new Array;
	var rv = '';
	var nBreak = false;
	for(var i = psCW.length; i>0; i--) {
		var ch = psCW[i-1];
		switch(ch) {
          case ')':  arrBr.unshift(ch);     break;
          case '(': if(normaliseCW_needBreak(arrBr,')')) { nBreak = true;  }	break;
          case '{': if(normaliseCW_needBreak(arrBr,'}')) { nBreak = true;  }	break;
		  case '}':  arrBr.unshift(ch);     break;
          case '[': if(normaliseCW_needBreak(arrBr,']')) { nBreak = true;  }	break;
		  case ']':  arrBr.unshift(ch);     break;
		default:    
        }
		if(nBreak) {	break;    }
		rv = ch + rv;
    }
	return rv;
}
// класс накопления и обработки информации для поиска методов текущего выражения
var IntellPlus = {
	  curChar : ""
	, enabled: '' 		// активна технология
	, startLineNo: '' 	// стартовая строка, номер.
	, startColumnNo: '' 	// стартовая строка, номер.
	, currentLineNo: '' // номер текущей проверенной строки, нужен, что-бы исключить повторное сканирование и зацикливание
	, currentLine: '' 	// текущая строка
	, curPathFile: '' 	// текущий файл полный путь
	, curFileName: '' 	// текущий файл имя
	, curDirPath: '' 	// текущая директорий
	, currentWord: '' 	// текущее распознаваемое выражение
	, curWordIsActiveX: false 	
	, curWordType: '' 	// найденный тип текущего выражения
	, currentLineCl: ''	// Чистая, для доп-разбора
	, curExtension: '' 	// текущее расширение файла
	, wordIsTemplate: ''// выражение является шаблоном и хочет быть обработано :)
	, template: '' 		// тело текущего шаблона для подстановки
	, curLang: '' 		// язык для поиска. Понадобится когда будем работать во фрагментах html | php
	, hasBuiltInTypes: false// язык для поиска. Понадобится когда будем работать во фрагментах html | php
	, includedFileList: '' // список инклюдов для разбора и поиска методов
	, intellDebug : false // Для того, что-бы видеть в других скриптах
	, prepareText : true // Подготавливать тексты
	, prepareTextKCm : true // KC - KillComments Подготавливать тексты
	// \todo - а если там ссылка на веб, типа https://www.google.com/js/jquery-1.9.1.min.js что делать то???
	, debugMode : function(){
		return this.intellDebug;
	}
	, clear : function(){
		this.curWordIsActiveX = false;
		this.currentLineNo = '';
		this.wordIsTemplate = false;
		this.template = '';		
		this.curChar = '';
		this.currentWord = '';		
		this.prepareText = true;
		this.prepareTextKCm = true;		
		var view = Editor.currentView;
		this.currentLine = view.lines.get(view.line).text;
		this.currentLineCl = this.currentLine;
		this.startLineNo = view.line;
		this.startColumnNo = view.column;

	}
	, isActiveX : function() {    	return this.curWordIsActiveX;    }
	, isPhp : function () { 
		var rv = false;
		var vCurExtension = this.curExtension;
		if(vCurExtension == 'php' || vCurExtension.indexOf('php') == 0) {
			return true;
		}
		return false;
	}
	, isHtml : function () { 
		var rv = false;
		var vCurExtension = this.curExtension;
		if(vCurExtension == 'html' || vCurExtension.indexOf('htm') == 0) {
			return true;
		}
		return false;
	}
	, getComentChar : function(){
		var retVal = '//';
		if(IntellPlus.curLang == 'vbs') {
			retVal = "'";
		} else if(IntellPlus.curLang == 'bat' || IntellPlus.curLang == 'cmd') {
			retVal = "rem";
        }
		return retVal;
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
			this.curExtension = ext;
		}
		this.includedFileList = new Array;
		this.curPathFile = curPathFile;
		retVal = Editor.langs[view.lang];
		retVal = retVal.toLowerCase();
		// забывают про этот "язык". :)
		if (ext == 'vbs') {			
			this.hasBuiltInTypes = true;
			retVal = ext; 
			this.prepareText = false;
			this.prepareTextKCm = true;
		} else if(ext == '1s') { 
			retVal = ext; 
		} else if(ext == 'js') { 
			this.hasBuiltInTypes = true;
		} 
		if(ext == 'html' || ext == 'htm' ) {
			// проверить не стоит ли курсор в тексте между <script </script>
			if(cursorInScriptByHtml(view.text)) {
				retVal = 'js';            
            }
        }
		retVal = retVal.toLowerCase();
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
		retVal = normalizeCurrentExpression(retVal);
		if (checkTemplate){
			// html>js не отрабатывает trdm 2018-05-26 08:53:22 
			this.currentWord = retVal;
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
		if(retVal == '"') {
			retVal = "";
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
		// посмотрим как будет себя вести без мультилайна.
		re = /(\'.*)/ig;     //re = /(\'.*)/igm;    
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
				re = /(\'.*)/igm;    // re = /(\'.*)/igm;    
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
function extractJSFromHtmlText( psText ) {
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
		//EditorMessageDT(tag);
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

// trdm 2018-05-26 17:03:50 
function cursorInScriptByHtml( psText ) {
	var rv = false;
	var reScript1 = /<script\s+([^>]*)>/ig; 			// <script type="text/javascript" src="dtree.js">
	var reScript2 = /<\/script>/ig; 					// </script>
	var posTagScrStart = 0;
	var posTagScrEns = 0;
	var reRe1 = reScript1.exec(psText);
	var reRe2 = 0;
	var needDebug = false;
	var curAnchor = Editor.currentView.anchor;
	while(reRe1) {
		var inText = reRe1[0];
		var strLog = 're-1 index: ' + reRe1.index + ' lastIndex: '+reRe1.lastIndex;
		reScript2.lastIndex = reRe1.lastIndex
		reRe2 = reScript2.exec(psText); 
		if(reRe2) { 
			if(reRe1.lastIndex <= curAnchor && reRe2.index >= curAnchor) {
				// Курсор находится vt;le ntufvb <script///> и  </script>
				rv = true; 
				break;
            }
		}
		if(needDebug) {
			if(reRe2) {
				strLog += ' re-2: '+ ' index: ' + reRe2.index + ' lastIndex: '+reRe2.lastIndex;	
			}
			message(strLog);
        }
    	reRe1 = reScript1.exec(psText);
    }
	return rv;
}

//var ttext = loadFromFile('D:\\Program Files\\Notepad++\\plugins\\jN\\_tests\\dtree_.html');
//ttext = extractJSFromHtmlText( ttext );

// PrepareModuleText(Line, Col) 
function PrepareModuleText(Line, Col, psText) {
	// возможно лучше взять часть текста, включая текущую строку.
	if(IntellPlus.intellDebug) {
		//debugger;
    }
	
	var retVal = ""; 
	var view  = Editor.currentView;	
	if(psText) { retVal = psText;    
    } else { 	 retVal = view.text;	}
	
	if(!IntellPlus.prepareText) {
		return retVal;
    }
	
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
	if(IntellPlus.prepareTextKCm) {
		retVal = remoteAllComments(retVal);
    }
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
	if(psCurLang == "js" || psCurLang == "html") {
		strToDict = 'Array,Boolean,Date,Error,EvalError,Function,Math,Number,Object,RangeError,ReferenceError,RegExp,String,SyntaxError,TypeError,URIError,window,document';
		getBuiltInTypes_addTypes(retVal, strToDict);
		//jN{ ну и раз програмим с помошью плагина jN, то и его типы встроить надо, хотя тут надо опционально разделять.
		if(psCase) {
			strToDict = 'MenuItem,Menu,CtxMenu,Dialog,Library,CallBack,System,ViewLine,ViewLines,View,Editor';
			getBuiltInTypes_addTypes(retVal, strToDict); 		
		} //jN		
	} else if (psCurLang == "vbs") {
		strToDict = 'WScript';
		getBuiltInTypes_addTypes(retVal, strToDict);
	}
	return retVal;	
}

function fillLValDict(psText, psDict, psCase) {
	var tBadMessage = "";
	vText = psText; //loadFromFile(psFileName);
	if(!vText) return;
	var vDictNu = new ActiveXObject("Scripting.Dictionary");
	var arr = vText.split('\n');	
	var tLine = "";	
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
	if(!gJsLvalDict){		initLValDictions();	}
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
	if(!gJsLvalDict){		initLValDictions();	}
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
//
function killApostroff(psStr) {
	var rv = psStr;
	while(rv.indexOf("'") != -1){		rv = rv.replace("'",'"');	}
	return rv;
}


//trdm: Работа сразу со всем текстом не оправдана, надо разбирать построчно.
function getSimleType_js(psCurWord, psAllText) {
	gSearchCount++;
	vCurWord = psCurWord;
	if(vCurWord[0]=='$') {
		// У js RegExpr $ - управляющий символ.
		vCurWord = vCurWord.substr(1);
    }
	if(gSearchCount >= gSearchCountMax) {
		return "";
	}
	var allText = psAllText;
	
	if (vCurWord == "") return "";
	
	var retVal = "";
	var curLang = 'js';
	curLang = IntellPlus.curLang;
	bi_types = getBuiltInTypes(curLang);
	if (bi_types.Exists(vCurWord)){
		return vCurWord;
	}
	if (vCurWord.indexOf('.') != -1) {
	    retVal = getTypeFromLongDot(vCurWord,allText);
	    if (retVal/* != ""*/) {
	        return retVal;
	    }
	}
	if (vCurWord == 'this') {
	    //retVal = getMethodsForThis()
	}
	retVal = getTypeFromLvalUni(vCurWord,0); // зарезервированное слово/метод.
	if(retVal) return retVal;
	
	paternNew = vCurWord+"\\s*\\=\\s*new\\s*([a-zA-Z_]+[0-9]?)"; //re = new RegExp(paternNew, 'img');
	paternActive = vCurWord+'\\s*\\=\\s*new\\s*ActiveXObject\\(\\"([a-zA-Z_0-9\\.]+\\")\\)';  		//retVal = new ActiveXObject("Scripting.Dictionary");
	// [20181229020703] var sel = new ActiveXObject('Svcsvc.Service') //< Ups
	
	if(curLang == 'vbs') {
		paternActive = vCurWord+'\\s*\\=\\s*CreateObject\\s*\\(\\"([a-zA-Z_0-9\\.]+\\")\\)';  		//retVal = CreateObject("Scripting.Dictionary")
    }
	paternLVal = vCurWord+'\\s*\\=\\s*([a-zA-Z_\\(\\)\\[\\]"\'\\.\\]+[0-9]*)';	
	paternLVal = vCurWord+'\\s*\\=\\s*([a-zA-Z_\\(\\)\\[\\]"\'\\.\\\/]+[0-9]*)';	
	paternLValWe = vCurWord+'\\s*\\.\\s*([a-zA-Z_]+[0-9]*)';	
	try {
		// при незакрытой скобке в vCurWord, к примеру: "while(vText" возникает эксепшинз.
		reNew = new RegExp(paternNew, 'img');
		reActive = new RegExp(paternActive, 'img');
		reLVal = new RegExp(paternLVal, 'img');
		reLValWe = new RegExp(paternLValWe, 'img');
		reResu;
		isChar = /[\w\dА-я$_]/; // только символы строк
		if(curLang == 'vbs') {
			// reNew = 0; // брехня-> Set vRewgExpr = New RegExp
		}
	} catch(e) {
		vBadString = 'Ошибка при распознавании: '+ vCurWord+' строка: '+IntellPlus.currentLineNo;
		status(vBadString);
	}

	if(gIntellDebug) {	debugger;	}	

	if(IntellPlus.prepareText) {    
		allText = allText.replace(';','\n'); // аукнется конечно, но ничего переивем
		allText = allText.replace('\n\n','\n'); // аукнется конечно, но ничего переивем
    } else {
		IntellPlus.currentLineNo = IntellPlus.startLineNo;
	}
	var vTextLines = allText.split('\n');
	var vTLLen = vTextLines.length-1; // Надо сканировать не с начала текста, а запоминать позицию. И почему я начинаю с верхней строки, вдруг кто-то пишет код слитно???
	if(IntellPlus.currentLineNo == ''){
		IntellPlus.currentLineNo = vTLLen;
	} else { vTLLen = IntellPlus.currentLineNo - 1;}

	for (var iL = vTLLen; iL>=0; iL-- ) {
		if(gIntelShowParseLine) { status('Parse: '+iL+' line ');	 }
		
		if(IntellPlus.startLineNo == iL) {
			if(IntellPlus.debugMode()) {
				debugger;
            }
        } 
		

		IntellPlus.currentLineNo = iL;
		var tLine = vTextLines[iL];	//	alert(tLine);
		tLine = trimSimple(tLine);
		if (tLine == '') continue;
		if (!/[\w\dА-я$_]/.test(tLine)) continue;
		tLine = killApostroff(tLine);
	
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
	if(gIntellDebug) {	/*debugger;*/	}	
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
	// смешанные языки. HTML+js
	var cLang = IntellPlus.curLang;
	var vifArray = new Array;
	var fileName = gIntelDir + cLang+"_"+psTypeCWD+".ints";
	vifArray.push(fileName);						// js_array.ints
	vifArray.push(gIntelDir + psTypeCWD+".ints");	// array.ints
	if(cLang == 'js' || cLang == 'html') {
		if(psTypeCWD == 'document') {
			vifArray.push(gIntelDir + "IHTMLDocument2.ints");	// IHTMLDocument2.ints
        }
    }
	if(psTypeCWD.indexOf('.') != -1) {
		fileName = psTypeCWD;
		fileName = fileName.replace(".","_")+ ".ints"; // excel_application.ints
		fileName = gIntelDir + fileName;
		vifArray.push(fileName);	
    }
	// Иногда интерфейсы выливаются как I+имя интерфейса...
	fileName = gIntelDir + 'i' + psTypeCWD + ".ints"; // htmlelement >> IHTMLelement.ints
	vifArray.push(fileName);	
	
	for(var i = 0; i < vifArray.length; i++) {
		fileName = vifArray[i];
		retVal = loadFromFile(fileName);
		if(retVal) {
			break;
        }
    }
	if(!retVal) {	
		var vIFace = getInterfaceFromProgID(psTypeCWD);
		if(vIFace) {
			fileName = gIntelDir + vIFace+".ints";	// js_array.ints
			retVal = loadFromFile(fileName);
		}            
	}
	
	/*
	if (!(retVal = loadFromFile(fileName))){
		fileName = gIntelDir + psTypeCWD+".ints";				// array.ints
		if (!(retVal = loadFromFile(fileName))){
			// excel.application >>> excel_application
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
	*/
	if(gSortMetodsBefore>0 && retVal != ""){
		// Cортировать методы и свойства переж выдачей: 0 - не сортировать, 1 - сортировать потоком; 2 - сортировать отдельно
		var arrP = new Array;
		var arrM = new Array;
		var arr = retVal.split('\n');		
		for(iLine = 0; iLine <arr.length; iLine++){
			var vLine = arr[iLine];
			vLine = trimSimple(vLine);
			if(vLine.indexOf("#") == 0 || vLine.indexOf("//") == 0) {
				// trdm 2018-05-02 18:18:54 - пропустим коменты				
				continue;
            } else if(vLine == "") {
				continue;
            
            }
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
	//if(IntellPlus.curLang == "js" || IntellPlus.curLang == "vbs") {
	if(IntellPlus.hasBuiltInTypes) {
		spPross = true;
		var bi_types = getBuiltInTypes(IntellPlus.curLang,false); // Отсечку сделаем только по встроенным js типам. 
		if(!bi_types.Exists(psCurWord)) {
			vCurWord = '';
		}
	}
	strList = psStrList;
	var arr = strList.split('\n');
	var vDocLine = '';
	var arr2 = new Array;
	var tLine = "";
	var vDocDict = new ActiveXObject("Scripting.Dictionary");
	for(i=0; i<arr.length; i++){
		vDocLine = '';
		tLine = arr[i];
		tLine = arr[i].substring(4);
		tPos = tLine.indexOf("|"); // А надо окументацию убирать? Опционально?
		if(tPos != -1) {			
			vDocLine = tLine.substring(tPos+1);
			tLine = tLine.substring(0,tPos);	
		}
		tPos = tLine.indexOf(".");
		if(spPross) {
			if(vCurWord){			// строки, разделенные запятой, если там есть выражения psCurWord.[a-z], то брать только их и отсекать psCurWord.
				tPos = tLine.indexOf(vCurWord);
				if(tPos != -1) {
					tLine = tLine.substring(vCurWord.length+1);
				}
			} else {		    
				if (tPos != -1) continue; // Методы/свойства, которые используются только с предопределенными литералами, типа "Number.MAX_VALUE" надо отсекать, если объект не встроенный тип.
			}
        }
		arr2[i] = tLine;
		if(vDocLine != '') {
			tLine = trimSimple(tLine);
			vDocDict.Add(tLine,vDocLine);        
        }
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
	if(rv != "") {
		if(vDocDict.Exists(rv)) {
			vDocLine = vDocDict.Item(rv);
			status(''+rv+" - "+vDocLine);
        }
    
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
// бага - дефинишенз может быть не один, а семантически завязан на структуре инклюде ()
function goToDefinitionsByCtagsGlobal(psCurScr, psFileName) {
	var rerVal = false;
	if(gIntellDebug) { /*debugger;*/ }
	
	writeToIntellLog('goToDefinitionsByCtagsGlobal: '+ psCurScr);
	
	var curWord = IntellPlus.getCurWord(); // просто для инициализации.
	var found = false;
	var rv = '';
	status('selectGoToDefinitionIntell - search: '+psCurScr);
	var vOnlyCurScr = (psCurScr) ? true : false;
	
	/*************************************************************/
	checkUpdateScopeMapCtags(); 
	/*************************************************************/
	if(gCtagsMapLast) {
		rv = gCtagsMapLast.getAllMembers(psFileName);
    }
	if(rv) {
		var addCaption = (psFileName) ? ' '+IntellPlus.curFileName : '(all spase)';
		if(!vOnlyCurScr) {
			var objStr = selectFromString(rv, 'Переход к объекту: '+addCaption);
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
	try { 
		var vFile = gFso.GetFile(psFName);
    } catch(e) {
		status("file: '"+psFName+"' - not found!");
		return rv;
    }
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
		getIncludedFileNamesFromText(vText,rv,1);
	}
	rv.sort();
	return rv;
}


function ctags_jNProjectRootFileFind(psCurFilePath) {
	var rv = '';
	if(gFso.FileExists(psCurFilePath)) {
		var vFile = gFso.GetFile(psCurFilePath);
		var vFolder = vFile.ParentFolder;
		var vFPath = vFolder.Path +'\\'+ gProjectRootFileName;
		for(var i = 1; i<= strCount(vFPath,'\\'); i++) {
			if(gFso.FileExists(vFPath)) {
				rv = vFPath;
				break;
            }
			vFolder = vFolder.ParentFolder;
			vFPath = vFolder.Path +'\\'+ gProjectRootFileName; 
        }		
    }
	return rv;
}

function checkUpdateScopeMapCtags() {
	if(gIntellDebug) { 
		//debugger; 
	} 		
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
			// Ищем gProjectRootFileName
			var vjN_ctags_iniFPath = ctags_jNProjectRootFileFind(IntellPlus.curPathFile); 
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
	if(gIntellDebug) { 
		//debugger; 
	}
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
	парсинг, выбор вваринта и встравку результата во view. -_- */
function getWordList() {
 	if(gIntellDebug) {
		debugger;
	}	
	gSearchCount = 0;
	var retVal = '';
	var curWord = IntellPlus.getCurWord(); 	
	if (!curWord) { 
		if(IntellPlus.isHtml()) {
        
        }
		/*insertTemplate();*/ 
		return; 
	}
	writeToIntellLog('getWordList fore: '+ curWord);
	var cLang = IntellPlus.curLang;
	if (cLang != "js") {
		if (IntellPlus.wordIsTemplate) {
			return insertTemplate();
		}
		if(!(cLang == "vbs" || cLang == 'html' || cLang == 'php')) {
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
// trdm 2018-04-01 16:13:14 
// плохая идея как оказалось. т.к. теряется возможность идентить и реидентить ВЫДЕЛЕННЫЙ код, что само по себе ценная вещm.
//addHotKey(myTabCatcher); scriptsMenu.addItem(myTabCatcher);


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