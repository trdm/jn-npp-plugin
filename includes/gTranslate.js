//https://www.linux.org.ru/forum/general/7015159
//curl -s -A "Mozilla/5.0" -d "ie=UTF8" -d "hl=en" -d "sl=$1" -d "tl=$2" -d "q=$3" http://translate.google.com | xmllint --html --format - 2>&- | grep result_box | elinks -dump | sed -e 's/^ *//'
// somename@somehost ~ $ ./bgtrans en ru "do you speak english?"
// Вы говорите по-английски?
var gTransSettting = {};
// https://mymemory.translated.net/doc/spec.php

var gFSO = new ActiveXObject("Scripting.FileSystemObject");

// trdm 2019-09-11 10:06:44  
function writeToFileInput(psString) {
	//var cmdLine = "translateFtF.py -s en -d ru -i \"translateFtF-input.txt\" -o \"translateFtF-out.txt\" \"The text you want to translate.\"";	
	var vFileNm = Editor.nppDir +"\\plugins\\jN\\jN\\system\\translateFtF-input.txt";
	var vFile = gFSO.CreateTextFile( vFileNm, true);
	vFile.Write(psString);
	vFile.Close();
}

// trdm 2019-09-11 10:06:39  
function loadFromFileOutput( vFileName ) {
	var rv = "";
	//var vFileName = Editor.nppDir +"\\plugins\\jN\\system\\translateFtF-out.txt";
	var vFileName = Editor.nppDir +"\\plugins\\jN\\system\\translateFtF-out2.txt";
	if (gFso.FileExists(vFileName)) {
		// если читается файл нулевого размера, тогда выдает ошибку...
		var fl = gFso.GetFile(vFileName);
		if(fl.Size){
			// trdm 2019-09-11 10:08:52 упс, а файл то приходит в UTF-8
			var vTs = fl.OpenAsTextStream(1)
			rv = vTs.ReadAll();
			vTs.Close(); 
		}
	}	
	return rv;
}

// trdm 2020-01-27 09:24:58  
function clearBadChar(psStr) {
	var rv = psStr;
	rv = rv.replace('’','\'');
	return rv;
}

