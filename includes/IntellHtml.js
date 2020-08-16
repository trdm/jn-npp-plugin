// trdm 2020-01-27 11:32:07   
/*
	Вынес функционал разбора HTML в этот файл.
	todo:
		- Добавить вызов модификации testHtmlDef() в Intell.js ->getWordList
		- отработать:
			- <a href="#<Курсор>" alt="">(Е*)</a> и 
			- <a href="файл#<Курсор>" alt="">(Е*)</a> и 
*/
/*
\todo
1. CHtmlPlasement.plasement = 
  <div class="p_left_tab" > Последовательность на <a href=" " alt="">рис. ХХIХа-д.</a> (нет ри)</div>
-1 0   1      2             3                      0 1     2  1    2 3             4  3         4 
2. Деструкторы или очистка связей CHtmlTag.parent
*/

function CHtmlPlasement() {
	this.tagName = '';
	this.atribName = '';
	this.atribVal = '';
	this.tag = '';
	this.plasement = -1; 
	this.column = -1;	
	this.getTagName = function() {	return this.tagName.toLowerCase();    }
	this.getAtribName = function() {return this.atribName.toLowerCase() ;    }
	this.getAtribVal = function() {return this.atribVal;    }
}

function CHtmlTag(psIterator) {
	this.Iterator = psIterator;
	this.start = psIterator.i;
	this.startVA = psIterator.i; /* value atribut start*/
	this.end = -1;
	this.name = '';
	this.atribAll = new Array;
	this.atrib = new Array;
	this.atribStart = new Array;
	this.atribValStart = new Array;
	this.atribEnd = new Array;
	this.lastAtribName = '';
	this.parent = null;
	this.isOpen = function() {
		// \todo - реализовать. с упором на CHtmlPlasement.plasement = -1; 
    	return false;
    }
	this.setName = function(psName) {
		this.name = psName;
	}
	this.addAtrib = function(psNameF) {
		this.lastAtribName = psNameF;
		this.atrib[psNameF] = '';
		this.atribStart[psNameF] = this.Iterator.i - psNameF.length;
		this.atribAll.push(psNameF);
	}
	this.setAtribData = function(psData) {
		this.atribValStart[this.lastAtribName] = this.startVA;
		this.atrib[this.lastAtribName] = psData;
		this.atribEnd[this.lastAtribName] = this.Iterator.i;
	}
	this.atribPosStart = function(psAtrName) {	    return this.atribStart[psAtrName];	}
	this.atribPosEnd = function(psAtrName) {	    return this.atribEnd[psAtrName];	}
	this.atribPosStartVal = function(psAtrName) {	return this.atribValStart[psAtrName];	}
	this.atribByPos = function(psPos) {	    
	    var i, vRv = '', vAtrNm = '', vPosStart = 0, vPosEnd = 0;
	    for(i = 0; i < this.atribAll.length; i++) {
	        vAtrNm = this.atribAll[i];
	        vPosStart = this.atribStart[vAtrNm];
	        vPosEnd = this.atribEnd[vAtrNm];
	        if (vPosStart<= psPos && vPosEnd >= psPos) {
	            vRv = vAtrNm;
	            break;
	        }
	    }
		return vRv;
	}
}


