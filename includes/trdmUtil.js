/* —кладывает минуты в форме: 
15, 2.20, 20, 25 = 3.20 где 3,20 - 3 часа, 20 минут
35, 50, 40, 55, 45, 40
*/
//(c)trdmval@gmail.com 2017-12-28 11:23:09
function timeAddition()
{
	var selTextOrig,selText = "15, 2.20, 20, 25";// Editor.currentView.selection;
	selTextOrig = Editor.currentView.selection;
	selText = selTextOrig;
	selText = selText.replace("+",",");
	while(selText.indexOf("+")!= -1) {
		selText = selText.replace("+",",");
    	// break; continue;
    }
	var arr = new Array;
	arr = selText.split(",");
//debugger;
	
	var result = 0;
	var tmS = "";
	var i = 0;
	var parseRes = 0;
	var itemN = 0;
	for (i = 0; i<arr.length; i++ ) {
		itemN = arr[i];
		itemN = itemN.replace(/\s+/,'');
		if(itemN == "") {
			continue;
        }
		tmS = arr[i].split(".");
		if (tmS.length == 1) {
			parseRes = parseInt(tmS[0]);
			if(parseRes < 5) {
				parseRes *= 60;
            }
		} else {
			parseRes = parseInt(tmS[0])*60 + parseInt(tmS[1]);
		}
		result +=  0 + parseRes;
	}
	if (result <= 0) {
		alert("Нужно выделить числа, типа: 15, 2.45, 20, 25")
	}
		
	var resultH = (result / 60);
	tmS = (""+resultH).split(".")[0];
	resultH = (result % 60);
	if(resultH<10) {
		resultH = '0'+resultH;
    } else {
		resultH = resultH + "000";
		resultH = resultH.substring(0,2);
    }
	tmS = tmS + "."+resultH;
	IntellPlus.init();
	//IntellPlus.currentLineSrc

	//debugger;
	vText = "Time addition(2.45+20 = 3.05)\tCtrl+Shift+D";
	//2.45+20,3.05 = 6.10 
	// если выделение - это последний фрагмент в строке, то в принципе можно добавить к строке " = "+tmS
	var vCurLineTxt = IntellPlus.currentLineSrc;
	vCurLineTxt = trimRight(vCurLineTxt);
	var selTextOrig2 = trimRight(selTextOrig);
	if(strEndWithThis(vCurLineTxt, selTextOrig)) {
		Editor.currentView.selection = selTextOrig + " = "+tmS;
    }
	EditorMessage(selText+" = " + tmS);
	result = parseFloat(tmS);
}
jN.scriptsMenu = (!jN.scriptsMenu) ? {} : jN.scriptsMenu;
scriptsMenu = jN.scriptsMenu; // глобальная переменная с меню скриптами.

var myTimeAdditionItem = {
    text: "Time addition(2.45+20 = 3.05)\tCtrl+Shift+D", 
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x44, // "I"
    cmd: timeAddition
};
scriptsMenu.addSeparator();
addHotKey(myTimeAdditionItem); scriptsMenu.addItem(myTimeAdditionItem);

function typeSymbol( psSymb ) {	Editor.currentView.selection = psSymb; }
function addHotSym(psFu, psKey) {
	var rv = {
		ctrl: false,
		shift: false,
		alt: true,
		key: psKey, // "I"
		cmd: psFu
	};
	addHotKey(rv);	// Различные клавиши <>
}

// Ввоод символов в русской раскладке схема Alt+' >> ' ; Alt+$ >> $. Можно не переключать раскладку.
function typeSymbol_1() {	typeSymbol( '<' );} addHotSym(typeSymbol_1,0xBC);
function typeSymbol_3() {	typeSymbol( '\'' );} addHotSym(typeSymbol_3,0xDE);
function typeSymbol_2() {	typeSymbol( '>' );} addHotSym(typeSymbol_2,0xBE);
function typeSymbol_4() {	typeSymbol( '~' );} addHotSym(typeSymbol_4,0xC0);
function typeSymbol_5() {	typeSymbol( '$' );} addHotSym(typeSymbol_5,0x34);//$
function typeSymbol_6() {	typeSymbol( '#' );} addHotSym(typeSymbol_6,0x33); //#########
function typeSymbol_7() {	typeSymbol( '|' );} addHotSym(typeSymbol_7,0xDC); //
function typeSymbol_8() {	typeSymbol( '[' );} addHotSym(typeSymbol_8,0xDB); //
function typeSymbol_9() {	typeSymbol( ']' );} addHotSym(typeSymbol_9,0xDD); //
function typeSymbol_10() {	typeSymbol( '\'' );} addHotSym(typeSymbol_10,0xDE); //

