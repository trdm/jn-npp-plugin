var gFso = new ActiveXObject("Scripting.FileSystemObject");
var gTempPath = gFso.GetSpecialFolder(2)+'\\'; //alert(gTempPath);
var gNjPluginDir = Editor.nppDir +"\\plugins\\jN\\";
var gIntelDir = gNjPluginDir+"Intell\\";

var gWshNetwork = new ActiveXObject("WScript.Network");
var gComputerName = gWshNetwork.ComputerName;
var gUserName = gWshNetwork.UserName;
//gWshNetwork.

function formatN(num, len) {
	var retVal = "00000000" + num;
	return retVal.substr(retVal.length-len);
	//return retVal.substr(-len); // <-так не работает.
}

// 2017-11-17 14:52:19  formatData(Today,'yyyy-MM-dd HH:mm:ss');
function formatData(data, fmString) {
	//debugger;
	var retVal = fmString;
	var re = /(dd|MMMM|MM|yyyy|yy|hh|HH|mm|ss|tt|S)/g;
	var monses = "январь,февраль,март,апрель,май,июнь,июль,август,сентябрь,октябрь,ноябрь,декабрь";
	var monsArr = monses.split(',');
	var td = {}
	td.hh = formatN(data.getHours(),2);
	td.mm = formatN(data.getMinutes(),2);
	td.ss = formatN(data.getSeconds(),2);
	td.DD = formatN(data.getDate(),2);
	td.MM = formatN(data.getMonth()+1,2);
	td.MMMM = monsArr[data.getMonth()];
	td.YY = formatN(data.getFullYear(),2);
	td.YYYY = formatN(data.getFullYear(),4);
		
	var reRe = "";
	while ((reRe = re.exec(fmString)) != null) {
		var fRes = reRe[0];
		switch(fRes) {
			case "hh":
			case "HH":
				retVal = retVal.replace(fRes,td.hh);
				break;
			case "mm":
				retVal = retVal.replace(fRes,td.mm);
				break;
			case "ss":
			case "SS":
			case "S":
				retVal = retVal.replace(fRes,td.ss);
				break;
			case "yyyy":
			case "YYYY":
				retVal = retVal.replace(fRes,td.YYYY);
				break;
			case "YY":
				retVal = retVal.replace(fRes,td.YY);
				break;
			case "dd":
			case "DD":
				retVal = retVal.replace(fRes,td.DD);
				break;
			case "MM":
				retVal = retVal.replace(fRes,td.MM);
				break;
			case "MMMM":
				retVal = retVal.replace(fRes,td.MMMM);
				break;
			default: {
				break;
			};
		}
	}
	return retVal;
}

//trdm: 2018-01-24 12:35:48
function CIntellLoger(psLogName, psFolderPath) {
	this.logName = psLogName;
	this.logFolder = '';
	this.logPath = ''; // Полный путь к файлу лога
	this.setLogFolder = function(psFolderPath) {
		if(!psFolderPath) {
			psFolderPath = gIntelDir;
		}
		if(psFolderPath) {
			if(psFolderPath == 1){ // Текущая директория, а как её у скрипта определить?
				
			}
			this.logFolder = psFolderPath;
			if(!gFso.FolderExists(this.logFolder)) {
				this.logFolder = gTempPath;
			}
		} else {
			this.logFolder = gTempPath;
		}
		if(this.logFolder) {
			if(this.logFolder.substring(this.logFolder.length-1) != '\\') {
				this.logFolder += '\\';
            }
        }
    }
	this.setLogName = function(psLogName) {
		// имя лога обычно срока типа без расширения и даты, добавим к нему их соответственно
    	this.logName = psLogName;
		if(!this.logName) {
			this.logName = '_noName';
        }
		var Today = new Date();
		this.logName += formatData(Today,'yyyy-MM');
		if(this.logName.indexOf('.log') == -1) {
			this.logName += '.log';
        }		
		if(this.setLogFolder) {
			this.logPath = this.logFolder + this.logName;
        }
    }
	this.dumpString = function(psString){
		var File;
		var vFName = this.logPath;
		var vFExist = gFso.FileExists( vFName );
		if (!vFExist) {
			File = gFso.CreateTextFile( vFName, false);
		} else {
			File0 = gFso.GetFile( vFName );
			File = File0.OpenAsTextStream(8);
		} 
		File.WriteLine(psString);
		File.Close();
	}
	this.setLogFolder(psFolderPath);
	this.setLogName(psLogName);
	this.log = function(psText) {
		// к строке надо добавить дату-время, имя компьютера и записать в файл.
		var Today = new Date;
		var vText = formatData(Today, 'yyyy-MM-dd hh:mm:ss; ');
		vText += gComputerName+'; '+gUserName+'; '+psText;
		this.dumpString(vText);
				
	}
}  

function tests() {
	var myLoger = new CIntellLoger("Tests");
	myLoger.log("Тестовая строка");
}
function test2() {
	var dt = new Date;
	dt.getHours();	
}
var gWshNetwork = new ActiveXObject("WScript.Network");

function tests() {
	gWshNetwork.ComputerName;
	var dt = new Date;
	dt.getHours();
	return rv;
}



















