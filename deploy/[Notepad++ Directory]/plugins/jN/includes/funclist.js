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
addSearchPattern(/^\s*function\s+([\w\dА-я]+)/, 1, 0);
addSearchPattern(/^\s*([\w\dА-я]+)\.prototype\.([\w\dА-я]+)\s*=\s*function\s*/, 2, 1);
addSearchPattern(/^SelfScript\.self\[[\'\"](.+?)[\'\"]\]\s*=\s*function/i, 1);
addSearchPattern(/^\s*sub\s+([\w\dА-я]+)/i, 1, 0); // trdm 


var JUMP_HISTORY = new Array();

// +trdm {
function trim( str, charlist ) {	// Strip whitespace (or other characters) from the beginning and end of a string
	// 
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: mdsjack (http://www.mdsjack.bo.it)
	// +   improved by: Alexander Ermolaev (http://snippets.dzone.com/user/AlexanderErmolaev)
	// +	  input by: Erkekjetter
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)

	charlist = !charlist ? ' \s\xA0' : charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\$1');
	var re = new RegExp('^[' + charlist + ']+|[' + charlist + ']+$', 'g');
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
	var tagTypeList = 'script,form,img,meta,table,style,head,body,div,ul'.split(',');
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

function listFunctions () {

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
   return sel.FilterValue(values.join("\r\n"), 1 /*| 4 */| 512, '', 0, 0, 0, 0);    
}

function goToDefinition() {
    
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

    var wordBegPos = pos.beginCol - 1;
    
    if (!isChar.test(line.charAt(wordBegPos)))
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

////////////////////////////////////////////////////////////////////////////////////////
//{ StartUp

var scriptsMenu = Editor.addMenu("Скрипты");

// Виртуальные коды клавиш см. по ссылке: http://msdn.microsoft.com/en-us/library/dd375731(VS.85).aspx


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