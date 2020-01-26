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
//— -
// trdm todo: Надо сделать настройку сортировки списка функций.

//(function() {

var PATTERNS = new Array;
//function addSearchPattern(pattern, nameIndex, classIndex) {
addSearchPattern(/\s*function\s+([\w\dА-я]+)/i, 1, 0); 
addSearchPattern(/\s*class\s+([\w\dА-я]+)/i, 1, 0); //vbs Class
addSearchPattern(/\s*([\w\dА-я]+)\.prototype\.([\w\dА-я]+)\s*=\s*function\s*/i, 2, 1);
addSearchPattern(/SelfScript\.self\[[\'\"](.+?)[\'\"]\]\s*=\s*function/i, 1);
addSearchPattern(/\s*sub\s+([\w\dА-я0-9]+)/i, 1, 0); // trdm|vbs
addSearchPattern(/\s*[\w\dА-я]+\s+([\w\dА-я]+[\:]{2,2}[\w\dА-я]+[\(]+)/i, 1, 0); // trdm|c++.cpp: "retType className::funcName("
addSearchPattern(/[\s+|,]([\w\dА-я]+)\s*[\:]\s*function\s*\(/i, 1, 0);; // trdm|js fore: getCells:function(isOn, indicatorNr)
addSearchPattern(/[\s+|,]this\.([\w\dА-я]+)\s*[\=]\s*function\s*\(/i, 1, 0);; // trdm|js fore: getCells:function(isOn, indicatorNr)
addSearchPattern(/[\s+|^]*Template\:([\w\dА-я]+)/i, 1, 0);; 	// trdm для файлов *.tmpl
// this.getLastClassPosLine = function (psLine, psScrFName) { <<< \todo - не ищет //trdm: 2018-01-18 08:03:36 
//addSearchPattern(/\s*процедура|Функция\s+([\w\dА-я0-9]+)\(/i, 1, 0); // trdm|1s
addSearchPattern(/(Процедура|Функция\s+([a-zа-яё_]+))\s*[\(]+/igm, 1, 0); // trdm|1s
// todo для *.1s надо использовать Скрипт=СоздатьОбъект("MSScriptControl.ScriptControl"); и парсить регулярками из vbs

/* \todo трдм можно организовать полный JUMP _HISTORY, у которого будет сохраняться история 
ну скажем 50 последних перемещений и будет список выбора для прыжка и можно будет не
только возвращаться назад, но и идти вперед*/

var gJumperDebug = false;
var gJumperDebugJC = false;
var gJumperCurLineText = '';
var gFuncListLoger = '';

var gVbsRegExpr = 0;

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

function killComment(psLine) {
	var rv = psLine;	// message('1-'+rv);
	var vCommPos = rv.indexOf('//');
	if(vCommPos != -1) {
		rv = rv.substring(0,vCommPos);
	}	// message('2-'+rv);
	return rv;
}


// trdm 2017-11-06
// для *.html, прыгунок на теги <script|form|img|meta|table|style|head|body|div|ul / >в файле.
function gotoAnyHtmlTag() {
	if(IntellPlus.debugMode()) {		debugger;        }
	var tagList = new Array;
    var lines = Editor.currentView.lines;    
	var tagTypeList = 'script,link,title,form,img,meta,table,style,head,body,div,ul,interface,coclass'.split(',');
	var tagType = selectValue(tagTypeList,"Выберите тег",true,true);
	if (tagType) {
		// надо сделать список для выбора типа тега script/form/img/meta
		//debugger;
		var reTxt = "\\s*<\\s*" + tagType + "(\\s+|>)";
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
// "Список функций\tCtrl+1",    
// ***********************************************************************
	try { 		if(IntellPlus.intellDebug) {	debugger;       }    } catch(e) {    }
    var funcList = new Array;
    var funcLines = {};
	var standartParse = true;
	
	IntellPlus.init();
	if(IntellPlus.curExtension == "1s" || IntellPlus.curExtension == "bsl") { 
		var listStr = getObjectListFromFileByCtags(IntellPlus.curPathFile);
		if(listStr) {			
			standartParse = false;        
			var list = listStr.split('\n');
			for(var i = 0; i<list.length ; i++) {
				var item = list[i];
				var items = item.split('|');
				var func = items[0];
				func = func.replace(';','');
				var isFuncApp = (items[2] == 'f') ? '()' : ';'; // для быстроты выбора
				func += isFuncApp;
				funcList.push(func);
				funcLines[func] = parseInt(items[1]);			
				if(i%100 == 0) {
					status("listFunctions_0 - "+lineNo);
				}				
			}
		}
	}
	if(standartParse) {
		//var lines = StringUtils.toLines(Editor.currentView.text);        
		var lines = Editor.currentView.lines; 
		var line = '';
		for (var lineNo=0; lineNo<lines.count; lineNo++)
		{
			line = lines.get(lineNo).text;
			line = killComment(line);
			if(line == '') {			continue;        }
			var func = checkForFuncDef(line);
			if (func)
			{
				funcList.push(func);
				funcLines[func] = lineNo;

			}
			if(lineNo%100 == 0) {
				status("listFunctions - "+lineNo);
			}
		}
    }
	funcList.sort();
    var vCaption = "Выберите функцию (funclist.js)";
	// if(Editor.currentView.) { }  надо получить текущее расширение и если это *.tmpl, то писать :"Выберите шаблон"
	addToHistory();
	if(funcList.length > 0) {
		var selFunc = selectValue(funcList,vCaption);
		if (selFunc) 
			goToLine(funcLines[selFunc],false);        
    } else {
		if(IntellPlus.isHtml()) {
			gotoAnyHtmlTag();
        }
	}
}

function VBScriptRegExpr(psPatern, psText) {
	// trdm 2018-04-06 13:35:21 
	// Кажется проблема в том, что я юникодным патерном пытаюсь достать win-1251 строку с кирилицей? Пока все неудачно....
	var rv = '';
	gVbsRegExpr = new ActiveXObject("VBScript.RegExp");
	gVbsRegExpr.Global = 1;
	gVbsRegExpr.Multiline = 1
	gVbsRegExpr.IgnoreCase = 1;
	gVbsRegExpr.Pattern = psPatern;
	// debugger;
	var vMatch = '';
	try { 
		var vMatch = gVbsRegExpr.Execute(psText);
    } catch(e) {
		//message(e.)
		return '';
    }
	var vMaEnum = new Enumerator(vMatch);
	vMaEnum.moveFirst();
	while(!vMaEnum.atEnd()) {
		k = vMaEnum.item(); 
		if(k) {
        
        }
		vMaEnum.moveNext();
	} 
	return rv;
}


function checkForFuncDef(line) {
    function g(i, m) { return i && m.length > i ? m[i] : ''; }
	vLine = line;
	// неудачная попытка.... :(((((((((((((
	//vLine = right
	// var vPFPatern = '';
	// vPFPatern = "[\s|^](Процедура|Функция|Procedure|Function)\s+([a-zA-zа-яА-Я0-9_]+)\s";
	// vPFPatern = "(Процедура|Функция|Procedure|Function)\s+([a-z\w0-9_]+)\s*";
	// vPFPatern = Intell_1251.searchProcPatern;
	// var res = VBScriptRegExpr(vPFPatern,line);    
	// if(res) {
		// return res;
    // }
	
    for(var i=0; i<PATTERNS.length; i++) 
    {        
        var pattern = PATTERNS[i];
        var matches = vLine.match(pattern.re);
        if (matches)
        {
            var funcName = g(pattern.nameIndex, matches);
            var className = g(pattern.classIndex, matches);
			if(funcName || className) {
				return className ? className + '::' + funcName : funcName;
            }
        }
    }
	// проблема. Когда у нас модуль в Utf-8, а 1Сv8 выгружает модули(bsl) именно в этой кодировке, то регулярки не пашут. :((((((((((
	var vPFArra = new Array("Процедура","Функция");
	var vNlArra = new Array("+",";","[","]","(",")","+","-","*"); // no letters
	var vArItem = strContains(vLine, vPFArra);
	if(vArItem != "") {
		var funcName = strBetween(vLine, vArItem, "(");
		// "addSearchPattern(/(Процедура|Функция\s+([a-zа-яё_]+))\s*[\(]+/igm, 1, 0); " <<<< вот такой "возврат" получили
		if(!strContains(funcName, vNlArra)) {
			funcName = trimSimple(funcName);
			return funcName;        
        }
		
    }
    return '';
}
//checkForFuncDef(Intell_1251.searchProcLine);

function addSearchPattern(pattern, nameIndex, classIndex) {
            
    PATTERNS.push({
        're': pattern,
        'nameIndex': nameIndex,
        'classIndex': classIndex
    });
}

function selectValue(values, psCaption, psSort, psUserInput) {
	
    try    {
        var sel = new ActiveXObject('Svcsvc.Service')
		// sel.
    }
    catch(e)    {
        alert("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll");
        return false;
    }
	var vSort = true;
	if(psSort !== undefined) {		vSort = psSort;    }
	var vUserUnp = false;
	if(psUserInput !== undefined) {
		vUserUnp = psUserInput;  
    }
	try { 
		// 256 - сортировка списка
		/**
		-------------------------------------------------------------
		FilterValue(ByVal Values As String, ByVal Flags As Short=0,	ByVal Caption As String="", ByVal X As Long=0, ByVal Y As Long=0, ByVal W As Long=0, ByVal H As Long=0) As String
		Открывает окошко выбора из списка с фильтрацией.
		Те по мере ввода текста список для выбора уменьшается.

		Values
			Строка со значениями для выбора, каждое из которых расположено
			на отдельной строке (разделены vbCrLf).
		Flags
			Различные флаги. Может быть суммой следующих значений:
		1	- Фильтровать по вхождению подстрок. Если флаг не указан,
			значения будут фильтроваться с начала строки.
		2	- Вывести окно в позиции мыши.
		4	- Вывести окно в позиции курсора
		8	- Вывести окно в указанных координатах
		16	- Допускать ввод своих значений. В этом случае функция возвратит
			то, что пользователь набрал в окне ввода. Иначе будет возвращен
			выбранный пункт списка.
		32	- Использовать заголовок. В этом случае список выбора выведется
			с указанным заголовком.
		64	- Использовать заголовок в качестве начального значения фильтра.
			В этом случае список выбора выведется уже отфильтрованным по данному значению.
		128	- Попытаться заполнить список из активного комбобокса или листбокса
		256	- Сортировка списка
		512	- Автоширина окна (автоматически при изменении списка ширина окна подстраивается
			по текущей самой длинной строке)
		Необязательный параметр. По умолчанию 0.
		
		*/
		var vOptions = 1 /*| 4 */ | 32 ;
		if(vUserUnp) {	vOptions |= 16;        }
		if(vSort) 	 {	vOptions |= 256;        }
		retVal = gSelector.FilterValue(values.join("\r\n"), vOptions, psCaption, 0, 0, 0, 0);    
    } catch(e) {
		retVal = gSelector.FilterValue(values.join("\r\n"), 1 /*| 4 */| 32, psCaption, 0, 0, 0, 0);    
    }
   //alert(values.join("\r\n"));
   return retVal;    
}

function vTag(psIterator) {
	this.Iterator = psIterator;
	this.start = psIterator.i;
	this.end = -1;
	this.name = '';
	this.atrib = [];
	this.atribStart = [];
	this.atribEnd = [];
	this.lastAtribName = '';
	this.setName = function(psName) {
		this.name = psName;
	}
	this.addAtrib = function(psNameF) {
		this.lastAtribName = psNameF;
		this.atrib[psNameF] = '';
		this.atribStart[psNameF] = this.Iterator.i - psNameF.length;
	}
	this.setAtribData = function(psData) {
		this.atrib[this.lastAtribName] = psData;
		this.atribEnd[this.lastAtribName] = this.Iterator.i;
	}
}


function vTagAnalizer(psLine) {
	this.Tags = [];
	this.Iterator = {i: 0, line_: psLine};
	this.isChar = /[\w\dА-я]/;
	this.getChar = function (vIterator,line) {
		var ch = '';
		if(Iterator.i<line.length-1) {
			ch = line.charAt(Iterator.i);			//Iterator.i = Iterator.i + 1;
		}
		return ch;
    }	
	
	this.tagByPos  = function(psPos) {
		var rv = null;		
		var vTag = 0;
		for (var i = 0; i<this.Tags.length; i++){
			vTag = this.Tags[i];
			if (vTag.start < psPos && vTag.end >= psPos) {
				return vTag;
			}
		}
		return rv;
	}

	/* Пропустить пробелы */
	this.SkipSpaces = function(Iterator, line) {	
		var vChar = this.getChar(Iterator.i,line);
		if(vChar != '') {
			while(true) {
				if(vChar == ' ' || vChar == '\t') {
					Iterator.i = Iterator.i + 1;
					vChar = this.getChar(Iterator,line);
				} else {
					Iterator.i = Iterator.i - 1;
					return;
				}
			}
		}
		return 0;
	}

	this.testLine = function (psLine) {
    	var rv = {tagName: '', atribName: '', atribVal: ''};
		var vIterator  = {i: 0, line_: psLine};
		var line = psLine;
		
		var vCurChr = '';
		var vCurTag = '';
		var vCurIndent = '';
		var vCurString = '';
		var vCurSynPos = -1; // -1 before/after tags; 0-in tag, 1 - in tag; 2 in tag value (betwin "" and "")
		
		for(vIterator.i = 0; vIterator.i< line.length; vIterator.i++) {
			vCurChr = this.getChar(vIterator,line);
			if(vCurChr == '<' || vCurChr == '>') {
				vCurTag = new vTag(vIterator);
				vTags[vTags.length] = vCurTag;			
				if(vTags.length-2>=0) {
					vTags[vTags.length-2].end = vIterator.i;
				}
				this.SkipSpaces(vIterator, line);
				vCurSynPos = 0;
				vCurIndent = '';
			} else if(vCurSynPos == 0 || vCurSynPos == 1) {
				
				vCurChr = this.getChar(vIterator,line);
				while(isChar.test(vCurChr)){
					vCurIndent = vCurIndent + vCurChr;
					vIterator.i = vIterator.i + 1;
					vCurChr = this.getChar(vIterator,line);
				}
				if(vCurIndent != '') {
					if(vCurSynPos == 0) {
						vCurTag.setName(vCurIndent);
						vCurSynPos = 1;
					} else if(vCurSynPos == 1) {
						vCurTag.addAtrib(vCurIndent);            
					}
				}
				vCurIndent = '';
				this.SkipSpaces(vIterator, line);
				if (vCurChr	== "=") {
					this.SkipSpaces(vIterator, line);
					vIterator.i = vIterator.i+1;
					vCurChr	= this.getChar(vIterator,line);
					if (vCurChr == '"') {
						vCurSynPos = 2;
					}
				} 		
			} 
			if (vCurChr == '"') {
				vCurString = "";
				vIterator.i = vIterator.i + 1;
				vCurChr = this.getChar(vIterator,line);
				while (vCurChr != '"') {
					vCurString = vCurString  + vCurChr;
					vIterator.i = vIterator.i + 1;
					vCurChr = this.getChar(vIterator,line);
				}
				try { 
					vCurTag.setAtribData(vCurString);
				} catch(e) {
					return 0;
				}
				
				vCurSynPos = 1;			    
			}	
		}
		
    	return rv;
    }	
	this.testWiev = function() {
		var rb = '';
		var line = currentView.lines.get(view.line).text;
		line = line.replace(/[\t]/g,"    "); 
		rv = this.testLine(line);
    	return rv;
    }
}


function goToDefinitionHtml_gh(Iterator, line) {
	var ch = '';
	if(Iterator.i<line.length-1) {
		ch = line.charAt(Iterator.i);
		//Iterator.i = Iterator.i + 1;
    }
	return ch;
}

function goToDefinitionHtml_ss(Iterator, line) {
	
	var vChar = goToDefinitionHtml_gh(Iterator.i,line);
	if(vChar != '') {
		while(true) {
			if(vChar == ' ' || vChar == '\t') {
				Iterator.i = Iterator.i + 1;
				vChar = goToDefinitionHtml_gh(Iterator,line);
			} else {
				Iterator.i = Iterator.i - 1;
				return;
			}
		}
	}
	return 0;

}

function titer(psIterator) {
	var rv = '';
	psIterator.i = psIterator.i+1;
	psIterator.i = psIterator.i+1;
	psIterator.i = psIterator.i+1;
	return rv;
}

function getTagByPos(psTags, psPos) {
    var rv = null;
    var vTag = 0;
    for (var i = 0; i<psTags.length; i++){
        vTag = psTags[i];
        if (vTag.start < psPos && vTag.end >= psPos) {
            return vTag;
        }
    }
    return rv;
}

function goToFile(psCurFilePath, psLine ) {
	var line = psLine;
	if(psLine === undefined) {
		line = 0;
    }
    if (gFso.FileExists(psCurFilePath)) {
		addToHistory(); 
		open(psCurFilePath);
		try { 
			Editor.currentView.lines.current = line;
        } catch(e) {
        }
        return true;
    }
    return false;
}

// вычисляет позицицию в которой находимся в html. Доработать.
// Задумывалась для подсказки по атрибуутам.
// trdm 2019-12-09 15:17:42  
// todo.....
function goToDefinitionHtml() {
	// return 0;
	var rv = '';
	var line = currentView.lines.get(view.line).text;
	line = line.replace(/[\t]/g,"    "); 
	var vIterator = {i: 0, line_: '' }
	var vTags = [];
	vIterator.line = line;
	//titer(vIterator);	return 0;
	var isChar = /[\w\dА-я]/;
	var vCurChr = '';
	var vCurTag = '';
	var vCurIndent = '';
	var vCurString = '';
	var vCurSynPos = -1; // -1 before/after tags; 0-in tag, 1 - in tag; 2 in tag value (betwin "" and "")
	if(IntellPlus.debugMode()) {    	
		debugger;    
	}
	for(vIterator.i = 0; vIterator.i< line.length; vIterator.i++) {
		vCurChr = goToDefinitionHtml_gh(vIterator,line);
		if(vCurChr == '<' || vCurChr == '>') {
			vCurTag = new vTag(vIterator);
			vTags[vTags.length] = vCurTag;			
			if(vTags.length-2>=0) {
				vTags[vTags.length-2].end = vIterator.i;
            }
			goToDefinitionHtml_ss(vIterator, line);
			vCurSynPos = 0;
			vCurIndent = '';
        } else if(vCurSynPos == 0 || vCurSynPos == 1) {
			
			vCurChr = goToDefinitionHtml_gh(vIterator,line);
			while(isChar.test(vCurChr)){
				vCurIndent = vCurIndent + vCurChr;
				vIterator.i = vIterator.i + 1;
				vCurChr = goToDefinitionHtml_gh(vIterator,line);
            }
			if(vCurIndent != '') {
				if(vCurSynPos == 0) {
					vCurTag.setName(vCurIndent);
					vCurSynPos = 1;
				} else if(vCurSynPos == 1) {
					vCurTag.addAtrib(vCurIndent);            
				}
            }
			vCurIndent = '';
			goToDefinitionHtml_ss(vIterator, line);
			if (vCurChr	== "=") {
    			goToDefinitionHtml_ss(vIterator, line);
    			vIterator.i = vIterator.i+1;
			    vCurChr	= goToDefinitionHtml_gh(vIterator,line);
			    if (vCurChr == '"') {
			        vCurSynPos = 2;
			    }
			} 		
        } 
		if (vCurChr == '"') {
			vCurString = "";
			vIterator.i = vIterator.i + 1;
			vCurChr = goToDefinitionHtml_gh(vIterator,line);
			while (vCurChr != '"') {
				vCurString = vCurString  + vCurChr;
				vIterator.i = vIterator.i + 1;
				vCurChr = goToDefinitionHtml_gh(vIterator,line);
			}
			try { 
				vCurTag.setAtribData(vCurString);
            } catch(e) {
				return 0;
            }
			
			vCurSynPos = 1;			    
		}	
    }
    if (IntellPlus) {
		var vTagsWithSrcAtribStr = 'script,img';
		var vTagsWithSrcAtrib = vTagsWithSrcAtribStr.split(',');
		
        var vFindPath = '';
        if (IntellPlus.startColumnNo != 0) {
            vCurTag = getTagByPos(vTags, IntellPlus.startColumnNo);
			if(vCurTag != null) {            
				if (vCurTag.name == 'link') {
					vFindPath = vCurTag.atrib['href'];
				}
				if (vCurTag.name == 'script' /*|| vCurTag.name == 'img'*/) {
					vFindPath = vCurTag.atrib['src'];
				}
            }
        } else 
            return '';

        /*
        	<link rel="stylesheet" type="text/css" href="0005770_files/default.css">
        */
        var vCurFilePath = IntellPlus.curDirPath;
        if (vFindPath != '' && vCurFilePath != '') {
            var  vSpliter = '/';
            if (vFindPath.indexOf('\\') != -1) {
                vSpliter = '\\';
            } 
            var vPathArr = vFindPath.split(vSpliter);
            vCurString = vPathArr.join('\\');
            vCurFilePath += '\\'+vCurString;
            if (gFso.FileExists(vCurFilePath)) {
                goToFile(vCurFilePath);
                return true;
            }
            
        } 
    }
	return rv;
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


function attemptToMoveToFile() {
	var rv = false;
	var vFileNmFind = '';
	var vCurLine = IntellPlus.currentLine;
	if(IntellPlus.debugMode()) {    	debugger;    }
	/*
	 for php:	 view.php-> 
	 include ( 'bug_view_inc.php' );
	 include 'bug_view_inc.php' ;
	 require_once( 'core.php' );
	 require( 'core.php' );
	 require  'core.php' ;
	*/
	var re1 = /include|require|require_once/ig;
	var re2 = /(\'(.*)\')|(\"(.*)\")/;
	if(IntellPlus.isPhp()) {		
		if(re1.test(vCurLine)) {
			//message('attemptToMoveToFile: re1.test = true');
			var vMatch = re2.exec(vCurLine);
			if(vMatch) {
				vFileNmFind = vMatch[0];
				vFileNmFind = vFileNmFind.replace('\'','');				vFileNmFind = vFileNmFind.replace('\'','');
				vFileNmFind = vFileNmFind.replace('\"','');				vFileNmFind = vFileNmFind.replace('\"','');
				//message(vFileNmFind);
			}
		}
   } else if(IntellPlus.curExtension == 'c' || IntellPlus.curExtension == 'cpp' || IntellPlus.curExtension == 'h') {
	   //#include "general.h" | #include <string.h>
        var re3 = /(#include\s([\"\.a-zA-Z0-9_<>\/\\]+))/ig;
        re3 = /(#include\s([\"\.a-zA-Z0-9_\<\>\/\\]+))/ig;
        var re4has = /^#include\s</.test(vCurLine);
	    var vMatch = re2.exec(vCurLine);
	    if(vMatch) {
				
				vFileNmFind = vMatch[0];
				vFileNmFind = strBetween(vFileNmFind,'"', '"');
				/*
				vFileNmFind = vFileNmFind.replace('\'','');				vFileNmFind = vFileNmFind.replace('\'','');
				vFileNmFind = vFileNmFind.replace('\"','');				vFileNmFind = vFileNmFind.replace('\"','');
				*/
				//message(vFileNmFind);
			} else if (re4has) {
			    vFileNmFind = strBetween(vCurLine,'<', '>');
				//message(vFileNmFind);
			}
			
	   
   } else if(IntellPlus.curExtension == 'txt') {
		var vCurView = Editor.currentView;
		if(vCurView.lines.count > 0) {
			// vCurView.lines.get(1).text.indexOf('_TAG_FILE_FORMAT')	-1	Number
			// vCurView.lines.get(0).text	"!_TAG_FILE_FORMAT	2	/extended format; --format=1 will not append ;" to lines/

			var vLine, vFirstLine = ''+vCurView.lines.get(0).text;	//  currentView.lines.get(currentView.lines.current); 
			if(vFirstLine.indexOf('_TAG_FILE_FORMAT') != -1) {
				vLine = IntellPlus.currentLine;
				var vLineAra = vLine.split('\t');	//	message('stags file..');
				if(vLineAra.length > 2) {
					vLine = vLineAra[1];
					vLine = vLine.split('\\\\').join('\\');
					return goToFile(vLine, parseInt(vLineAra[2])); // message('vLine = '+vLine);
                
                }
			}
		}
		return true;
	}

	if(vFileNmFind.length > 0) {
		rv = true;
		var gFso = new ActiveXObject("Scripting.FileSystemObject");
		var vFileNmFindFull = vFileNmFind;
		if (IntellPlus.curDirPath)
		    vFileNmFindFull = IntellPlus.curDirPath+vFileNmFindFull;
		var vFolder = gFso.GetFolder(IntellPlus.curDirPath);
		if(gFso.FileExists(vFileNmFindFull)) {
			var vFileObj = gFso.GetFile(vFileNmFindFull);			
			addToHistory(); 
			open(vFileObj.Path);     
		} else {
			var vFolder = gFso.GetFolder(IntellPlus.curDirPath);
			var fc = new Enumerator(vFolder.SubFolders);
			for (fc.moveFirst(); !fc.atEnd(); fc.moveNext()) {
				vFolder = fc.item();
				vPathFolder = vFolder.Path;
				if(vPathFolder[vPathFolder.length] != '\\') {
					vPathFolder += '\\';
                }
				vFileNmFindFull = vPathFolder + vFileNmFind;
				if(gFso.FileExists(vFileNmFindFull)) {
					addToHistory(); 
					open(vFileNmFindFull);     
					break;                
                } else {
					vFileNmFindFull = '';
				}
				
			}
			if(vFileNmFindFull == '') {
				message('File: '+vFileNmFind+' - NOT FOUND!');            
            }
		}
    }
	
	return rv;
}

function testHtmlDef() {
	var rv = '';
	IntellPlus.init();
	if(IntellPlus.debugMode()) {    	debugger;    }
	if (IntellPlus.curLang == 'html' || IntellPlus.curLang == 'htm' || IntellPlus.curLang == 'php'){
        goToDefinitionHtml(); 
	}
	return rv;
}

// F12
function goToDefinition() {
	var sucsess  = false;
	IntellPlus.init();
	if(IntellPlus.debugMode()) {    	debugger;    }
    var word = getWordUnderCursor(Editor.currentView);
    if (word == '') {
		sucsess = attemptToMoveToFile(); //canFileJump
		return;
	}
	var localParsing = true;
	var parseUpToDown = 1; // сверху вниз
	var parseCurToUp = -1; // c текущей строки и вверх
	var parseStrategy = parseUpToDown;
	var isC_Cpp = false;
	var isVbs = false;
	var isJs = false;
	// оптимизадница
	if(IntellPlus.curLang == 'c' || IntellPlus.curLang == 'cpp') {
		//localParsing = false;
		isC_Cpp = true;
    } else if(IntellPlus.curLang == 'vbs') {
		isVbs = true;    
    } else if (IntellPlus.curLang == 'html' || IntellPlus.curLang == 'htm' || IntellPlus.curLang == 'php'){
        if (goToDefinitionHtml())
            localParsing = false;
    } else {
		isJs = true;
	}
	
	sucsess = attemptToMoveToFile(); //canFileJump
	if(sucsess) {
		return;
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
		re.push(new RegExp('\\s+' + word + '\\s*[,;=]\s+','i')); 
		// trdm  {
		if(isVbs) {
			re.push(new RegExp('\\s*function\\s+' + word  + '\\s*\\(','i'));
			re.push(new RegExp('\\s*sub\\s+' + word  + '\\s*\\(','i'));
			re.push(new RegExp('set\\s+' + word + '\\s*[,;=]','i'));
			re.push(new RegExp('dim\\s+' + word + '\\s*','i')); 
			re.push(new RegExp('class\\s+' + word + '\\s*','i')); 
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
			if(text.indexOf(word) == -1) {	continue;	}
			if(isJs || isC_Cpp) {
				text = killComment(text);
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

function addToHistory_print(){
	if(!JUMP_HISTORY.length) { return; }
	message('History_print');
	for(var i = 0; i<JUMP_HISTORY.length; i++) {
		var pos = JUMP_HISTORY[i];
		var vRow = '______'+pos.row; vRow = vRow.substr(-6);
		var vLine = vRow+'\t'+pos.file+''
		message(vLine);
    }	
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
	//addToHistory();	// раскоментировал 	// trdm 2019-12-25 20:40:59  
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



var testHtmlDefItem = {
    text: "testHtmlDef\tCtrl+T",    
	ctrl: true,    shift: false,   alt: false,
    key: 0x54, // T
    cmd: testHtmlDef
};

/*System.*/addHotKey(testHtmlDefItem);
scriptsMenu.addItem(testHtmlDefItem);


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


var addToHistory_printItem = {
    text: "addToHistory..print", 
    cmd: addToHistory_print
};
scriptsMenu.addItem(addToHistory_printItem);

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