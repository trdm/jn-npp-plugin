var gMessageWindow = null;
var gMessageDocum = null;

//require("User32.dll.js");
// глобальная переменная с меню скриптами.
var scriptsMenu;
if (!jN.scriptsMenu){
	scriptsMenu = Editor.addMenu("Скрипты");
	jN.scriptsMenu = scriptsMenu;
} else { 
	scriptsMenu = jN.scriptsMenu;
}

//{trdm: 2018-02-28 13:20:36
function createMessageWindow() {
	var option = {		
		name:'Сообщения (Закрыть: Ctrl+Shift+Q):',		
		docking:'bottom', 
		onclose:function(){
				gMessageWindow = '';
				gMessageDocum = '';
			}
		};	
	gMessageWindow = Editor.createDockable(option);
	gMessageDocum = gMessageWindow.document;
	// ul{margin-left: 20px;} - виден маркер ul{margin-left: 3px;} - не виден
	strDoc = '<html><head><style type="text/css">body{font-size: 14px; font-family:tahoma ; margin: 2px; padding:2px;} ul{margin-left: 3px;}</style> '+
	'</head><body><UL id="main"></UL></body>';
	gMessageDocum.write(strDoc);
}

// using: message('bla-bla-bla');
function message(psStr) {
	if(!gMessageWindow) {
		createMessageWindow();
    }
	if(gMessageDocum) {
		var main = gMessageDocum.getElementById("main");
		var p = gMessageDocum.createElement('li');
		var Today = new Date;
		var dts = formatData(Today,'HH:mm:ss');
		vText = psStr;
		if(vText.indexOf(dts) == -1) {
			vText = dts +' '+ vText;
        }
		vText = vText.replace("&lt;br&gt;",'<br>');
		p.innerText = vText;// + 'dlh.handle = ' + gMessageWindow.handle;
		main.appendChild(p);
    }
}
function EditorMessage(psMessage) {	message(psMessage); }
function EditorMessageDT(psMessage) {	
	var Today = new Date;
	var dts = formatData(Today,'yyyy-MM-dd HH:mm:ss');
	message(dts+' '+psMessage); 
}

function CloseMessageWnd() {
	if(gMessageWindow) {
		gMessageWindow.visible = false; // это работает
		gMessageWindow.close();
		gMessageWindow = '';
		gMessageDocum = '';
    }
}

var myCloseMessageWndCommand = {
    //text: "Закрыть окно сообщений \tCtrl+Shift+Z", 
    text: "Закрыть окно сообщений \tCtrl+Shift+Q", 
    ctrl: true,    shift: true,    alt: false,
    //key: 0x5A, // "Z"
    key: 0x51, // "Q"
    cmd: CloseMessageWnd	
};

addHotKey(myCloseMessageWndCommand); 
scriptsMenu.addItem(myCloseMessageWndCommand);


var mDebud = false;

if(mDebud) {
	message('Hello!');
	message('Hello!-2');
	message('Пример 2. Использование :before и content');
	EditorMessageDT('<- Строка с датой и временем. ');
	EditorMessage('bla-bla-bla');
}

