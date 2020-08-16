var gHelpDocum = null;
var gHelpWindow = null;


function convertHTML_EntriesCyrilic(psStr) {
	//trdm: 2018-01-27 15:28:15
	//debugger;
	var vStr1 = '&Agrave;&Aacute;&Acirc;&Atilde;&Auml;&Aring;&die;&AElig;&Ccedil;&Egrave;&Eacute;&Ecirc;&Euml;&Igrave;&Iacute;&Icirc;&Iuml;&Dstrok;&Ntilde;&Ograve;&Oacute;&Ocirc;&Otilde;&Ouml;&times;&Oslash;&Ugrave;&Uacute;&Ucirc;&Uuml;&Yacute;&THORN;&szlig;&agrave;&aacute;&acirc;&atilde;&auml;&aring;&cedil;&aelig;&ccedil;&egrave;&eacute;&ecirc;&euml;&igrave;&iacute;&icirc;&iuml;&eth;&ntilde;&ograve;&oacute;&ocirc;&otilde;&ouml;&divide;&oslash;&ugrave;&uacute;&ucirc;&uuml;&yacute;&thorn;&yuml;'; 
	var vStr2 = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'; 
	var vMap = vStr1.split(';');
	var rv = psStr, vHr = '';
	for(var i = 0; i<vMap.length; i++) {
		var vFragm = vMap[i];
		vFragm += ';';
		// Фишка в том, то replace делает только одну замену, что-бы заменить все полностью, надо гонять цикл.
		while(rv.indexOf(vFragm) != -1) {
			vHr = vStr2.substring(i,i+1); //vStr2.substring(i,1);
			rv = rv.replace(vFragm,vHr);			
        }		
    }	
	return rv;	
}

function processHhcFile(psFName) {
	// эксплорером пройтись или парсинг устроить с заменой
	if(!gFso.FileExists(psFName)) {
		return;
    }
	var rv = loadFromFile(psFName);
	
	return rv;
}

function makeHelpDocs() {
	var rv = '';
	var vFolderPs = Editor.nppDir +"\\plugins\\jN\\help\\";
	if(!gFso.FolderExists(vFolderPs)) {
		return;    
    }
	var vFolder = gFso.GetFolder(vFolderPs);
	if(!vFolder) {
		return;
    }
	debugger;
	var vTextTframe = '';
	var vFolCol = new Enumerator(vFolder.SubFolders);
	vFolCol.moveFirst();
	while(vFolCol.atEnd() == false) {
		vSFolder = vFolCol.item();
		if(vSFolder.ShortName != 'dtree_img') {
			vFName_HHC = vSFolder.Path+vSFolder.Name+'.hhc';
			if(gFso.FileExists(vFName_HHC)) {
				
            
            }
        }
        vFolCol.moveNext();
    } 	
	return rv;
}


//convertHTML_Entries('&Iacute;&aring;&ecirc;&icirc;&ograve;&icirc;&eth;&ucirc;&aring; &icirc;&aacute;&uacute;&aring;&ecirc;&ograve;&ucirc; Automation');
// "Некоторые объекты Automation"
// "Некот&icircры &aring; &icirc;бъ&aring;&ecirc;&ograve;&ucirc; Automation"

//var strDoc = '<html><frameset rows = "50%, 50%" border = "6">	<frame src = "T:\\Web\\fr_left.htm"> <frame src = "T:\\Web\\rf_000000.htm" name = "price"></frameset>';
// done
function openHelp() {
	var rv = '';
	var strDoc = '';
	if(gHelpWindow) {
		return;
    }
	var option = {		
		name:'Документация',		
		docking:'right', 
		onclose:function(){
				gHelpWindow = '';
			}
		};	
	//debugger;
	// не хляют для MSIE '++' в пути. дурить начинает. пришлось перенести.
	//vPath = Editor.nppDir+'\\help\\'; 
	vPath = 'T:\\NppHelp\\help\\';	
	gHelpWindow = Editor.createDockable(option);
	//gHelpWindow.slient = true;
	var d = gHelpWindow.document;
	gHelpDocum = d;
	strDoc = '<html><head></head><frameset rows = "50%, 50%" border = "6">';
	strDoc +='<frame id = "frame_t" src = "'+vPath+'dtree.html">	<frame id = "frame_b" src = "'+vPath+'b_frame.html" name = "docs">';
	strDoc +='</frameset><noframes>ваш браузер не поддерживает фреймы</noframes>';

	d.write(strDoc);
	d.createComment();
	// Теперь надо заставить IE навигировать на нужную страницу в нижнем фрейме.
	//el.src = 'T:\\NppHelp\\help\\html\\Automatition\\HTML\\ObjectFSO_1.html';
	d.close();
	return rv;
}

var myHelpOpenCommand = {
    text: "Справка \tCtrl+F1", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0x70, // "F1"
    cmd: openHelp	
};
// trdm 2018-08-15 07:54:24 - Отключаю, LanguageHelpU.dll - нормально
//scriptsMenu.addSeparator(); addHotKey(myHelpOpenCommand);  scriptsMenu.addItem(myHelpOpenCommand);