function calcNoWhiteSpaceSymbolsCount() {
	//debugger;
	var rv = 0;
	var text = Editor.currentView.text;
	var lenOld = text.length;
	while(text.indexOf(' ') != -1) {
    	text = text.replace(' ', '');
    }
	var lenNew = text.length;
	view = Editor.currentView;
	curPathFile = view.files[view.file];
	
	var messStr = ''+curPathFile+'\nLength with space: '+lenOld+' ch. \nLength without space: '+lenNew +' ch.';
	message(messStr);
	alert(messStr);	
	return rv;
}

var myLengthCounterProc = {
    text: "Length counter\tCtrl+Shift+N", 
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x4E, // "I"
    cmd: calcNoWhiteSpaceSymbolsCount	
}

//scriptsMenu.addSeparator();
addHotKey(myLengthCounterProc); 
scriptsMenu.addItem(myLengthCounterProc);

function translateString(psStr, psCase) {
	var rv = psStr;
	return rv;
}
var qChar = {
	m_char : '' //данные
	, init : function(psChar) {
		this.m_char = psChar;
	}
	, isDigit : function(psChar){
		var ch = psChar;
		if(!ch) {
			ch = this.m_char;        
        }
		if(ch.length != 1) {
			return false;        
        }
		ch = ch.charAt(0);
		if('0' >= ch && '9' <= ch ) {
			return true;
        }
		return false;        
		
	}
	, isLower : function(psChar) {
		var rv = false;
		var vLine = psChar;
		vLine = trimSimple(vLine);
		if(vLine.length == 0) {
			return false;
        }
		var ch1 = vLine.charAt(0);
		var ch2 = ch1;
		ch2 = ch2.toUpperCase();
		if(ch1 != ch2) {
			rv = true;
        }
		return rv;
	}
	, isUpper : function(psChar) {
		var rv = false;
		var vLine = psChar;
		vLine = trimSimple(vLine);
		if(vLine.length == 0) {
			return false;
        }
		var ch1 = vLine.charAt(0);
		var ch2 = ch1;
		ch2 = ch2.toLowerCase();
		if(ch1 != ch2) {
			rv = true;
        }
		return rv;
	}
}

// Ctrl+Shift+A - свободен
function MergeLinesIntoParagraphs() {
	var rv = '';
	if(IntellPlus.debugMode()) { debugger;    }
	
	var curView = Editor.currentView;
	var selText = curView.selection;
	var newSelText = selText;
	if(selText.length == 0) {
		return;
    }
	var selTextAra = selText.split('\n');
	var vLine = '';
	var vChar = '', vCharU = '';
	var vbNewLine = false;
	for(var i = 0; i< selTextAra.length; i++) {
		vLine = selTextAra[i];
		vLine = trimSimple(vLine);
		vLine = vLine.replace('\r','');
		if(i == 0) {
			newSelText = vLine;
			continue;
        }
		vLine = trimRight(vLine);
		if(vLine.length == 0) {
			continue;        
        }
		
		vbNewLine = false;
		
		vChar = vLine.charAt(vLine.length - 1);
		if(vChar == '.' || vChar == ';') {
			newSelText += " ";
			newSelText += vLine;
			if(i < selTextAra.length-1) {
				newSelText += '\n';
            }
        } else {
			newSelText += " ";
			newSelText += vLine;
		}
		
    }
	newSelText += '\n';
	//newSelText = "" + vCbArray[0] + selText + vCbArray[1];
	if(curView.selection != newSelText) {
		curView.selection = newSelText
    }
	return rv;
	

/** Объедините строки в абзацы. >> Merge lines into paragraphs.
        txt_end = txt;
        QStringList list = txt_end.split("\n");
        int cnt = list.count();
        QString resStr, curStr;
        QChar charItem;
        bool newLine = false;

        if (cnt > 0) {
            resStr = list.at(0);
            for (int i=1; i<cnt; i++){
                curStr = list.at(i);
                newLine = false;

                if (curStr.length()>0){
                    charItem = curStr.at(0);
                    newLine = charItem.isDigit() || charItem.isSpace() || (charItem.isLetter() && charItem.isUpper());
                }
                if (newLine){
                    resStr.append("\n");
                } else {
                    resStr.append(" ");
                }
                resStr.append(curStr);
            }
        }

*/	
}

var myMergeLinesIntoParagraphs = {
    text: "Объедините строки в абзацы\tCtrl+Shift+A", 
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x41, // "I"
    cmd: MergeLinesIntoParagraphs	
}

//scriptsMenu.addSeparator();
addHotKey(myMergeLinesIntoParagraphs); 
scriptsMenu.addItem(myMergeLinesIntoParagraphs);

// trdm 2019-10-19 18:20:37  
function processAllTextRule001() {	
	var curView = Editor.currentView;
	var vAllText = curView.text;	
	var vArrLines = vAllText.split('\n');
	vAllText = '';
	var vLine = '';
	for(var i = 0; i<vArrLines.length; i++) {
		vLine = vArrLines[i];
		vLine = trimSimple(vLine);
		if(vLine.length == 0) {
			continue;
        }
		if(vAllText.length == 0) {
			vAllText = vLine;
        } else {
			vAllText = vAllText + ' > '+ vLine;
		}		
    }
	if(vAllText.length > 0) {
		curView.text = vAllText;
    }
}

