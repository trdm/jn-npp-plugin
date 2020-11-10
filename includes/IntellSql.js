/*
	trdm 2020-11-03 13:27:43 
	man MySQL 8.0 'CREATE TABLE Statement' - https://dev.mysql.com/doc/refman/8.0/en/create-table.html
	filename: IntellSql.js
*/ 
/*
	materials:
	https://stackoverflow.com/questions/4060475/parsing-sql-create-table-statement-using-jquery
	https://code.google.com/archive/p/trimpath/wikis/TrimQuery.wiki
	parse sql:
		e:\Projects\_Utils\js-sql-parser-master\trimpath
		e:\Projects\_Utils\js-sql-parser-master\trimpath\query.js
	https://stackoverflow.com/questions/5192223/convert-javascript-code-to-c-code		
	
	There are a few compilers that translate JavaScript and TypeScript to C:
		https://bellard.org/quickjs/ - QuickJS compiles JavaScript to C using an embedded JavaScript engine.
		https://github.com/andrei-markeev/ts2c - ts2c translates JavaScript and TypeScript source code to C.
		https://github.com/NectarJS/nectarjs - NectarJS compiles JavaScript to C or WebAssembly.

*/
require("lib/ECMA262.js");
var gFsoIS = new ActiveXObject("Scripting.FileSystemObject");

function DateLastModified(psFileName) {
	//debugger;
	var vFName = ''+psFileName;
	var vFile;
	if(vFName) {
		if(gFsoIS.FileExists(vFName)) {
			vFile = gFsoIS.GetFile(vFName);
			return ''+vFile.DateLastModified;
		}
    }	
	return '';
}

var IntellSql = {
	analisers: new Array()
	, getAnaliser: function(psFileName) {
    	var vRetVal = '';
		for(var i = 0; i<this.analisers.length; i++) {
			vRetVal = this.analisers[i];
			if(vRetVal.filename == psFileName) {
				var vDlm = DateLastModified(vRetVal.filename);
				if(vRetVal.filetime != vDlm) {
					vRetVal.parse();
                }
            } else {
				vRetVal = '';
			}
        }
		if(!vRetVal) {
			vRetVal = new CSqlDumpAnalizer(psFileName);
			vRetVal.parse();
        }
    	return vRetVal;
    }
}

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
};

