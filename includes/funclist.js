////////////////////////////////////////////////////////////////////////////////////////
////{ Cкрипт "Список функций в js-скриптах для Снегопата" (funclist.js) Notepad++ (jN)
////
//// Описание: 
////
//// Реализует список функций (функций, методов объектов и макросов Снегопата)
//// и возможности навигации по коду скрипта (goToDefinition и возможность возврата). 
//// Предназначен для использования при разработке скриптов для проекта Снегопат. 
//// 
//// Сайт проекта Снегопат: http://snegopat.ru.
//// 
//// Работает в Notepad++ (http://notepad-plus-plus.org) при помощи плагина jN:
////    - анонс и описание плагина на Хабрахабре: http://habrahabr.ru/blogs/javascript/86626/
////    - документация по объектной модели плагина: http://www.softwarecanoe.de/jn/api.xml
////    - ссылка на актуальную версию плагина: https://github.com/sieukrem/jn-npp-plugin
////
//// Также для своей работы скрипту необходима COM-библиотека svcsvc.dll (автор: Александр Орефков).
//// Скачать последнюю версию svcsvc.dll можно по адресу: http://script-coding.com/svcsvc.html
////
//// Автор: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
////}
////////////////////////////////////////////////////////////////////////////////////////

// trdm todo: Надо сделать настройку сортировки списка функций.

//(function() {

