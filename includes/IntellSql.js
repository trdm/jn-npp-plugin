/*
	trdm 2020-11-03 13:27:43 
	man MySQL 8.0 'CREATE TABLE Statement' - https://dev.mysql.com/doc/refman/8.0/en/create-table.html
	filename: IntellSql.js

*/ 
require("lib/ECMA262.js");

function CSqlTableFild(psName) {
	this.name = psName;
	this.type = '';
	this.length = 0; 
	this.addProp = ''; 
	this.comment = ''; 
}

function CSqlTable(psName) {
	this.name = psName;
	this.filds = new Array;
	this.fildsT = '';
	this.curFilds = null;
	this.findField = function(psName) {
    	var vRetVal = '';
		var vName = psName;
		var vFlds = null;
		var vFound = false;
		vName = vName.toLowerCase();
		for(var i = 0; i< this.filds.length; i++) {
			vFlds = this.filds[i];
			if(vFlds.name.toLowerCase() == vName) { 
				vFound = true;
				break;
			}
        }
		if(!vFound) {
			vFlds = new CSqlTableFild(psName);
			this.filds.push(vFlds);
        }
		this.curFilds = vFlds;
    	return vRetVal;
    }
	this.addField = function(psName, psType, psLen, psAddProps, psComments) {
    	var vRetVal = '';
		var vFlds = this.findField(psName);
		if(vFlds) {
			vFlds.type = psType;
			vFlds.length = psLen;
			vFlds.addProp = psAddProps;
			vFlds.comment = psComments;
        }
    	return vRetVal;
    }	
}

