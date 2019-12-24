if (!jN.scriptsMenu){
	var scriptsMenu = Editor.addMenu("—крипты");
	jN.scriptsMenu = scriptsMenu;
} else {
	scriptsMenu = jN.scriptsMenu;
}
// +trdm {
function trim( str, charlist ) {	// Strip whitespace (or other characters) from the beginning and end of a string
	var re = new RegExp("^[\\s]+|[\\s]+$", 'g');
	return str.replace(re, '');
}

function reQuerty(psString) {
	var rv = psString;
	var en_crs = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
	var ru_crs = "йцукенгшщзхъфывапролджэячсмитьбюЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ";
	
	var ru = " йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ.";
	var en = " qwertyuiop[]asdfghjkl;'zxcvbnm,..QWERTYUIOP[]ASDFGHJKL;'ZXCVBNM,./";
	
	var conv_fr = en;
	var conv_to = ru;
	
	var lenMin = en_crs.length;
	if(lenMin > ru_crs.length) {
		lenMin = ru_crs.length;
    }
	
	for (i = 0; i<rv.length; i++ ) {
		cChar = rv.charAt(i);
		pos = ru_crs.indexOf(cChar);
		if (pos != -1) {
			conv_fr = ru;
			conv_to = en;
			break;
		}		
    }
	var word = "";
	for (i = 0; i<rv.length; i++ ) {
		cChar = rv.charAt(i);
		pos = conv_fr.indexOf(cChar);
		if (pos != -1) {
			cChar = conv_to[pos];
		}
		word = word + cChar; 
	}
	
	return word;
}
 
	
// undefinedundefinedundefinedundefinedundefined: 2018-01-16 23:15:29 
// 'Ghbdtn' >> "Привет" или "Привет" >> "Ghbdtn" в зависимости от первых букв
function myPutnoSwitcher() {
//debugger;
	var selText = Editor.currentView.selection;
	selText = reQuerty(selText);
	Editor.currentView.selection = selText;
}

var myPutnoSwitcherItem = {
    text: "Putno switcher\tF6", 
    ctrl: false,
    shift: false,
    alt: false,
    key: 0x75,
    cmd: myPutnoSwitcher
};
scriptsMenu.addSeparator();
addHotKey(myPutnoSwitcherItem);
scriptsMenu.addItem(myPutnoSwitcherItem);


function formatN(num, len) {
	var retVal = "00000000" + num;
	return retVal.substr(retVal.length-len);
	//return retVal.substr(-len); // <-так не работает.
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
	word = selectValue(tList, "Выберите шаблон");
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