function CHtmlTagAnalizer(psLine) {
	this.Tags = new Array;
	this.Iterator = {i: 0, line_: psLine};
	this.lastTag = null;
	this.lastPlasement = null;
	this.getLastPlasement = function() {
    	return this.lastPlasement;
    };
	this.isChar = /[\w\dА-я]/;
	this.getChar = function (vIterator,line) {
		var ch = '';
		if(vIterator.i<line.length-1) {
			ch = line.charAt(vIterator.i);			//Iterator.i = Iterator.i + 1;
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
		var vChar = this.getChar(Iterator,line);
		var vInitPos = Iterator.i;
		while(vChar == ' ' || vChar == '\t') {
			Iterator.i = Iterator.i + 1;
			vChar = this.getChar(Iterator,line);
		}
		if (!(vChar == ' ' || vChar == '\t') && vChar != ''){
		    if (vInitPos != Iterator.i){
		        Iterator.i = Iterator.i-1;
		    }
		}
		return 0;
	}
	this.getIteratorAlreadyLine = function(psIterator) {
	    var vRetVal = '';
	    if (psIterator) {
	        vRetVal = psIterator.line_.substr(0,psIterator.i);
	    }
	    return vRetVal;
	}

	this.testLine = function (psLine) {
    	var rv = new CHtmlPlasement;
		var vIterator  = {i: 0, line_: psLine};
		var line = psLine;
		
		if(IntellPlus.debugMode()) {    	debugger;    }
		
		var vCurChr = '', vLastChr = '';
		var vCurTag = '', vLastTag = '';
		var vCurIndent = '';
		var vCurString = '';
		var vCurSynPos = -1; // -1 before/after tags; 0-in tag, 1 - in tag; 2 in tag value (betwin "" and "")
		var vAlrLine = '';
		
		for(vIterator.i = 0; vIterator.i< line.length; vIterator.i++) {
			vCurChr = this.getChar(vIterator,line);
			vAlrLine = vIterator.line_.substr(0,vIterator.i);
			if(vCurChr == '<' || vCurChr == '>') {
				vCurTag = new CHtmlTag(vIterator);
			    if (vLastTag) {
			        if (vLastTag.isOpen()) {
			            vCurTag.parent = vLastTag;
			        }
			    } 
				this.Tags[this.Tags.length] = vCurTag;			
				if(this.Tags.length-2>=0) {
					this.Tags[this.Tags.length-2].end = vIterator.i;
				}
				this.SkipSpaces(vIterator, line);
				vLastTag = vCurTag;
				vCurSynPos = 0;
				vCurIndent = '';
			} else if(vCurSynPos == 0 || vCurSynPos == 1) {
				vLastChr = vCurChr;
				vCurChr = this.getChar(vIterator,line);
				while(this.isChar.test(vCurChr) && vCurChr != ''){
					vCurIndent = vCurIndent + vCurChr;
					vIterator.i = vIterator.i + 1;
					vLastChr = vCurChr;
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
				vCurTag.startVA = vIterator.i
				vCurString = "";
				vIterator.i = vIterator.i + 1;
				vCurChr = this.getChar(vIterator,line);
				while (vCurChr != '"' && vCurChr != '') {
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
			this.lastTag = vCurTag;
			vLastChr = vCurChr;
		}
		
		var vCurPosView = view.column; // Однако Tab считается за 1 символ, а табы мы заменяем на пробелы.
		var vTagSch = this.tagByPos(vCurPosView);
		if(vTagSch != null) {            
		    rv.tagName = vTagSch.name;
			rv.tag = vTagSch;
			rv.column = vCurPosView;
	        var vAtr, vPosSt = -1, vPosEnd = -1;
	        var vAtrLen = vTagSch.atribAll.length;
		    for(i = 0; i< vAtrLen; i++) {
		        vAtr = vTagSch.atribAll[i];
		        vPosSt  = vTagSch.atribStart[vAtr];
		        vPosEnd  = vTagSch.atribEnd[vAtr];
		        if (vCurPosView >= vPosSt && vCurPosView <=vPosEnd) {
		            rv.atribName = vAtr;
		            rv.atribVal = vTagSch.atrib[vAtr];
		            break;
		        }
		    }
		}
        this.lastPlasement = rv;
		this.statusPlasement();
    	return rv;
    }	
	this.statusPlasement = function() {
    	var vRetVal = '!' +	this.lastPlasement.getTagName() + ' -> '+
		this.lastPlasement.getAtribName() + ' -> "'+
		this.lastPlasement.getAtribVal()+'"';
		status(vRetVal);
    	return vRetVal;
    }
	this.testWiev = function() {
		var rb = '';
		var line = currentView.lines.get(view.line).text;
		line = line.replace(/[\t]/g,"    "); 
		rv = this.testLine(line);
    	return rv;
    }
}

function htmlNeedSelections(psLP) {
	var rv = false;
	if(0) {
		psLP = new CHtmlPlasement;
    }
	if(psLP) {
		var vAtribName = psLP.getAtribName(), vTagName = psLP.getTagName();
		if(vAtribName == 'src') {
			if(vTagName == 'img' || vTagName == 'audio') {
				rv = true;            
            }
		} else if(vAtrName = 'href') {
			if(vTagName == 'link' || vTagName == 'a') {
				rv = true;                        
            }
        }
		
    }
	return rv;
}

function htmlMakeSelections(psAnaliser) {
	var rv = '';
	if(0) {
		psAnaliser = new CHtmlTagAnalizer;
    }
	if(psAnaliser) {
		//debugger;
		var vPosStart = -1, vPosEnd = -1, vAnchor = 0, vPosOffset = -1;
		
		var vTag = null, vLP = psAnaliser.getLastPlasement();
		if(vLP && htmlNeedSelections(vLP)) {		
	    	var vTag = vLP.tag;
			var vNames = ['img']
	    	if( vTag && vTag.name == 'img' && vLP.atribName == "src") {        
    	        var vAtrName = vTag.atribByPos(vLP.column);
		        if (vAtrName != '') {
		            vPosStart = vTag.atribPosStartVal(vAtrName)+1;
		            vPosEnd = vTag.atribPosEnd(vAtrName);
					/* bytePos/Pos и column связаны, */
					vPosOffset = view.pos - view.column;
					view.anchor = vPosStart + vPosOffset;
					view.pos = vPosEnd + vPosOffset;
		        }
		    }		
        }    
    }
	return rv;
}

function HtmlIntellTestGotoTarget() {
	var vFilePath = '';
	// todo - нужно реализовать выделение между "" т.е.выделить:
	//           ______________________
	// <img src="img/Screenshot_001.png" alt="альтернативный текст"> 
	// <link href="/css/style.css?nocache=1297683887" rel="stylesheet" type="text/css">
	// <script type="text/javascript" src="/js/jquery-1.9.1.min.js"></script>
	// <a href="pr0101.html">Приложение I Карты энергетических каналов и биоактивных точек (222)</a>
	var vPlase = {tagName: '', atribName: '', atribVal: ''};
	var vResult = '';
	vPlase = htmlGetPlasement();
	if(vPlase.tagName != '') {
		if(IntellPlus.debugMode()) {    	debugger;    }
		vFilePath = '';
		var vCurFile = '';
		if(vPlase.tagName == 'script') {
			if(vPlase.atribName == 'src') {
				vCurFile = vPlase.atribVal;            
            }
		}
		if(vPlase.atribName == 'href') {
			if(vPlase.tagName == 'script' || vPlase.tagName == 'a' || vPlase.tagName == 'link') {
            	vCurFile = vPlase.atribVal;
            }
		}        

		vCurFile = trim(vCurFile);
		if(vCurFile) {
			if(vCurFile.indexOf('/') != -1) {
				// есть относительные пути
				vCurFile = makeAbsolutePath(""+IntellPlus.curDirPath, vCurFile);
			} else {
			    var vCurFileChains = vCurFile.split('#');
			    if (vCurFileChains.length == 2) { vCurFile = vCurFileChains[0]}
				var tPath = IntellPlus.curDirPath + vCurFile;
				if (gFso.FileExists(tPath)) {
					vCurFile = tPath;
				}
			}
		} 
		while (vCurFile.indexOf("/") != -1) {
			vCurFile = vCurFile.replace("/","\\");
		}
		if(gFso.FileExists(vCurFile)) {
			vFilePath = vCurFile;
        }
		
	}
	return vFilePath;
}

function htmlGetPlasement() {
	var rv = '';
	var vTagA = new CHtmlTagAnalizer;
	var vPlasmt = vTagA.testWiev();
	htmlMakeSelections(vTagA);	
	return vPlasmt;
}



/*
function testHtmlDef() {
	var rv = '';
	IntellPlus.init();
	if(IntellPlus.debugMode()) {    	debugger;    }
	if (IntellPlus.curLang == 'html' || IntellPlus.curLang == 'htm' || IntellPlus.curLang == 'php'){
        //goToDefinitionHtml(); 
		var vTagA = new CHtmlTagAnalizer;
		vTagA.testWiev();
		
	}
	return rv;
}

var testHtmlDefItem = {
    text: "testHtmlDef\tCtrl+T",    
	ctrl: true,    shift: false,   alt: false,
    key: 0x54, // T
    cmd: testHtmlDef
};

//System.addHotKey(testHtmlDefItem);
addHotKey(testHtmlDefItem);
scriptsMenu.addItem(testHtmlDefItem);
*/