(function(){
	if (!jN.jNExamplesMenu){
		var jNExamplesMenu = Editor.addMenu("jN Examples");
		jN.jNExamplesMenu = jNExamplesMenu;
	}
	if(!gTransSettting.url) {
		gTransSettting.url = "";
    }

	//var smMenu = jN.jNExamplesMenu.addMenu("Smart Highlighter");
	
	var gTranslate = jN.jNExamplesMenu.addMenu("MyMemory"); //	var gTranslate = Editor.addMenu("MyMemory");
	var translate = function (){
		if (Editor.currentView.selection.length > 0){
			if (!this.xmlHttp){
				this.xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			var xmlHttp = this.xmlHttp;
			if (xmlHttp){
				var vCurText = Editor.currentView.selection;
				xmlHttp.open('GET', 'http://mymemory.translated.net/api/get?q='+encodeURIComponent(vCurText)+'&langpair='+this.langPair, true);
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == 4 && xmlHttp.responseText) {
						try{
							var tr = eval("("+xmlHttp.responseText+")").responseData.translatedText;
							var vCurMode = GetMode();
							if(vCurText.length<50) { // trdm 2020-09-01 08:59:12  
								if(vCurMode != "append") {
									tr = vCurText + ": "+tr;
                                }
                            }
							
							switch(vCurMode){
								case "show": alert(tr); break;
								case "replace":currentView.selection = tr; break;
								case "append":currentView.selection = currentView.selection + " - "+tr; break;
								case "clipboard": clipBoard = tr; break;								
								case "message": message(tr); break;
								
							}
								
						}catch(e){
							alert("Error");
						}
					}
				};
				xmlHttp.send(null);
			}
		} else {
			alert("Nothing to translate");
		}		
	}

	var translate2 = function (){
		// trdm 2020-07-14 08:50:15 - пока отключим. 
		if (Editor.currentView.selection.length > 0){
			if (!this.xmlHttp){
				this.xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
				//this.xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");// Возвращает в xml
			}
			//this.xmlHttp.setRequestHeader(,)
			var textForUrlSrc = Editor.currentView.selection;
			textForUrlSrc = clearBadChar(textForUrlSrc);
			var textForUrl = encodeURIComponent(textForUrlSrc);
			
			var ya_key = "trnsl.1.1.20180821T031903Z.0b6df18e08f92862.737deb2f96d854e571a96b189f14961a3dbb5f4a";
			var ya_langPair = this.langPair; ya_langPair = ya_langPair.replace("|","-");
			var ya_link = "https://translate.yandex.net/api/v1.5/tr.json/translate?key="+ya_key+"&text="+textForUrl+"&lang="+ya_langPair+" &format=plain";
			var ya_use = true;
			//debugger;
			var xmlHttp = this.xmlHttp;
			
			// {trdm 2019-09-11 10:09:30  
			var xmlHttp = 0;
			var gWshShell = new ActiveXObject("WScript.Shell");
			gWshShell.CurrentDirectory = Editor.nppDir +"\\plugins\\jN\\jN\\system\\";
			writeToFileInput(textForUrlSrc);			
			var vComandLine = "translateFtF.py -s en -d ru -i \"translateFtF-input.txt\" -o \"translateFtF-out.txt\" \"The text you want to translate.\"";
			gWshShell.Run(vComandLine,0,true);
			vComandLine = "utf8_w1251.exe translateFtF-out.txt translateFtF-out2.txt";
			gWshShell.Run(vComandLine,0,true);
			var textTranslated = loadFromFileOutput();
			//message("src: " + textForUrlSrc);
			message("Translated: " + textTranslated);
			return;
			// }trdm 2019-09-11 10:09:30  
			
			//translateFtF.py -s en -d ru -i "translateFtF-input.txt" -o "translateFtF-out.txt" "The text you want to translate."
			if (xmlHttp){
				var vUrl = 'http://mymemory.translated.net/api/get?q='+textForUrl+'&langpair='+this.langPair;
					//vUrl = 'https://api.mymemory.translated.net/get?q='+textForUrl+'&langpair='+this.langPair+"&of=json"; // трдм 
					//'https://api.mymemory.translated.net/get?q=Hello%20World!&langpair=en|ru
				if(ya_use) {					vUrl = ya_link;                }
				gTransSettting.url = vUrl;
				//message("Url: " + vUrl);
				//xmlHttp.open('GET', vUrl, false);	// < будет висеть долго... 
				// do you speak english
				//var rres = 
			//debugger;
				xmlHttp.open('GET', vUrl, false);
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == 4 && xmlHttp.responseText) {
						try{
							var tr = eval("("+xmlHttp.responseText+")").responseData.translatedText;
							if(gTransSettting.url != tr) {
								switch(GetMode()){
									case "show": alert(tr); break;
									case "replace":currentView.selection = tr; break;
									case "clipboard": clipBoard = tr; break;
									case "message": message(tr); break;
								}
							}
								
						}catch(e){
							alert("Error");
						}
					} else {
						// message(vUrl);
						/* Эксплорер тоже не смог.
						debugger;
						var ieObj = new ActiveXObject("InternetExplorer.Application");
						ieObj.Navigate(vUrl);
						//ie.visible=true;
						while(ieObj.Busy) {
                        	// break; continue;
							
                        } 
						var text = "";
						ieObj.Quit();
						*/
					}
				};
				try { 
					xmlHttp.send(null);
                } catch(e) {
                }
			}
		} else {
			alert("Nothing to translate");
		}
	}

	gS = GlobalSettings.get("gTranslate.lang");

	var lastItem = {
		text:(gS?gS.text:"Englisch - Deutsch")+"\t shift+F8",
		cmd:translate,
	    shift: true,
		key:119,
		langPair:gS?gS.langPair:"en|de"
	};

	lastItem["menuItem"] =  gTranslate.addItem(lastItem);
	addHotKey(lastItem);

	var setLang = function (){
		lastItem["langPair"] = this.langSrc[0]+"|"+this.langDest[0];
		lastItem.menuItem.text = this.langSrc[1]+" - "+this.langDest[1] + "\tF8";
		GlobalSettings.set("gTranslate.lang",{
			langPair:lastItem["langPair"],
			text:this.langSrc[1]+" - "+this.langDest[1]
		});
		lastItem.cmd();
	}

	gTranslate.addSeparator();

	var modes = {};
	
	var toggleMode = function (m){
		SetMode(this.mode);
	}
	
	var SetMode = function(mode){
		GlobalSettings.set("gTranslate.mode",  mode);
		
		for(var el in modes)
			modes[el].m.checked = (el == mode);
	}
	
	var GetMode = function(){
		var mode = GlobalSettings.get("gTranslate.mode");
		
		if (!mode || mode=="")
			 mode = "show";	
			 
		return mode;
	}
	
	var CreateMenu = function(text, mode){
		var cfg  = { "text" : text, cmd:toggleMode, "mode": mode};
		modes[mode] = cfg;
		cfg["m"] = gTranslate.addItem(cfg);
	}

	CreateMenu("Show","show");
	CreateMenu("Replace Selection","replace");
	CreateMenu("Append Selection","append");
	CreateMenu("Copy to clipboard","clipboard");
	CreateMenu("Messages","message");

	
	SetMode(GetMode());
	
	gTranslate.addSeparator();

	var languages = [
		// ["af","Afrikaans"],
		// ["sq","Albanisch"],
		// ["ar","Arabisch"],
		// ["bg","Bulgarisch"],
		["zh-CN","Chinesisch"],
		// ["da","Dänisch"],
		["de","Deutsch"],
		["en","Englisch"],
		// ["et","Estnisch"],
		// ["fi","Finnisch"],
		// ["fr","Französisch"],
		// ["gl","Galicisch"],
		// ["el","Griechisch"],
		// ["iw","Hebräisch"],
		// ["hi","Hindi"],
		// ["id","Indonesisch"],
		// ["ga","Irisch"],
		// ["is","Isländisch"],
		// ["it","Italienisch"],
		["ja","Japanisch"],
		// ["yi","Jiddisch"],
		// ["ca","Katalanisch"],
		// ["ko","Koreanisch"],
		// ["hr","Kroatisch"],
		// ["lv","Lettisch"],
		// ["lt","Litauisch"],
		// ["ms","Malaysisch"],
		// ["mt","Maltesisch"],
		// ["mk","Mazedonisch"],
		// ["nl","Niederländisch"],
		// ["no","Norwegisch"],
		// ["pl","Polnisch"],
		// ["pt","Portugiesisch"],
		// ["ro","Rumänisch"],
		["ru","Russisch"],
		// ["sv","Schwedisch"],
		// ["sr","Serbisch"],
		// ["sk","Slowakisch"],
		// ["sl","Slowenisch"],
		["es","Spanisch"] //, //-------------------------------------
		// ["sw","Suaheli"],
		// ["tl","Tagalog"],
		// ["th","Thailändisch"],
		// ["cs","Tschechisch"],
		// ["tr","Türkisch"],
		// ["uk","Ukrainisch"],
		// ["hu","Ungarisch"],
		// ["vi","Vietnamesisch"],
		// ["cy","Walisisch"],
		// ["be","Weissrussisch"]
	];

	for(var i=0, c=languages.length; i<c; i++){
		var lang = languages[i];
		var lM = gTranslate.addMenu(lang[1]);
		for(var j=0, k=languages.length; j<k; j++){
			if (j!=i){
				var lJ = languages[j];
				var lI = lM.addItem({
					text:lJ[1],
					langSrc: lang,
					langDest:lJ,
					cmd:setLang
				});
			}
		}
	}
})();