// trdm 2020-11-03 00:22:55  Для анализов дампов БД MySql структуры их таблиц.
function CSqlDumpAnalizer(psFileName) {
	this.filename = psFileName;
	this.sqltables = new Array;
	this.reservWord = Array('unique','primary','key');
	this.textOfFile = "";
	this.init = function() {
    	var vRetVal = false;
    	return vRetVal;
    } 
	this.printTables = function( psFormatOrTab ) {
		var vRetVal = '';
		var vFormat = psFormatOrTab;
		if(vFormat === undefined) {
			vFormat = 0; 
        } else if(typeof(vFormat) == "number") {       
        } else if(typeof(vFormat) == "string") {
			vFormat = vFormat.toLowerCase();
        }
		var vTable = null;
		var vFields = '';
		for(var i = 0; i< this.sqltables.length; i++) {
			vTable = this.sqltables[i];
			if(vFormat == 0) {
				if(vRetVal == '') {
					vRetVal = vTable.name+':'+vTable.fildsT+';';
                } else {
					vRetVal = vRetVal + vTable.name+':'+vTable.fildsT+';';
				}
				vRetVal = vRetVal.replace(/\s+/g,'');
				vFields = vTable.fildsT;
				vFields = vFields.replace(/\s+/g,'');
				//message('vTable: ' + vTable.name+':'+vTable.fildsT+'('+vFields+')');
			} else {
				if(vFormat == vTable.name) {
					vRetVal = vTable.fildsT; // просто поля через запяту.
					vRetVal = vRetVal.replace(/\s+/g,'');
                }
			}
        }
		return vRetVal;
	}
	this.arrayGetSafe = function(psList, psPos) {
		var vRetVal = '';
		if(psList.length>psPos) {
			return psList[psPos];
        }
		return vRetVal;
    } 
	this.testArrayVal = function(psArray, psPos, psVal, psCast ) {
		var vRetVal = false;
		if(psArray.length > psPos) {
			var vVal = psArray[psPos];
			if(psCast == 1) {
				vVal = vVal.toLowerCase();
            }
			if(vVal == psVal) {
				vRetVal = true;
            }        
        }
		return vRetVal;
    } 
	this.analyze = function(psList) {
		var vAnalize = 0;
		var vStr = psList.join('+');
		var vOffset = 0;
		debugger;
		if(this.testArrayVal(psList,1,'temporary',1)) {
			vOffset = 1;
		}
		if(!this.testArrayVal(psList,0,'create',1)) {
			return;
        } else {
			if(!this.testArrayVal(psList,1+vOffset,'table',1)) {
				return;
			}
        }
		var vWord = '';
		var vSkip = 0;
		var vState = 0; // 0 - caption, 1 - filds, 2 - fotter
		var vName = '', vType = '', vSize = '', vAddProp = '';
		var vCurTable = null;
		var vIsFild = true;
		var vPosComment = 0;
		for(var i = 0; i< psList.length; i++) {
			vWord = psList[i];
			vWord = vWord.toLowerCase();
			if(vWord == 'create') {
				vOffset = 0;
				if(this.testArrayVal(psList,i+1,'temporary',1)) {
					vOffset = 1;
                }
				if(this.testArrayVal(psList,i+1+vOffset,'table',1)) {
					vSkip = 2+vOffset;
					if(this.testArrayVal(psList,i+2+vOffset,'if',1) && this.testArrayVal(psList,i+4+vOffset,'exists',1)) {
						vSkip = 5+vOffset;
                    }
					// надо протестировать 'IF NOT EXISTS'
					if(psList.length >= i+vSkip) {
						vName = psList[i+vSkip];
						vCurTable = new CSqlTable(vName);
						this.sqltables.push(vCurTable);
						i = i + vSkip;
                    }
                }
				if(this.testArrayVal(psList,i+1,'(',1)) {
					vState = 1;
                }
            } else if((vWord == '(' || vWord == ',') && vState == 1) {
				// [name] [type] [length]
				vName = this.arrayGetSafe(psList,i+1);
				vType = this.arrayGetSafe(psList,i+2);
				vSize = this.arrayGetSafe(psList,i+3);
				vAddProps = ''; 
				vComments = '';
				vIsFild = true;
				vWord = vName;
				vWord = vWord.toLowerCase();
				//if(vWord == 'primary' ||  vWord == 'key') { vIsFild = false;	}
				if(this.reservWord.indexOf(vWord) != -1) {
					vIsFild = false;
                }
				if(vCurTable != null) {
					if(vIsFild) {                    
						if(vCurTable.fildsT.length > 0) {
							vCurTable.fildsT = vCurTable.fildsT + ', ';
						}
						vCurTable.fildsT = vCurTable.fildsT + vName; //+'.'+vType;
                    }
                }
				vPosComment = 0;
				
				vSkip = 2; // [name] [type]
				if(vSize == '(') {
					vSize = this.arrayGetSafe(psList,i+4);
					vSkip = 5;
                }
				i = i + vSkip;
				for(var ii = i+1; ii< psList.length; ii++) {
					vWord = psList[ii];
					if(vWord == ',' ) {
						i = ii - 1; 
						break;
                    } else if(vWord == ')') { // end fields description
						vState = 2;
						break;						
                    }
					if(vWord.toLowerCase() == 'comment') {
						vPosComment = ii+1;
                    } 
					if(vPosComment == ii) {
						vComments = vWord;
                    }
					if(vAddProps) {
						vAddProps = vAddProps + ' ' + vWord;
                    } else {
						vAddProps = vWord;
					}
                }
				vSkip = vAddProp.indexOf()
				if(vCurTable != null) {
					//vCurTable.
					ii = ii + 1;
                }
				if(vIsFild) {
					vCurTable.addField(vName, vType, vSize,vAddProps,vComments);
                }
            }
        }
		if(vStr.length > 0) {      
			//message("out: " + vStr);
        }
	}
	// trdm 2020-11-06 00:28:01  
	this.setText = function(psText) {
		this.textOfFile = psText;
	}
	this.parse = function() {
    	var vRetVal = false; // false = has mistake
		if(this.textOfFile.length == 0) {
			var vFso = new ActiveXObject("Scripting.FileSystemObject");
			if(!vFso.FileExists(this.filename)) {
				return false;
			}
			var vFile = vFso.GetFile(this.filename);
			var vFileStream = vFile.OpenAsTextStream(1,0);
			this.textOfFile = vFileStream.ReadAll();
        }
		var vLineArr = this.textOfFile.split('\n');
		var vTextLine = "";
		var vState = 0; 
		var vNeedLoop = true;
		var vWordList = new Array;
		var vNumbers = "0123456789";
		//debugger;
		/* 0 - unknown; 1 - comment. 2 - string */
		for(var i = 0; i< vLineArr.length; i++) {
			vTextLine = vLineArr[i];
			
			do  { 
				vNeedLoop = false;
				vTextLine = trimSimple(vTextLine);
				if(vTextLine.length == 0) {
					continue;
                }
				if(vTextLine.indexOf('--') == 0) {
					continue; // skip comment            
				} else if(vTextLine.indexOf('/*') == 0) {
					vState = 1; 
					if(vTextLine.indexOf('*/') != -1) {
						vTextLine = strRightFrom(vTextLine, '*/')
						vNeedLoop = true;
						if(vTextLine == ";") {
							vNeedLoop = false;
                        }
					}
				} else {
					var vWord = '';
					var vChar = '';
					var vNeedPushW = false;
					var vState = 0; // 1 - in string
					var vOffset = 0;
					//message("src: " + vTextLine);
					for(var iChr = 0; iChr< vTextLine.length; iChr++) {
						vChar = vTextLine[iChr];
						if(vState == 1) {
							vWord = vWord +  vChar;								
							if(vChar == '"') {
								vState  = 0;
								vWordList.push(vWord);
								vWord = '';
                            }                        
							continue;
                        }
						if(gIntell_engLetersAll.indexOf(vChar) != -1) {
							vWord = vWord + vChar;
                        } else if(gIntell_rusLetersAll.indexOf(vChar) != -1) {
							vWord = vWord + vChar;
                        } else if(vChar == '_' || vChar == '.') {
							vWord = vWord + vChar;
                        } else if(vNumbers.indexOf(vChar) != -1) {
							vWord = vWord + vChar;
                        } else if(vChar == '\t' || vChar == ' ') {
							vNeedPushW = true;
                        } else if(vChar == '=') {
							vNeedPushW = true;
							if(vWord.length > 0 ) {
								vWordList.push(vWord);                            
                            }
							vWordList.push("=");
							vWord = '';                        
                        } else if(vChar == '(' || vChar == ')' || vChar == ',') {
							if(vWord.length > 0 ) {
								vWordList.push(vWord);                            
                            }
							vWordList.push(vChar);
							vWord = '';                        
                        } else if(vChar == '\'') {
							if(vWord.length != 0) {
								vWordList.push(vWord);
                            }
							vOffset = vTextLine.indexOf('\'',iChr+1);
							vWord = vChar + vTextLine.substr(iChr+1,vOffset-iChr);
							if(vWord.length != 0) {
								vWordList.push(vWord);
								vWord = '';
                            }
							iChr = vOffset;
                        } else if(vChar == ';') {
							// Конец одной инструкции, надо отправить 
							if(vWord.length != 0) {
								vWordList.push(vWord);
                            }
							vWord = '';       
							this.analyze(vWordList);
							vWordList.length = 0;
                        } else if(vChar == '"') {
							if(vWord.length != 0) {
								if(vWord[0] == '"') {
									vWord = vWord + vChar;
									vWordList.push(vWord);
                                }
                            } else {
								vWord = '"';
								vState = 1;
							}
                        }
						if(vNeedPushW) {
							if(vWord.length != 0) {
								vWordList.push(vWord);
                            }
							vWord = '';
							vNeedPushW = false;                        
                        }
                    } //for(var iChr = 0; iChr< vTextLine.length; iChr++) {
					if(vWord.length > 0 ) {
						vWordList.push(vWord);                            
					}
					//message(vTextLine);
				}
			}while(vNeedLoop);			
        }	// for(var i = 0; i< vLineArr.length; i++) {
		this.analyze(vWordList);
    	return true; 
    }
}
// trdm 2020-11-06 00:39:41  
function CSqlAnalizer(psWord, psText) {
	var vRetVal = '';
	return vRetVal;
}
if(false) {
	var vFileName = "F:\\DataBase\\SQL_Db\\ВольтаОфисР25n\\__Tasks\\voltacom_mantis-2.sql";
	var vQa = new CSqlDumpAnalizer(vFileName);
	vQa.parse();
	vQa.printTables(0);
}