// trdm 2020-11-09 06:00:38  
// CQueryTable - таблица, используемая в запросе.
function CQueryTable(psName, psAlias) {
	this.name = psName;
	this.alias = psAlias;
	this.print = function() {
		message("name="+this.name+'; alias=' + this.alias);
	}
}
/* trdm 2020-11-06 00:39:41  
	Задача: добыть псевдонимы таблиц и их исходные имена.
*/
function CSqlTextAnalizer(psWord, psText) {
	this.curText = psText;
	this.curWord = psWord;
	this.foundTable = '';
	this.sqlTables = new Array;
	this.fileOfDump = ''; // Файл дампа SQL
	this.getFoundTable = function() {
    	return this.foundTable;
    }
	this.getFromClause = function(psSqlQuery) {
		// E:\Projects\_Utils\js-sql-parser-master\trimpath\query.js - 858
		// разбор из query.js
		var sqlQuery = psSqlQuery;
		var sqlQuery = sqlQuery.replace(/\n/g, ' ').replace(/\r/g, ' ');
		sqlQuery = sqlQuery.replace(/(\s+AS\s+)/gi, " as ");
		
        var err = function(errMsg) { 
            throw ("[ERROR: " + errMsg + " in query: " + sqlQueryIn + "]"); 
        };
		
        var strip_whitespace = function(str) {
            return str.replace(/\s+/g, '');
        }

		var findClause = function(str, regexp) {
			var clauseEnd = str.search(regexp);
			if (clauseEnd < 0)
				clauseEnd = str.length;
			return str.substring(0, clauseEnd);
		}
		
		
		sqlQuery = trimSimple(sqlQuery);
		var vRe1 = /\s+from\s+/i;
		sqlQuery = sqlQuery.replace(vRe1,' FROM ');		
		{
		var fromSplit = sqlQuery.substring(7).split(" FROM ");
		if (fromSplit.length != 2)
			err("missing a FROM clause");
		
		//SELECT Invoice.*, Customer.* FROM Invoice, Customer
		//SELECT * FROM Invoice, Customer
		//DELETE things, relationships FROM relationships LEFT OUTER JOIN things ON things.relationship_id = relationships.id WHERE relationships.id = 2
		//SELECT * FROM relationships LEFT OUTER JOIN users ON relationships.created_by = users.id AND relationships.updated_by = users.id LEFT OUTER JOIN things ON things.relatedrelationship_id = relationships.id  ORDER BY relationships.updated_at DESC LIMIT 0, 20
		var columnsClause = fromSplit[0].replace(/\.\*/g, ".ALL");
		var remaining     = fromSplit[1];

		var fromClause    = findClause(remaining, /\sWHERE\s|\sGROUP BY\s|\sHAVING\s|\sORDER BY\s|\sLIMIT/i);
		var fromTableClause = findClause(fromClause, /\sLEFT OUTER JOIN\s/);
		var fromTables = strip_whitespace(fromTableClause).split(',');
		remaining = remaining.substring(fromClause.length);
		
		var fromClauseSplit = fromClause.split(" LEFT OUTER JOIN ");
		var fromClauseParts = [fromClauseSplit[0]];
		var leftJoinComponents;
		for (var i = 1; i < fromClauseSplit.length; i++) {
			leftJoinComponents = /(\w+)\sON\s(.+)/.exec(fromClauseSplit[i]);
			fromTables.push(leftJoinComponents[1]);
			fromClauseParts.push( '('+leftJoinComponents[1]+')'+'.ON(WHERE_SQL("'+leftJoinComponents[2]+'"))' );
		}
		fromClause = fromClauseParts.join(", LEFT_OUTER_JOIN");
		
		if(strip_whitespace(columnsClause) == '*') {
			var new_columns = [];
			for(var i=0; i<fromTables.length; i++) {
				new_columns.push(fromTables[i]+'.ALL')
			}
			columnsClause = columnsClause.replace(/\*/, new_columns.join(', '))
		}
		var whereClause   = findClause(remaining, /\sGROUP BY\s|\sHAVING\s|\sORDER BY\s|\sLIMIT/);
		remaining = remaining.substring(whereClause.length);
		var groupByClause = findClause(remaining, /\sHAVING\s|\sORDER BY\s|\sLIMIT /);
		remaining = remaining.substring(groupByClause.length);
		var havingClause  = findClause(remaining, /\sORDER BY\s|\sLIMIT /);
		remaining = remaining.substring(havingClause.length);
		var orderByClause = findClause(remaining, /\sLIMIT /).replace(/\sASC/g, ".ASC").replace(/\sDESC/g, ".DESC");
		remaining = remaining.substring(orderByClause.length);
		var limitClause   = remaining;
		}
		return fromClause;
		
	}
	this.analyze = function() {
		if(this.curText.length == 0) 
			return '';
		this.foundTable = '';
		this.curWord = this.curWord.toLowerCase();
		var vText  = this.curText;
		var vLinesArray  = this.curText.split('\n');
		if(vLinesArray.length == 1) { // не тот разделитель
			vLinesArray  = this.curText.split('\r\n');
        }
		var vReDump = /\s*(dump)\s*\=\s*/i;
		var vLine = '';
		var vLineParts = '';
		this.fileOfDump = '';
		
		var vSqlDumpAnaliser = ''; //new CSqlDumpAnalizer;
		//debugger;
		for(var i = 0; i< vLinesArray.length; i++) {
			vLine = vLinesArray[i];
			vLine = trimSimple(vLine);
			if(strStartWith(vLine,'--')) {
				if(vReDump.test(vLine)) {
					vLineParts = vLine.split('=');
					if(gFsoIS.FileExists( trimSimple(vLineParts[1]))) {
						this.fileOfDump = vLineParts[1];
                    }
                }            
				vLinesArray[i] = '';
            }
        }
		if(this.fileOfDump) {
			vSqlDumpAnaliser = IntellSql.getAnaliser(this.fileOfDump);        
			//vSqlDumpAnaliser.setFileName(this.fileOfDump);
			// parse - уже вызывается в IntellSql.getAnaliser
			//vSqlDumpAnaliser.parse(); // таблицы и их поля получены.
        }
		
		
		vText = vLinesArray.join('\n');

		var vFromClause = this.getFromClause(vText);
		vFromClause = vFromClause.replace(/\s+as\s+/i,' as ');
		//message('vFromClause = '+vFromClause);
		var vSideLeftArr = ['LEFT','RIGHT','FULL',''];
		var vSideMidArr = ['OUTER','INNER',''];
		for(var i = 0; i< vSideLeftArr.length; i++) {
			var vSideL = vSideLeftArr[i];
			for(var i2 = 0; i2< vSideMidArr.length; i2++) {
				var vSideM = vSideMidArr[i2];
				var vRepl = '';
				if(vSideL) 
					vRepl = '\\s+('+vSideL+')';
				if(vSideM) {
					vRepl = vRepl + '\\s+('+vSideM+')';
                }
				vRepl = vRepl + '\\s+(JOIN)\\s+';
				//message('vRepl = '+vRepl);
				var reRepl = new RegExp(vRepl,'ig');
				var vFromClause = vFromClause.replace(reRepl,'(JOIN)');

            }
        }
		//debugger;
		//message('vFromClause = '+vFromClause);
		var vArrOfTable = vFromClause.split('(JOIN)');
		var vTab, vTabArr, vNameQTable, vAliasQTable;
		for(var i = 0; i<vArrOfTable.length; i++) {
			var vTab = vArrOfTable[i];
			var vTabArr = vTab.split(' ');
			vNameQTable = vTabArr[0];			
			if(vTabArr.length == 2) { // field alias
				vAliasQTable = vTabArr[1];
            } else if(vTabArr.length>2) { //field as alias
				if(vTabArr[1]=='as') {
					vAliasQTable = vTabArr[2];
				}
            }
			vAliasQTable = vAliasQTable.toLowerCase();
			if(this.curWord == vAliasQTable) {
				this.foundTable = vNameQTable.toLowerCase();
			}

			
        }
		if(this.foundTable) {
			//debugger;
			var vFields = '';
			if(vSqlDumpAnaliser) {
            	vFields = vSqlDumpAnaliser.getFields(this.foundTable);
            }
			//message('this.curWord='+this.curWord+'; this.foundTable = '+this.foundTable + '; vFields = '+vFields);
			return vFields;
        }
		return '';		
	}
}


