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

(function() {

var PATTERNS = new Array;
addSearchPattern(/\s*function\s+([\w\dА-я]+)/i, 1, 0);
addSearchPattern(/\s*([\w\dА-я]+)\.prototype\.([\w\dА-я]+)\s*=\s*function\s*/i, 2, 1);
addSearchPattern(/SelfScript\.self\[[\'\"](.+?)[\'\"]\]\s*=\s*function/i, 1);
addSearchPattern(/\s*sub\s+([\w\dА-я0-9]+)/i, 1, 0); // trdm|vbs
addSearchPattern(/\s*[\w\dА-я]+\s+([\w\dА-я]+[\:]{2,2}[\w\dА-я]+[\(]+)/i, 1, 0); // trdm|c++.cpp: "retType className::funcName("


var JUMP_HISTORY = new Array();

// +trdm {
function trim( str, charlist ) {	// Strip whitespace (or other characters) from the beginning and end of a string
	// 
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: mdsjack (http://www.mdsjack.bo.it)
	// +   improved by: Alexander Ermolaev (http://snippets.dzone.com/user/AlexanderErmolaev)
	// +	  input by: Erkekjetter
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)

	/*
	charlist = !charlist ? " \s\xA0" : charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\$1');
	charlist = (charlist == " s ") ? ' \s\xA0' : charlist; // " s " - совсем не устраивает
	
	var re = new RegExp('^[' + charlist + ']+|[' + charlist + ']+$', 'g');
	*/
	// trim("trdms") = trdm //WTF?????
	var re = new RegExp("^[\\s]+|[\\s]+$", 'g');
	return str.replace(re, '');
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
    
    var selScri = selectValue(scrList);
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
	var tagType = selectValue(tagTypeList);
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
		
		var selScri = selectValue(tagList);
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
	//debugger;

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
    
    var selFunc = selectValue(funcList);
    if (selFunc) 
        goToLine(funcLines[selFunc]);
        
}

function checkForFuncDef(line) {
    function g(i, m) { return i && m.length > i ? m[i] : ''; }

    for(var i=0; i<PATTERNS.length; i++) 
    {        
        var pattern = PATTERNS[i];
        var matches = line.match(pattern.re);
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

function selectValue(values) {
    try
    {
        var sel = new ActiveXObject('Svcsvc.Service')
    }
    catch(e)
    {
        alert("Не удалось создать объект 'Svcsvc.Service'. Зарегистрируйте svcsvc.dll");
        return false;
    }
   //alert(values.join("\r\n"));
   return sel.FilterValue(values.join("\r\n"), 1 /*| 4 */| 32, '', 0, 0, 0, 0);    
}

function goToDefinition() {
    //debugger;
    var word = getWordUnderCursor(Editor.currentView);
    if (word == '') return;
    
    var re = new Array(); 	
    re.push(new RegExp('\\s*function\\s+' + word  + '\\s*\\(')); //js
    re.push(new RegExp('\\s*[\\w\\dА-я]+\\.prototype\\.' + word + '\\s*=\\s*function\\s*\\('));
    re.push(new RegExp('var\\s+' + word + '\\s*[,;=]')); 
	// trdm  {
    re.push(new RegExp('\\s+' + word + '\\s*[,;=]','i')); //vbs
    re.push(new RegExp('set\\s+' + word + '\\s*[,;=]','i')); //vbs
    re.push(new RegExp('dim\\s+' + word + '\\s*','i')); 
	// trdm  }

    var lines = Editor.currentView.lines;
    for (var lineNo=0; lineNo<lines.count; lineNo++)
    {
        for (var reNo=0; reNo<re.length; reNo++)
        {
            var text = lines.get(lineNo).text;
            if (re[reNo].exec(text))
            {
                // Позиционируемся на нужную строку.
                goToLine(lineNo);
                
                // Позиционируемся на нужном слове.
                var col = text.search(word);
                if (col > -1)
                    setCaretPosInLine(Editor.currentView.lines.get(lineNo).start + col);
                return;
            }
        }
    }    
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

function goToLine(lineNo, doNotRemember) {

    // Запомним текущую строку в истории переходов, 
    // чтобы иметь возможность вернуться назад.
    if (!doNotRemember)
        JUMP_HISTORY.push( { row: Editor.currentView.line, col: Editor.currentView.pos } );

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
}

function setCaretPosInLine(pos) {
    Editor.currentView.anchor = pos;
    Editor.currentView.pos = pos;
}

function jumpBack() {
    if (JUMP_HISTORY.length)
    {
        var pos = JUMP_HISTORY.pop();
        goToLine(pos.row, true);
        setCaretPosInLine(pos.col);
    }
}

// trdm
function myPutnoSwitcher() {
	var selText = Editor.currentView.selection;
	var en = " qwertyuiop[]asdfghjkl;'zxcvbnm,..QWERTYUIOP[]ASDFGHJKL;'ZXCVBNM,./";
	var ru = " йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ.";
	var word = "";
	for (i = 0; i<selText.length; i++ ) {
		cChar = selText.charAt(i);
		pos = en.indexOf(cChar);
		if (pos != -1) {
			cChar = ru[pos];
		}
		word = word + cChar; 
	}
	Editor.currentView.selection = word;
	//фдуке(word);
}
function formatN(num, len) {
	var retVal = "00000000" + num;
	return retVal.substr(retVal.length-len);
	//return retVal.substr(-len); // <-так не работает.
}
// 2017-11-17 14:52:19
// formatData(Today,'yyyy-MM-dd HH:mm:ss');
function formatData(data, fmString) {
	//debugger;
	var retVal = fmString;
	var re = /(dd|MMMM|MM|yyyy|yy|hh|HH|mm|ss|tt|S)/g;
	var monsArr = new Array("январь,февраль,март,апрель,май,июнь,июль,август,сентябрь,октябрь,ноябрь,декабрь");
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

// (c) trdm : trdmval@gmail.com 2017-11-17 14:52:19
function myTemplaterF(selText) {
	vSelText = selText.toLowerCase();
	switch(vSelText){
		case "datetime":
		case "датавремя":
			var Today = new Date();
			selText = formatData(Today,'yyyy-MM-dd HH:mm:ss');
			break;
		case "time":
		case "время":
			var Today = new Date();
			selText = formatData(Today,'HH:mm:ss');
			break;
		case "date":
		case "дата":
			var Today = new Date();
			selText = formatData(Today,'yyyy-MM-dd');
			break;
		case "trdms": // простой trdm :)
			var Today = new Date();
			selText = "//trdm: " + formatData(Today,'yyyy-MM-dd HH:mm:ss');			
			break;
		case "trdm":
			var Today = new Date();
			selText = "//(c)trdm:trdmval@gmail.com " + formatData(Today,'yyyy-MM-dd HH:mm:ss');
			break;
		default: {
				break;
		};			
	}
	return selText;	
}

function myTemplateList() {
	var tList = new Array();
	tList.push("trdm","trdms","date","time","datetime","дата","время","датавремя");
	word = selectValue(tList);
	if (word !== 0) {
		Editor.currentView.selection = word;
	}
}

function myTemplater() {
	//debugger;
	var selText = Editor.currentView.selection;
	selText = trim(selText);
	selText = myTemplaterF(selText);
	Editor.currentView.selection = selText;
}
////////////////////////////////////////////////////////////////////////////////////////
//{ StartUp

var scriptsMenu = Editor.addMenu("Скрипты");
jN.scriptsMenu = scriptsMenu;

// Виртуальные коды клавиш см. по ссылке: http://msdn.microsoft.com/en-us/library/dd375731(VS.85).aspx
//{
var myPutnoSwitcherItem = {
    text: "Putno switcher\tF6", 
    ctrl: false,
    shift: false,
    alt: false,
    key: 0x75,
    cmd: myPutnoSwitcher
};

addHotKey(myPutnoSwitcherItem);
scriptsMenu.addItem(myPutnoSwitcherItem);

var myTemplaterItem = {
    text: "Templater\tShift+F12", 
    ctrl: false,
    shift: true,
    alt: false,
    key: 0x7B,
    cmd: myTemplater	
}
addHotKey(myTemplaterItem);
scriptsMenu.addItem(myTemplaterItem);

	
//}

//{ Список функций 
var listFunctionsItem = {
    text: "Список функций\tCtrl+1", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x31,
    cmd: listFunctions
};

/*System.*/addHotKey(listFunctionsItem);
scriptsMenu.addItem(listFunctionsItem);
//} Список функций

//{ Перейти к определению
var goToDefinitionItem = {
    text: "Перейти к определению\tF12", 
    ctrl: false,
    shift: false,
    alt: false,
    key: 0x7B,
    cmd: goToDefinition
};

/*System.*/addHotKey(goToDefinitionItem);
scriptsMenu.addItem(goToDefinitionItem);
//} Перейти к определению

//{ Вернуться назад
var jumpBackItem = {
    text: "Вернуться назад\tCtrl+-", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0xBD,
    cmd: jumpBack
};

/*System.*/addHotKey(jumpBackItem);
scriptsMenu.addItem(jumpBackItem);
//} Вернуться назад

// trdm {
var gotoAnyHtmlTagItem = {
    text: "Перейти к тегу на выбор\tCtrl+2", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x32,
    cmd: gotoAnyHtmlTag
};
addHotKey(gotoAnyHtmlTagItem);
scriptsMenu.addItem(gotoAnyHtmlTagItem);


var listScriptsItem = {
    text: "Список тегов script\tCtrl+3", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x33,
    cmd: listScripts
};
addHotKey(listScriptsItem);
scriptsMenu.addItem(listScriptsItem);
// trdm }



//} StartUp

})();