var PATTERNS = new Array;
//function addSearchPattern(pattern, nameIndex, classIndex) {
addSearchPattern(/\s*function\s+([\w\dА-я]+)/i, 1, 0);
addSearchPattern(/\s*([\w\dА-я]+)\.prototype\.([\w\dА-я]+)\s*=\s*function\s*/i, 2, 1);
addSearchPattern(/SelfScript\.self\[[\'\"](.+?)[\'\"]\]\s*=\s*function/i, 1);
addSearchPattern(/\s*sub\s+([\w\dА-я0-9]+)/i, 1, 0); // trdm|vbs
addSearchPattern(/\s*[\w\dА-я]+\s+([\w\dА-я]+[\:]{2,2}[\w\dА-я]+[\(]+)/i, 1, 0); // trdm|c++.cpp: "retType className::funcName("
addSearchPattern(/[\s+|,]([\w\dА-я]+)\s*[\:]\s*function\s*\(/i, 1, 0);; // trdm|js fore: getCells:function(isOn, indicatorNr)
addSearchPattern(/[\s+|,]this\.([\w\dА-я]+)\s*[\=]\s*function\s*\(/i, 1, 0);; // trdm|js fore: getCells:function(isOn, indicatorNr)
addSearchPattern(/[\s+|^]*Template\:([\w\dА-я]+)/i, 1, 0);; 	// trdm для файлов *.tmpl
// this.getLastClassPosLine = function (psLine, psScrFName) { <<< \todo - не ищет //trdm: 2018-01-18 08:03:36 
//addSearchPattern(/\s*процедура|Функция\s+([\w\dА-я0-9]+)\(/i, 1, 0); // trdm|1s
//addSearchPattern(/(Процедура|Функция\s+([a-zа-яё_]+))\s*[\(]+/igm, 1, 0); // trdm|1s
// todo для *.1s надо использовать Скрипт=СоздатьОбъект("MSScriptControl.ScriptControl"); и парсить регулярками из vbs

/* \todo трдм можно организовать полный JUMP _HISTORY, у которого будет сохраняться история 
ну скажем 50 последних перемещений и будет список выбора для прыжка и можно будет не
только возвращаться назад, но и идти вперед*/

var gJumperDebug = false;
var gJumperDebugJC = false;
var gJumperCurLineText = '';
var gFuncListLoger = '';

var JUMP_HISTORY_SPointer = -1;
var JUMP_HISTORY = new Array();
var gSelector;
try {
	gSelector = new ActiveXObject('Svcsvc.Service')
} catch(e) {
	gSelector = "";
}

// +trdm {
function trim( str, charlist ) {	// Strip whitespace (or other characters) from the beginning and end of a string
	var re = new RegExp("^[\\s]+|[\\s]+$", 'g');
	return str.replace(re, '');
}

function funcListLog(str) {
	if(!gFuncListLoget) {
		gFuncListLoget = new CIntellLoger('funcList');    
    }
	gFuncListLoget.log(str);
}

// trdm 2017-11-06
// для *.html, прыгунок на теги <scripts / >в файле.
function listScripts() {
	var scrList = new Array;
    var lines = Editor.currentView.lines;    
	var reS = /\s*<\s*script\s+/i;	
	//debugger;
    for (var lineNo=0; lineNo<lines.count; lineNo++)
    {
        var scri = false;
		var lText = lines.get(lineNo).text;
		
        var matches = lText.match(reS);
        if (matches)  {			
            scri = '('+lineNo+')' + trim(lText);
        }		
        if (scri)     {
            scrList.push(scri);

        }
    }
    
    var selScri = selectValue(scrList,"Выберите скрипт");
    if (selScri) {
		var lNo = selScri.match(/\d+/)[0];
        goToLine(lNo);//        goToLine(scrLines[selScri]);
	}	
}

// trdm 2017-11-06
// для *.html, прыгунок на теги <script|form|img|meta|table|style|head|body|div|ul / >в файле.
function gotoAnyHtmlTag() {
	var tagList = new Array;
    var lines = Editor.currentView.lines;    
	var tagTypeList = 'script,form,img,meta,table,style,head,body,div,ul,interface,coclass'.split(',');
	var tagType = selectValue(tagTypeList,"Выберите тег");
	if (tagType) {
		// надо сделать список для выбора типа тега script/form/img/meta
		//debugger;
		var reTxt = "\\s*<\\s*" + tagType + "\\s+";
		var re = new RegExp(reTxt,"ig");
		
		for (var lineNo=0; lineNo<lines.count; lineNo++)
		{
			var scri = false;
			var lText = lines.get(lineNo).text;
			
			var matches = re.exec(lText);
			if (matches)  {			
				scri = '('+lineNo+')' + trim(lText);
			}		
			if (scri)     {
				tagList.push(scri);

			}
		}
		
		var selScri = selectValue(tagList,"Выберите HTML тег");
		if (selScri) {
			var lNo = selScri.match(/\d+/)[0];
			goToLine(lNo);//        goToLine(scrLines[selScri]);
		}	
	}
	
}
// +trdm }

// ***********************************************************************
function listFunctions () { // Главная функция скрипта.
// ***********************************************************************
    var funcList = new Array;
    var funcLines = {};

    //var lines = StringUtils.toLines(Editor.currentView.text);        
    var lines = Editor.currentView.lines;    
    for (var lineNo=0; lineNo<lines.count; lineNo++)
    {
        var func = checkForFuncDef(lines.get(lineNo).text);
        if (func)
        {
            funcList.push(func);
            funcLines[func] = lineNo;

        }
    }
	funcList.sort();
    var vCaption = "Выберите функцию";
	// if(Editor.currentView.) { }  надо получить текущее расширение и если это *.tmpl, то писать :"Выберите шаблон"
	addToHistory();
    var selFunc = selectValue(funcList,vCaption);
    if (selFunc) 
        goToLine(funcLines[selFunc],false);
        
}

function checkForFuncDef(line) {
    function g(i, m) { return i && m.length > i ? m[i] : ''; }
	vLine = line;
	//vLine = right
	
    for(var i=0; i<PATTERNS.length; i++) 
    {        
        var pattern = PATTERNS[i];
        var matches = vLine.match(pattern.re);
        if (matches)
        {
            var funcName = g(pattern.nameIndex, matches);
            var className = g(pattern.classIndex, matches);
            return className ? className + '::' + funcName : funcName;
        }
    }
    
    return '';
}

function addSearchPattern(pattern, nameIndex, classIndex) {
            
    PATTERNS.push({
        're': pattern,
        'nameIndex': nameIndex,
        'classIndex': classIndex
    });
}

function selectValue(values, psCaption) {
	
    try    {
        var sel = new ActiveXObject('Svcsvc.Service')
    }
    catch(e)    {
        alert("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll");
        return false;
    }
	try { 
		// 256 - сортировка списка
		retVal = gSelector.FilterValue(values.join("\r\n"), 1 /*| 4 */| 32 | 256, psCaption, 0, 0, 0, 0);    
    } catch(e) {
		retVal = gSelector.FilterValue(values.join("\r\n"), 1 /*| 4 */| 32, psCaption, 0, 0, 0, 0);    
    }
   //alert(values.join("\r\n"));
   return retVal;    
}

function goToDefinition() {
    var word = getWordUnderCursor(Editor.currentView);
    if (word == '') return;
	var sucsess  = false;
	var localParsing = true;
	IntellPlus.init();
	var parseUpToDown = 1; // сверху вниз
	var parseCurToUp = -1; // c текущей строки и вверх
	var parseStrategy = parseUpToDown;
	var isC_Cpp = false;
	var isVbs = false;
	var isJs = false;
	// debugger;
	// оптимизадница
	if(IntellPlus.curLang == 'c' || IntellPlus.curLang == 'cpp') {
		//localParsing = false;
		isC_Cpp = true;
    } else if(IntellPlus.curLang == 'vbs') {
		isVbs = true;    
    } else {
		isJs = true;
	}
	
	status('goToDefinition - parse: '+IntellPlus.curFileName);
	if(localParsing) {    
		var re = new Array(); 	
		if(isJs) {
			re.push(new RegExp('\\s*function\\s+' + word  + '\\s*\\(')); //js
			re.push(new RegExp('\\s*[\\w\\dА-я]+\\.prototype\\.' + word + '\\s*=\\s*function\\s*\\('));
			re.push(new RegExp('var\\s+' + word + '\\s*[,;=]')); 
			// trdm  {
			re.push(new RegExp('[\\s|,]?'+word+'\\s*\\:\\s*function\\s+')); // function в объекте <- //todo - функция из комментария, надо резать комменты.
			re.push(new RegExp('[\\s|,]this\\.'+word+'\\s*\\=\\s*function[\\s|\\(]+')); // 	this.getLastClassPosLine = function (psLine, psScrFName) {
			re.push(new RegExp('[\\s]*this\\.'+word+'\\s*\\=\\s*')); // переменная в объекте
			re.push(new RegExp('[\\s|,]?'+word+'\\s*\\:\\s*')); // переменная в объекте
			// trdm  }
        }
		re.push(new RegExp('\\s+' + word + '\\s*[,;=]\s+','i')); //vbs
		// trdm  {
		if(isVbs) {
			re.push(new RegExp('set\\s+' + word + '\\s*[,;=]','i')); //vbs
			re.push(new RegExp('dim\\s+' + word + '\\s*','i')); 
        }
		if(isC_Cpp) {
			re.push(new RegExp('([A-z_]+)\s*[*&]*\s*'+ word,'')); // с/с++ определение        
			parseStrategy = parseCurToUp;
        }
		// trdm  }
		var lines = Editor.currentView.lines;
		var lnStart = 0;
		var lnEnd = lines.count;
		var lnCur = Editor.currentView.line;
		if(parseStrategy == parseCurToUp) {
			lnStart = -lnCur;
			lnEnd = -1;
        }
		var lineNo = 0;
		for (var lineNoPS=lnStart; lineNoPS<lnEnd; lineNoPS++)	//	for (var lineNo=0; lineNo<lnEnd; lineNo+=parseStrategy)
		{
			lineNo = lineNoPS; if(parseStrategy == parseCurToUp) { lineNo = lineNo*parseStrategy+1;}
			var text = lines.get(lineNo).text;
			if(text.indexOf(word) == -1) {
				continue;
			}
			for (var reNo=0; reNo<re.length; reNo++)
			{
				var reE = re[reNo];
				var reRe = reE.exec(text);
				if (reRe)
				{
					// Позиционируемся на нужную строку.
					goToLine(lineNo);
					sucsess = true;
					
					// Позиционируемся на нужном слове.
					var col = text.search(word);
					if (col > -1)
						setCaretPosInLine(Editor.currentView.lines.get(lineNo).start + col);
					addToHistory();
				}
				if(sucsess) {
					break;
				}
			}
			if(sucsess) {
				break;
			}
		}
    }
	if(!sucsess) {		
		sucsess = goToDefinitionsByCtagsGlobal(word); //Intell.js
	}
	if(!sucsess) {
		//todo - тогда попробовать показать справку по языку.
    
    }
	status('goToDefinition done for: '+word);
}

function getWordUnderCursor(view) {

    var pos = { beginRow: view.line, beginCol: view.column };
    var line = currentView.lines.get(view.line).text;
    var isChar = /[\w\dА-я]/;
	// trdm : таб считается за 1 символ в charAt, а в редакторе настраивается, у меня: 4 пробела 
	//%AppDir%\Application Data\Notepad++\config.xml (NotepadPlus\GUIConfigs\GUIConfig\TabSetting|size="XXXX"
	line = line.replace(/[\t]/g,"    "); 
    var wordBegPos = pos.beginCol - 1;
    var cChar = line.charAt(wordBegPos);
    if (!isChar.test(cChar))
        return '';
        
    while (wordBegPos > 0)
    {
        if (!isChar.test(line.charAt(wordBegPos - 1)))
            break;
            
        wordBegPos--;
    }
                
    var wordEndPos = pos.beginCol - 1;
    
    while (wordEndPos < line.length - 1)
    {
        if (!isChar.test(line.charAt(wordEndPos + 1)))
            break;
            
        wordEndPos++;    
    }
    
    return line.substr(wordBegPos, wordEndPos - wordBegPos + 1);
}

function addToHistory_clearDubl() {
	if(!JUMP_HISTORY.length) { return; }
	if(gJumperDebug) {	debugger;    }
	var arrDelIdx = new Array;
	var row = Editor.currentView.line;
	var vFile = Editor.currentView.files[Editor.currentView.file];
	for(var i = 0; i<JUMP_HISTORY.length; i++) {
		var pos = JUMP_HISTORY[i];
		if(pos) {
			if(pos.row == row && pos.file == vFile) {
				arrDelIdx.unshift(i);
            }        
        }
    }
	if(arrDelIdx.length) {
		for(var i = 0; i<arrDelIdx.length; i++) {
			JUMP_HISTORY.slice(arrDelIdx[i],1);
        }    
    }
}

function addToHistory() {
	//debugger;
	if(gJumperDebug) {	debugger;    }
	var vFile = Editor.currentView.files[Editor.currentView.file];
	var vRow = Editor.currentView.line;
	if(JUMP_HISTORY.length) {
		addToHistory_clearDubl();
		var pos = JUMP_HISTORY[JUMP_HISTORY.length-1];
		if(pos) {
			if(pos.row == vRow && vFile == pos.file) {
				return;
            }        
        }
    }
	addToHistory_clearDubl();
	JUMP_HISTORY.push( { 
		row: vRow, 
		col: Editor.currentView.pos, 
		file: vFile,
		ltext: currentView.lines.get(currentView.line).text
		} );
	while(JUMP_HISTORY.length > 50) {
    	JUMP_HISTORY.shift();
    }
	JUMP_HISTORY_SPointer = JUMP_HISTORY.length;
}

function goToLine(lineNo, doNotRemember) {
    // Запомним текущую строку в истории переходов, 
    // чтобы иметь возможность вернуться назад.
    if (!doNotRemember) addToHistory();

    // Это делаем, чтобы у нас в результате позиционирования найденная строка
    // оказывалась не в начале экрана, а чуть пониже. 
    if (lineNo - 15 > 0)
    {
        Editor.currentView.line = Editor.currentView.lines.count - 1;
        Editor.currentView.line = lineNo - 15;
    }
    else
    {
        Editor.currentView.line = 1;
    }   
    
    // Собственно, позиционирование на нужной строке.
    Editor.currentView.line = lineNo;  
	//addToHistory();	
}

function setCaretPosInLine(pos) {
    Editor.currentView.anchor = pos;
    Editor.currentView.pos = pos;
}

function goToPos( psPos ) {
	if(psPos) {
		open(psPos.file);
		goToLine(psPos.row, true);
		setCaretPosInLine(psPos.col);
    }
}

function jumpBack() {
	//debugger;
	if(gJumperDebug) {	debugger;    }
    if (JUMP_HISTORY.length && JUMP_HISTORY_SPointer>0)    {
        //var pos = JUMP_HISTORY.pop();
		JUMP_HISTORY_SPointer -= 1;
		// if(JUMP_HISTORY_SPointer < 0) {			JUMP_HISTORY_SPointer = 0;        }
        var pos = JUMP_HISTORY[JUMP_HISTORY_SPointer-1];
		if(pos) {
			goToPos(pos);
			try { 
				status('gotoBack: ' + pos.file + ':'+pos.row+': jpc'+JUMP_HISTORY_SPointer);
            } catch(e) {
            }
        }
    }
}

function jumpForvard() {
	if(gJumperDebug) {	debugger;    }
    if (JUMP_HISTORY.length && JUMP_HISTORY_SPointer<=JUMP_HISTORY.length)    {
		gJumperDebugJC++;
        //var pos = JUMP_HISTORY.pop();
		JUMP_HISTORY_SPointer += 1;
		if(JUMP_HISTORY_SPointer-1 <= JUMP_HISTORY.length) {
			var pos = JUMP_HISTORY[JUMP_HISTORY_SPointer-1];
			if(pos) {
				goToPos(pos);
				try { 
					status('gotoForvard: ' + pos.file + ':'+pos.row+': jpc'+JUMP_HISTORY_SPointer);
				} catch(e) {
				}
			}
		}
    }
}

////////////////////////////////////////////////////////////////////////////////////////
//{ StartUp

if (!jN.scriptsMenu){
	var scriptsMenu = Editor.addMenu("Скрипты");
	jN.scriptsMenu = scriptsMenu;
} else {
	scriptsMenu = jN.scriptsMenu;
}

// Виртуальные коды клавиш см. по ссылке: http://msdn.microsoft.com/en-us/library/dd375731(VS.85).aspx
	
//}

//{ Список функций 
var listFunctionsItem = {
    text: "Список функций\tCtrl+1",    
	ctrl: true,    shift: false,   alt: false,
    key: 0x31,
    cmd: listFunctions
};

/*System.*/addHotKey(listFunctionsItem);
scriptsMenu.addItem(listFunctionsItem);
//} Список функций

//{ Перейти к определению
var goToDefinitionItem = {
    text: "Перейти к определению\tF12", 
    ctrl: false,    shift: false,    alt: false,
    key: 0x7B,
    cmd: goToDefinition
};

/*System.*/addHotKey(goToDefinitionItem);
scriptsMenu.addItem(goToDefinitionItem);
//} Перейти к определению

//{ Вернуться назад
var jumpBackItem = {
    text: "Вернуться назад\tCtrl+-|Alt<-", 
    ctrl: true,    shift: false,    alt: false,
    key: 0xBD,
    cmd: jumpBack
};

/*System.*/addHotKey(jumpBackItem);
scriptsMenu.addItem(jumpBackItem);
var jumpBackItem2 = {
    text: "Вернуться назад\talt+<-", 
    ctrl: false,    shift: false,    alt: true,
    key: 0x25,
    cmd: jumpBack
};
addHotKey(jumpBackItem2);
//} Вернуться назад
var jumpForvardItem = {
    text: "Пойти вперед\tCtrl++|Alt->", 
    ctrl: true,    shift: false,    alt: false,
    key: 0xBB,
    cmd: jumpForvard
};

/*System.*/addHotKey(jumpForvardItem);
scriptsMenu.addItem(jumpForvardItem);
var jumpForvardItem2 = {
    text: "Пойти вперед\talt+->", 
    ctrl: false,    shift: false,    alt: true,
    key: 0x27,
    cmd: jumpForvard
};
addHotKey(jumpForvardItem2);


scriptsMenu.addSeparator();

// trdm {

var gotoAnyHtmlTagItem = {
    text: "Перейти к тегу на выбор\tCtrl+Shift+3", 
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x33,
    cmd: gotoAnyHtmlTag
};
addHotKey(gotoAnyHtmlTagItem);
scriptsMenu.addItem(gotoAnyHtmlTagItem);


var listScriptsItem = {
    text: "Список тегов script\tCtrl+4", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x34,
    cmd: listScripts
};
addHotKey(listScriptsItem);
scriptsMenu.addItem(listScriptsItem);
// trdm }



//} StartUp

//})();