function parserSqlText( psText, psVisitor) {
	//debugger;
	var vLineArr = psText.split('\n');
	var vTextLine = "";
	var vState = 0; 
	var vNeedLoop = true;
	var vWordList = new Array;
	var vNumbers = "0123456789";
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
						psVisitor.analyze(vWordList);
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
	psVisitor.analyze(vWordList);
	return true; 	
}

// trdm 2020-11-03 00:22:55  Для анализов дампов БД MySql структуры их таблиц.
function CSqlDumpAnalizer(psFileName) {
	this.filename = psFileName;
	this.filetime = DateLastModified(psFileName); // время последней записи файла.
	this.sqltables = new Array;
	this.reservWord = Array('unique','primary','key');
	this.textOfFile = "";
	this.init = function() {
    	var vRetVal = false;
    	return vRetVal;
    } 
	this.setFileName = function(psFileNameF) {
		this.filename = psFileNameF;
		this.filetime = DateLastModified(psFileName); // время последней записи файла.
    } 
	this.getFields = function( psTableName ) {
		var vTabName = psTableName;
		vTabName = vTabName.toLowerCase();
		return this.printTables(vTabName);
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
		//debugger;
		var vTable = null, vTabName = '';
		var vFields = '';
		for(var i = 0; i< this.sqltables.length; i++) {
			vTable = this.sqltables[i];
			vTabName = vTable.name;
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
				vTabName = vTabName.toLowerCase();
				if(vFormat == vTabName) {
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
		//debugger;
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
			//vStr.
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
		return parserSqlText(this.textOfFile, this);
    } // this.parse = function()
} // CSqlDumpAnalizer


var vFileName = "F:\\DataBase\\SQL_Db\\ВольтаОфисР25n\\__Tasks\\voltacom_mantis-2.sql";
var vFileName2 = "E:\\Документы\\__Клиенты\\!_reports\\_Вольта\\RV_2020-11-03.sql";

if(false) {
	var vText = loadFromFile(vFileName2);
	//message(vText);
	var vSa = new CSqlTextAnalizer('tab1',vText);
	var vRez = vSa.analyze();
	if(vRez) {
		message('result: '+vRez);
    }
}
/*	var vQa = new CSqlDumpAnalizer(vFileName);

	vQa.parse();
	vQa.printTables(0);
*/