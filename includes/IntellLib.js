var gIntell_engLetersAll = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
var gIntell_rusLetersAll = "йцукенгшщзхъфывапролджэячсмитьбюЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ";


// trdm 2018-12-25 08:11:41 
function indexOfArray(psStr, psAra) {
	var rv = -1;
	var vItem = "";
	for(var i = 0; i<psAra.length; i++) {
		vItem = psAra[i];
		vPos = psStr.indexOf(vItem);
		if(vPos != -1) {
			return i;
        }
    }
	return rv;
}

// trdm 2020-01-21 11:50:29  
function arrayContains(psArray, psItem) {
	var rv = false;
	for(var i = 0; i< psArray.length; i++) {
		if(psArray[i] == psItem) {
			return true;
        }
    }
	return rv;
}

// trdm 2018-12-25 08:32:01 
// Возвращает первое вхожжение элемента из массива в строку
function strContainsI(psSrc, psAra, psICase) {
	var rv = "";
	var vItem = "";
	var vSrc = psSrc;
	if(psICase) {
		vSrc = vSrc.toLowerCase();
    }
	
	for(var i = 0; i<psAra.length; i++) {
		vItem = psAra[i];
		if(psICase) {
			vItem = vItem.toLowerCase();       
        }
		vPos = vSrc.indexOf(vItem);
		if(vPos != -1) {
			return vItem;
        }
    }
	return rv;
}
function strContains(psSrc, psAra) {
	return strContainsI(psSrc, psAra, false);
}

// trdm 2018-12-25 08:11:41 
function indexOfArrayBool(psStr, psAra) {
	var rv = indexOfArray(psStr, psAra);
	if(rv != -1) {
		return true;
    }
	return false;	
}

// trdm 2018-12-25 08:11:41 
function strRightFrom(psSrc, psFragm) {
	var rv = psSrc;
	var vPos = psSrc.indexOf(psFragm);
	if(vPos != -1) {
		vPos += psFragm.length;
		rv = rv.substring(vPos);
    }
	return rv;
}

// trdm 2018-12-25 08:11:41 
function strLeftFrom(psSrc, psFragm) {
	var rv = psSrc;
	var vPos = psSrc.indexOf(psFragm);
	if(vPos != -1) {
		rv = rv.substring(0,vPos);
    }
	return rv;
}

function strBetween(psSrc, psLeft, psRight) {
	var rv = psSrc;
	rv = strRightFrom(rv, psLeft);
	rv = strLeftFrom(rv, psRight);
	return rv;
}

//	ends with this - заканчивается этим
function strEndWithThis(psStrSrc, psEnd) {
	var vRetVal = false;
	var vLastIdx = psStrSrc.lastIndexOf(psEnd);
	if(vLastIdx != -1) {
		var vTl = vLastIdx + psEnd.length;
		if(psStrSrc.length == vTl) {
			var vRetVal = true;
        }
    }	
	return vRetVal;
}
// var vTestStr = "Процедура ПроверитьОбновлениеАдресныхОбъектов() Экспорт";
// var vResStr = strBetween(vTestStr,"Процедура","(");
// message(vResStr);

function test1() {
	var vTestStr = "Процедура ПроверитьОбновлениеАдресныхОбъектов() Экспорт";	
	
	var vResStr = rightFrom(vTestStr,"Процедура");
	message(vResStr);
	vResStr = leftFrom(vResStr,"(");
	message(vResStr);
	
	vTestStr = "Процедура ПроверитьОбновлениеАдресныхОбъектов() Экспорт";	
	vResStr = strBetween(vTestStr,"Процедура","(");
	message(vResStr);
	vResStr = leftFrom(vResStr,"(");
	message(vResStr);
}