var myProcessAllTextRule001 = {
    text: "Объединить текст в строку \tCtrl+Shift+P", 
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x50, // "P"
    cmd: processAllTextRule001	
}

//scriptsMenu.addSeparator();
addHotKey(myProcessAllTextRule001); 
scriptsMenu.addItem(myProcessAllTextRule001);

// trdm 2019-12-17 11:10:32 
function filterTextBySelection() {	
	var curView = Editor.currentView;
	var vAllText = curView.text;	
	var vSelectionTxt = Editor.currentView.selection;
	if(vSelectionTxt.length == 0) {
		return;
    }
	/*
	alert(vSelectionTxt);
	return; 
	*/
	
	var vArrLines = vAllText.split('\n');
	
	vAllText = '';
	var vLine = '';
	for(var i = 0; i<vArrLines.length; i++) {
		vLine = vArrLines[i];
		vLine = trimSimple(vLine);
		if(vLine.length == 0) {
			continue;
        }
		if(vLine.indexOf(vSelectionTxt) == -1) {
			continue;
        }
		vLine += '\n';
		vAllText = vAllText + vLine;
    }
	if(vAllText.length > 0) {
		curView.text = vAllText;
    }
	message('Filter text by selection: "'+vSelectionTxt+'"');

}



var myfilterTextBySelection= {
    text: "Отфильтровать текст по выделению \tCtrl+Shift+L", // L
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x4C, // "L"
    cmd: filterTextBySelection	
}

//scriptsMenu.addSeparator();
addHotKey(myfilterTextBySelection); 
scriptsMenu.addItem(myfilterTextBySelection);

var myTestSCI_Hot = {
    text: "Отфильтровать текст по выделению \tCtrl+Shift+L", // L
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x4C, // "L"
    cmd: filterTextBySelection		
}

function cheskFindResult() {
	if(IntellPlus.debugMode()) { debugger;  }
	var curView = Editor.currentView;
	var vAllText = curView.text;	
	var vRetVal = '';
	var vAllTextArr = vAllText.split('\n');
	var vStr = '', vStr2, vStrArr;
	for(var i = 0; i< vAllTextArr.length; i++) {
		vStr = vAllTextArr[i];
		if(vStr.indexOf(':') == -1) {
			continue;
        }
		vStrArr = vStr.split('.');
		if(vStrArr.length > 2) {
			vStr2 = vStrArr[0]+'.'+vStrArr[1];
			if(vStr.indexOf('гИдентОтчетаВМетаданных') != -1) { 
				message(vStr);            
            }
			if(vStr.indexOf('"'+vStr2+'"') == -1) {
            }        
        }
    }	
	return vRetVal;
}

// trdm 2020-02-09 21:00:36 
function replaceLink() {
	if(IntellPlus.debugMode()) { debugger;  }
	var curView = Editor.currentView;
	var vAllText = curView.text;	
	var vReg = /(<a\s+href\s*="(http[^"]+)">)/;
	var vMathes = vReg.exec(vAllText);
	//	var reRe = re.exec(retVal);
    var vPgStartNo = 20;
    var vPgName = 'pg0002.html';
	while (vMathes != null) {
		var vRes1 = vMathes[0], vRez2 = vMathes[0];
		vPgName = 'pg00'+vPgStartNo+'.html';
		vRes1 = vRes1.replace(vMathes[2],vPgName);
		
		vAllText = vAllText.replace(vMathes[0],vRes1);
		//re = /(\/\*([\s\S]*?)\*\/)/igm; // нужно переинициализировать почему? флаг?
		vMathes = vReg.exec(vAllText);
		vPgStartNo++;
	}
	
	curView.text = vAllText;	
	return true;
}

function testSquareOpenBracket() {
	var rv = '';
	message('testSquareBracket - Ok');
	return rv;
}
var myTestSquareBracketItem = {
    text: "Тест квадратной скодки \tCtrl+[", // L
    ctrl: true,
    shift: false,
    alt: false,
    key: 0xDB, // "[{"
    cmd: cheskFindResult //replaceLink	
}
scriptsMenu.addSeparator();
addHotKey(myTestSquareBracketItem); 
scriptsMenu.addItem(myTestSquareBracketItem);

/*
VK_OEM_4 0xDB - Used for miscellaneous characters; it can vary by keyboard. For the US standard keyboard, the '[{' key
VK_OEM_5 0xDC - Used for miscellaneous characters; it can vary by keyboard. For the US standard keyboard, the '\|' key
VK_OEM_6 0xDD - Used for miscellaneous characters; it can vary by keyboard. For the US standard keyboard, the ']}' key
*/

