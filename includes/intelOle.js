/* Адаптация OLE-ActiveX *.ints Generator: 
	т.е. intsOLEGenerator.vbs - генератор *.ints файлов для Intellisence
	
	© trdm 2005-2018
	
	Для работы данного скрипта требуется библиотека TLBINF32.DLL
	По последней информации она входит в состав 6-й Визуал студии от microsoft, однако
	Скачать её можно: не нашел, а вот хелп по ней: 2 линка
	http://download.microsoft.com/download/vstudio60pro/doc/1/win98/en-us/tlbinf32.exe
	http://support.microsoft.com/default.aspx?scid=kb;en-us;224331
	Дополнительная инфа:
	http://www.forum.mista.ru/topic.php?id=474854 - Можно сделать подсказку по COM объектам?
	http://rsdn.org/article/com/typeinfo.xml?print - Получение информации о COM-интерфейсах

*/
require("lib/Window.js");
require("lib/User32.dll.js");

var gNjPluginDir = Editor.nppDir +"\\plugins\\jN\\";
var gFileNameProgIDDumped;
var gIntelDir2 = gNjPluginDir+"Intell\\"; //_2 = добавочка для тестов. Была. Рискнем продакшинзом....
var gBinDir = gNjPluginDir;
// todo затестить ActiveXObject("|
var gWSH = new ActiveXObject("WScript.Shell");
var gFSO = new ActiveXObject("Scripting.FileSystemObject");


var gFileNameProgIDDumped= gIntelDir2 + "_progIdDumped.dict";		// Имя файла, содержащего прог-иды по которым данные сформированы 
var gFileNameLvalCommon		 = gIntelDir2 + "_common.lval";		// Потому что для скриптовых языков они общие

var gDataDirAls = gBinDir; // // Сам Bin....
var gLoder;// Логер 'intellOle'

var gAlsToFile;
var gStatuBar; // Статус бар Notepadd

function checkLoger() {
	var rv = true;
	if(!gLoder) {
		try { 
			gLoder = new loger("intellOle");
			gLoder.log("Логер скрипта: intelOle.js");	
        } catch(e) {
			rv = false;
        }
	}
	return rv;
}

//trdm: 2018-01-24 15:41:29
function writeToLog(psString) {
	if(checkLoger()) { // Ну мало ли, вдруг не инициализировался?
		gLoder.log(psString);
    }
}

var IntellOle = {
	MakeData : function(psProgID) {		return IntsGenerator(psProgID);	}
	, progIdIsDumped : function (psProgID) {
		var rv = false;
		var vProgID = psProgID;
		vProgID = vProgID.toLowerCase();
		var vFileName = gFileNameProgIDDumped;
		if(gFso.FileExists(vFileName)) {
			var File0 = gFSO.GetFile( vFileName );
			var File = File0.OpenAsTextStream(1);
			if (File0.Size > 0) {
				TextStream = File.ReadAll();
				if(0) { TextStream = ''; } // просто подсказка для интеллиценза
				TextStream = TextStream.toLowerCase();	
				if (TextStream.indexOf(vProgID) != -1) {		//InStr(1, LCase(TextStream), LCase(psProgID))>0
					rv = true;
				}
			}
			File.Close();		
		}
		return rv;
    }
	, isProgID : function ( psProgID ){
		//\todo - кеширование? 
		vProgID = trimSimple(psProgID); 	//Проверим что нам в	psProgID преподнесли....
		var re = /([a-zA-Z\.0-9_]*)/i;
		var reRe = re.exec(vProgID);
		if (!reRe) {
			return false;
		} else if (reRe[1] != vProgID){
			return false;
		}
		//if (!re.test(vProgID)){		return false;	}
		PathFile = GetPathFromProgID ( psProgID );
		if (!PathFile) {
			return false;
		}
		return true;
    }
}

//trdm: 2018-01-16 23:28:23
function ProgIDIsDumped( psProgID ) {
	var rv = IntellOle.progIdIsDumped(psProgID)
	var mess = ""+psProgID+" "+(rv) ? ' is dumped ' : 'is NOT dumped';
	status(mess);
	return rv;
}

// Функция проверяет прог-ид по реестру и на содержание psProgID
// psProgID = должен быть представлен английскими литералами, цыфрами и точкой.
function IsProgID( psProgID ) {
	return IntellOle.isProgID(psProgID);
} 

function status( psStatusText ) {
	try { gStatuBar.SetWindowText(psStatusText); } catch(e) {}
}
function InStr(strSearch, charSearchFor){
	return strSearch.indexOf(charSearchFor);
}

function Chr(psN) {	return String.fromCharCode(psN);}
function appendArray ( psArray, psElement ) {psArray.push(psElement);}
function LCase(psStr) {
	var rv = psStr;
	return rv.toLowerCase();
}
function OstDel(Pa1, Pa2){ return (Pa1 % Pa2);	} 
function Fix (psNum) {	return parseInt(psNum.toString());   	} //Fix(12.0050);
function Replace(psStr1, psStr2, psStr3) {
	var rv = psStr1;
	return rv.replace(psStr2,psStr3);
}
// Вспомогашка, а то скриптинг-дикшионери возвращает не тот массив.
function toJSArray(vbaarray){
	useVBArray = new VBArray(vbaarray);
	var ara =  useVBArray.toArray(); 
	return ara;
}


function Message(psString){
	//todo сделать докабельный диалог с выводом сообщений. Сейчас?
	status(psString);
}

function MyConfirm(psMessText,psCase, psCapt) {
	var rv = User32.MessageBoxW(Editor.handle,psMessText,psCapt,psCase);	// 1 - Ok| 2 - cansel(и даже если нажат Esc)
	return rv;
}

function tryReadRegKey(psRKey){
	var rv = '';
	try {			rv = gWSH.RegRead(psRKey);
	} catch(e) {	rv = '';
	}
	return rv;	
}

function trimSimple( psLine ) {	
	var re = new RegExp("^[\\s]+|[\\s]+$", 'g');
	return psLine.replace(re, '');
}

function Asc(psChar) {	return psChar.charCodeAt(0);}

//Ищем путь к библиотеке по ProgID-у
function GetPathFromProgID ( psProgID ) {
	// done
	var RKey = "HKCR\\" + psProgID+"\\CLSID\\";
	var retVal = '';
	var val = '';
	try {		
		val = tryReadRegKey(RKey); // val = gWSH.RegRead(RKey);
		if (val) {
			RKey = "HKCR\\CLSID\\"+val+"\\InprocServer32\\";
			retVal = tryReadRegKey(RKey); // retVal = gWSH.RegRead(RKey);
			if (!retVal) {
				RKey = "HKCR\\CLSID\\"+val+"\\LocalServer\\";
				retVal = tryReadRegKey(RKey); //retVal = gWSH.RegRead(RKey);
				if (!retVal) {
					RKey = "HKCR\\CLSID\\"+val+"\\LocalServer32\\";
					retVal = tryReadRegKey(RKey); //retVal = gWSH.RegRead(RKey);
				}
			}
		} else {
			Message("Не найден ключ реестра с данным класидом" + RKey + " для объекта: " + psProgID);
		}
	} catch(e) {
		Message('Ошибка в GetPathFromProgID для объекта: '+psProgID);
	}
	return retVal;
	
}




function ITypeLib() {
	
	this.LibPath = ""; //Имя библитеки
	this.Library = 0;  //библитека (TypeLibInfo)
	this.DefaultInterfaseName = "";  // интерфейс по умолчанию
	this.ModeLValRepresent = 1; // 1 - Длинное представление, 2 - короткое, но тут мы рискуем нарваться на конфликт имен.
	this.ThisProgID  = ""; //ProgID библиотеки
	this.ThisProgIDForIntel = "";  //ProgID библиотеки, преобразованный для OtherTypesDefine:  Excel.Application>>excel_application
	
	this.LibraryIsLoad = false; // Библиотека считана и готова к работе.
	
	this.DebugFlag = false; //Флаг отладки
	this.flOutNameAndTypeParameters = false; //Выводить ли информацию о параметрах функции (имена и типы)
	this.InterfasesToDumpAll = new ActiveXObject("Scripting.Dictionary"); //Все выведенные интерфейсы.
	this.InterfasesToDumpAllready = new ActiveXObject("Scripting.Dictionary"); //Все выведенные интерфейсы.
	// Содержит наименование интерфейса для записи из TypesStructureExt, для быстрого поиска в синтакс-помощнике
	this.FileNameTypesStructureExt		= gIntelDir2 + "\TypesStructureExt.txt";	// Имя файла из которого будет подгружаться словарь Intellisence "TypesStructureExt"
	this.FileNameTypesStructureExtDef	= gIntelDir2 + "\TypesStructureExtDef.txt";	// Имя файла из которого будет подгружаться словарь Intellisence "TypesStructureExtDef"
	this.FileNameOtherTypesDefine		= gIntelDir2 + "\OtherTypesDefine.txt";		// Имя файла из которого будет подгружаться словарь Intellisence "OtherTypesDefine"
	this.ErrorNumber = 0;				// Номер последней ошибки загрузки.

	// из-за того, что объект, созданный по прог-иду может быть опасен
	// или уже есть сформированные *.ints файлы
	try { 
		this.TLITypeLibInfo = new ActiveXObject("TLI.TypeLibInfo");
		this.TLIApplication = new ActiveXObject("TLI.TLIApplication");
    } catch(e) {
		alert("Класс: ITypeLib не инициализировался, библиотека: TLBINF32.DLL не зарегистрирована на данном рабочем месте!");
		this.TLITypeLibInfo = 0;
		this.TLIApplication = 0;
    }
	this.DefaultInterfase = 0;
	this.TypeStr = new ActiveXObject("Scripting.Dictionary");
	this.TypeStr2 = new ActiveXObject("Scripting.Dictionary");

	//this.
	
	this.ALSCreate	= false;		// нужно ли генерировать als-файл?
	this.mALSGenerator = 0;			// элемент класса для генерации als-файла....
	this.mALSParentF = 0;			// Родительская папка...
	
	this.TKIND_ENUM		= 0;
	this.TKIND_RECORD	= 1;
	this.TKIND_MODULE	= 2;
	this.TKIND_INTERFACE= 3;
	this.TKIND_DISPATCH	= 4;
	this.TKIND_COCLASS	= 5;
	this.TKIND_ALIAS	= 6;
	this.TKIND_UNION	= 7;
	this.TKIND_MAX		= 8;
	
	this.INVOKE_UNKNOWN			= 0;
	this.INVOKE_FUNC			= 1;
	this.INVOKE_PROPERTYGET		= 2;
	this.INVOKE_PROPERTYPUT		= 4;
	this.INVOKE_PROPERTYPUTREF	= 8;
	this.INVOKE_EVENTFUNC		= 16;
	this.INVOKE_CONST			= 32;

	this.VT_EMPTY			= 0;
	this.VT_NULL			= 1;
	this.VT_I2				= 2;
	this.VT_I4				= 3;
	this.VT_R4				= 4;
	this.VT_R8				= 5;
	this.VT_CY				= 6;
	this.VT_DATE			= 7;
	this.VT_BSTR			= 8;
	this.VT_DISPATCH		= 9;
	this.VT_ERROR			= 10;
	this.VT_BOOL			= 11;
	this.VT_VARIANT			= 12;
	this.VT_UNKNOWN			= 13;
	this.VT_DECIMAL			= 14;
	this.VT_I1				= 16;
	this.VT_UI1				= 17;
	this.VT_UI2				= 18;
	this.VT_UI4				= 19;
	this.VT_I8				= 20;
	this.VT_UI8				= 21;
	this.VT_INT				= 22;
	this.VT_UINT			= 23;
	this.VT_VOID			= 24;
	this.VT_HRESULT			= 25;
	this.VT_PTR				= 26;
	this.VT_SAFEARRAY		= 27;
	this.VT_CARRAY			= 28;
	this.VT_USERDEFINED		= 29;
	this.VT_LPSTR			= 30;
	this.VT_LPWSTR			= 31;
	this.VT_RECORD			= 36;
	this.VT_FILETIME		= 64;
	this.VT_BLOB			= 65;
	this.VT_STREAM			= 66;
	this.VT_STORAGE			= 67;
	this.VT_STREAMED_OBJECT	= 68;
	this.VT_STORED_OBJECT	= 69;
	this.VT_BLOB_OBJECT		= 70;
	this.VT_CF				= 71;
	this.VT_CLSID			= 72;
	this.VT_VECTOR			= 4096;
	this.VT_ARRAY			= 8192;
	this.VT_BYREF			= 16384;
	this.VT_RESERVED		= 32768;

	this.AddToTypesDicts = function(psNType, psStrHelp, psStrType) {
		this.TypeStr.Add(psNType ,psStrHelp); 
		this.TypeStr2.Add(psNType ,psStrType); 
    }  

	this.AddToTypesDicts(this.VT_EMPTY			,"VT_EMPTY",			"Null"); 	
	this.AddToTypesDicts(this.VT_NULL			,"VT_NULL",				"Null"); 
	this.AddToTypesDicts(this.VT_I2				,"Число (VT_I2)",		"Number"); 
	this.AddToTypesDicts(this.VT_I4				,"Число (VT_I4)",		"Number"); 
	this.AddToTypesDicts(this.VT_R4				,"Число (VT_R4)",		"Number"); 
	this.AddToTypesDicts(this.VT_R8				,"Число (VT_R8)",		"Number"); 
	this.AddToTypesDicts(this.VT_CY				,"VT_CY",				"Number");  // currency
	this.AddToTypesDicts(this.VT_DATE			,"Дата (VT_DATE)",		"Date"); 
	this.AddToTypesDicts(this.VT_BSTR			,"Строка (VT_BSTR)",	"String"); 
	this.AddToTypesDicts(this.VT_DISPATCH		,"VT_DISPATCH",			"Object"); 
	this.AddToTypesDicts(this.VT_ERROR			,"VT_ERROR",			"Number"); // Правда?
	this.AddToTypesDicts(this.VT_BOOL			,"Булево (VT_BOOL)",	"Boolean"); 
	this.AddToTypesDicts(this.VT_VARIANT		,"VT_VARIANT",			"Object"); 
	this.AddToTypesDicts(this.VT_UNKNOWN		,"VT_UNKNOWN",			"Null"); 
	this.AddToTypesDicts(this.VT_DECIMAL		,"Число (VT_DECIMAL)",	"Number"); 
	this.AddToTypesDicts(this.VT_I1				,"Число (VT_I1)",		"Number"); 
	this.AddToTypesDicts(this.VT_UI1			,"Число (VT_UI1)",		"Number"); 
	this.AddToTypesDicts(this.VT_UI2			,"Число (VT_UI2)",		"Number"); 
	this.AddToTypesDicts(this.VT_UI4			,"Число (VT_UI4)",		"Number"); 
	this.AddToTypesDicts(this.VT_I8				,"Число (VT_I8)",		"Number"); 
	this.AddToTypesDicts(this.VT_UI8			,"Число (VT_UI8)",		"Number"); 
	this.AddToTypesDicts(this.VT_INT			,"Число (VT_INT)",		"Number"); 
	this.AddToTypesDicts(this.VT_UINT			,"Число (VT_UINT)",		"Number"); 
	this.AddToTypesDicts(this.VT_VOID			,"VT_VOID",				"Null"); 
	this.AddToTypesDicts(this.VT_HRESULT		,"VT_HRESULT",			"Number"); 
	this.AddToTypesDicts(this.VT_PTR			,"VT_PTR",				"Null");  // хз. что это..
	this.AddToTypesDicts(this.VT_SAFEARRAY		,"VT_SAFEARRAY",		"Array"); 
	this.AddToTypesDicts(this.VT_CARRAY			,"VT_CARRAY",			"Array"); 
	this.AddToTypesDicts(this.VT_USERDEFINED	,"VT_USERDEFINED",		"Null"); 
	this.AddToTypesDicts(this.VT_LPSTR			,"VT_LPSTR",			"String"); 
	this.AddToTypesDicts(this.VT_LPWSTR			,"VT_LPWSTR",			"String"); 
	this.AddToTypesDicts(this.VT_RECORD			,"VT_RECORD",			"Object"); 
	this.AddToTypesDicts(this.VT_FILETIME		,"VT_FILETIME",			"Object"); 
	this.AddToTypesDicts(this.VT_BLOB			,"VT_BLOB",				"Object"); 
	this.AddToTypesDicts(this.VT_STREAM			,"VT_STREAM",			"Object"); 
	this.AddToTypesDicts(this.VT_STORAGE		,"VT_STORAGE",			"Object"); 
	this.AddToTypesDicts(this.VT_STREAMED_OBJECT,"VT_STREAMED_OBJECT",	"Object"); 
	this.AddToTypesDicts(this.VT_STORED_OBJECT	,"VT_STORED_OBJECT",	"Object"); 
	this.AddToTypesDicts(this.VT_BLOB_OBJECT	,"VT_BLOB_OBJECT",		"Object"); 
	this.AddToTypesDicts(this.VT_CF				,"VT_CF",				"Null"); 
	this.AddToTypesDicts(this.VT_CLSID			,"VT_CLSID",			"Object"); 
	this.AddToTypesDicts(this.VT_VECTOR			,"VT_VECTOR",			"Null"); 
	this.AddToTypesDicts(this.VT_ARRAY			,"VT_ARRAY",			"Array"); 
	this.AddToTypesDicts(this.VT_BYREF			,"VT_BYREF",			"Null"); 
	this.AddToTypesDicts(this.VT_RESERVED		,"VT_RESERVED",			"Null"); 
		

	this.DumpStringToFile = function(DumpString, FileName){
		var File;
		var vFExist = gFSO.FileExists( FileName );
		if (!vFExist) {
			File = gFSO.CreateTextFile( FileName, false);
		} 
		if(vFExist) {              
			File0 = gFSO.GetFile( FileName );
			File = File0.OpenAsTextStream(1);
			if (File0.Size > 0) {
				TextStream = File.ReadAll();
				if (InStr(LCase(TextStream), LCase(DumpString))>0) {
					File.Close();
					return;
				}
			}
			File = File0.OpenAsTextStream(8);

		}
		File.WriteLine(DumpString);
		File.Close();
	}

	this.SaveDumpedProgID = function( DumpedProgID ) {		this.DumpStringToFile(DumpedProgID, gFileNameProgIDDumped);	}
	this.DMessage = function( mess ) {		if (this.DebugFlag) {			Message( mess );		}	} 
	
	this.CheskClass = function() { //Проверим клас, как он инициализировался...
		var retVal = true;
		if  (!this.TLITypeLibInfo) {	retVal = false;
		} if(!this.TLIApplication) {	retVal = false;
		} if(!gWSH) {			retVal = false;			}
		return retVal;
	} 	

	// Считать библиотеку 
	// CreateObj - создавать объект, если по прог-иду не нашли
	// ProgID - прог-ид объекта
	this.LoadLibrary = function( ProgID, CreateObj ) {
		var retVal = false;
		this.LibraryIsLoad = false;
		if (ProgIDIsDumped( ProgID )) { 
			Message( "Файлы для " + ProgID + " уже сформированы. Если нужно заново переформировать их, удалитте строку: "+ProgID+" из файла: " + gFileNameProgIDDumped);
			return retVal;
		}
		
		this.ThisProgID = ProgID;
		// Ищем прог-ид в реестре.
		this.LibPath = GetPathFromProgID ( ProgID );
		if (!this.LibPath) {
			this.ErrorNumber = 1;
			SaveDumpedProgID(LCase(this.ThisProgID));
			Message( "Прог-ид " + this.ThisProgID + " не найден в реестре и помечен как обработанный для исключения повторной генерации.");
			return retVal;
		}
		this.LibPath = Replace(this.LibPath,"/automation","");
		this.LibPath = trimSimple(this.LibPath);
		
		if (!gFSO.FileExists(this.LibPath)) {
			this.ErrorNumber = 1;
			SaveDumpedProgID(LCase(this.ThisProgID));
			Message( "Прог-ид " + this.ThisProgID + "Нет файла:" + this.LibPath	);
			this.LibPath = '';
		}
		if (this.LibPath) {
			try { 
				this.Library = this.TLIApplication.TypeLibInfoFromFile(this.LibPath);
				if(this.Library){ //not IsNull(Library) And Not IsEmpty( Library ) {
					retVal = true;
				}
            } catch(e) {
				retVal = false;
            }
		} else {
			return false;
		} 
		// todo проблема с confirm - нет его в JScript :((((( решение см. User32.dll.js 
		vStrQuestion = 'ВНИМАНИЕ! Сейчас будет произведено создание объекта "'+ProgID+"'\n"+
		'Для генерации файлов Intellisence. Некоторые объекты не поддерживают \n'+
		'динамическое создание и могут привести к завершению программы.\n'+
		'Рекомендуется сохранить данные.\n'+
		"Продолжить?";
		// отключим пока, незачем спотыкаться каждый раз...
		//vMyAnswer = MyConfirm(vStrQuestion,1, "OLE-ActiveX *.ints Generator"); 
		vMyAnswer = 1;
		if(vMyAnswer == 2) { // файл не  
			retVal = false;
			this.LibraryIsLoad = retVal;
			vStrQuestion = "Пометить объект '"+ProgID+"' как обработанный?\nПо помеченным объектам генерация не производится.";
			vMyAnswer = MyConfirm(vStrQuestion, 4, "OLE-ActiveX *.ints Generator");
			if (vMyAnswer == 1) {
				SaveDumpedProgID(LCase(this.ThisProgID));
				this.ErrorNumber = 1
			}
			return retVal;
		}	
		// Нужно создать объект из которого извлечем дефолтный интерфейс ииспользуем его
		// Если мне кто подскажет как получить дефолтный интерфейс без создания объекта буду признателен.
		var Obj;
		try { 
			Obj = new ActiveXObject(ProgID);
        } catch(e) {
			retVal = false;
			this.LibraryIsLoad = false;
			this.ErrorNumber = 1;
			SaveDumpedProgID(LCase(this.ThisProgID));
			Message( "По прог-ид " + this.ThisProgID + " создать объект не удалось");
			return retVal;
        }

		// todo work this
		DefaultInterfase = ''; 
		ClassInfo = ''; 
		if (Obj) {
			try { 
				DefaultInterfase = this.TLIApplication.InterfaceInfoFromObject(Obj);
				ClassInfo = this.TLIApplication.ClassInfoFromObject(Obj); // InterfaceInfoFromObject - иногда возвращает не основной класс, а какой-то вспомогательный.		
            } catch(e) {
				DefaultInterfase = '';
				this.LibraryIsLoad = false;
				this.ErrorNumber = 1;
				SaveDumpedProgID(LCase(this.ThisProgID));
				Message( "По прог-ид " + this.ThisProgID + " не удалось получить главного интерфейса");				
				return false;
            }

			if ( DefaultInterfase ) {
				try { 
					this.LibPath = DefaultInterfase.Parent.ContainingFile;
					this.Library = this.TLIApplication.TypeLibInfoFromFile(this.LibPath);
					this.DefaultInterfaseName = DefaultInterfase.Name;
					//\todo - понять и устранить.
					//{  Грязный хак, но что поделаешь.
					if(ClassInfo) {    
						if(ClassInfo.TypeKindString	== "coclass") {
							//\todo А нам нужен диспинтерфейс, надо по сокласу найти его. 							
                        } else {
							this.DefaultInterfaseName = ClassInfo.Name;							
						}
						if(ClassInfo.Name == 'DOMDocument') {
							this.DefaultInterfaseName = 'IXMLDOMDocument';
                        }
					} 
					//} Грязный хак, но что поделаешь.
					retVal = true;
					this.LibraryIsLoad = true;
                } catch(e) {					
					this.LibraryIsLoad = false;
					this.ErrorNumber = 1;
					SaveDumpedProgID(LCase(this.ThisProgID));
					Message( "По прог-ид " + this.ThisProgID + " информацию из библиотеки типов..");					
					return false;
                }	
			}
			Obj = 0;
		}
		
	
		this.LibraryIsLoad = true;
		this.ThisProgIDForIntel = LCase(this.ThisProgID);
		this.ThisProgIDForIntel = Replace(this.ThisProgIDForIntel,".", "_");

		OtherTypesDefineString = LCase(this.ThisProgID)+","+this.ThisProgIDForIntel;
		//this.DumpStringToFile(OtherTypesDefineString, this.FileNameOtherTypesDefine);
		this.SaveDumpedProgID(this.ThisProgID);
		return true;
	} // LoadLibrary()
	
	
	this.Class_Terminate = function() {	// Setup Terminate event.
		this.TLITypeLibInfo = 0;
		this.TLIApplication = 0;
		this.DefaultInterfaseName = 0;
	}
	
	this.AttrIsEnum = function( InvokeKinds ) { // Атрибут есть перечисление
		var rv = false;
		if (OstDel(Fix(InvokeKinds/this.INVOKE_CONST),2) == 1) {
			rv = true;
		}
		return rv;		
	}
	this.AttrIsEvent = function  ( InvokeKinds ) { // Атрибут есть событие
		var rv = false;
		if (OstDel(Fix(InvokeKinds/this.INVOKE_EVENTFUNC),2) == 1) {
			rv = true;
		}		
		return rv;
	}
	
	this.AttrIsFunc = function ( InvokeKinds ) { // Атрибут есть метод
		var rv = false;
		if (OstDel(Fix(InvokeKinds/this.INVOKE_FUNC),2) == 1) {
			rv = true;
		}
		return rv;
	}
	
	this.AttrIsProps = function  ( InvokeKinds ) {// Атрибут есть свойство
		rv = false;
		if (OstDel(Fix(InvokeKinds/this.INVOKE_PROPERTYGET),2) == 1) {
			rv = true;
		} else if (OstDel(Fix(InvokeKinds/this.INVOKE_PROPERTYPUT),2) == 1) {
			rv = true;
		} else if (OstDel(Fix(InvokeKinds/this.INVOKE_PROPERTYPUTREF),2) == 1) {
			rv = true;
		}		
		return rv;
	}

	
	this.GetObjectByName  = function ( InterfaseName ) {
		rv = '';
		if (this.Library) {
			rv = this.Library.Interfaces.NamedItem(""+ InterfaseName );
		}
		return rv;
	}
	
	this.GetObjectDefault = function ( ) {
		rv = '';
		if (this.Library) {
			rv = this.Library.Interfaces.NamedItem(""+ this.DefaultInterfaseName );
		}
		return rv;
	}
	
		//Функция ПостроитьДанныеПоиска(Знач НомерИнформацииОТипе,Знач ТипыПоиска,НомерБиблиотеки=0,Скрытые = Ложь)
	this.NoMyMakeSearchData = function  (TypeInfoNumber) { //,127,0,false;)
		return 127 * 16777216 + (4096 +  TypeInfoNumber - 4096 * (TypeInfoNumber % 4096));
	} 
	
	// перебрать свойства, функции и методы интерфейса или сокласа легко, 
	// а вот получить более расширенную инфу по ним без этой процедуринки и 
	// без NoMyMakeSearchData у меня не получилось (((, ну ничего ))) ведь получилось......
	this.GetMemberOfObjectInfo = function( Member, Object ) {
		rv = 0;
		if ( Member && Object ) {
			SearchData = this.NoMyMakeSearchData( Object.TypeInfoNumber );
			rv = this.Library.GetMemberInfo ( SearchData, Member.InvokeKinds,  Member.MemberId, Member.Name);
		} 
		return rv;
	} 
	
	// Преобразовываем параметр типа вариант в строковое представление
	this.VarTypeToString = function ( VarType ) {
		rv = ""
		if (this.TypeStr.Exists( VarType )) {
			rv = this.TypeStr.Item( VarType );
		}
		return rv;
	}
	// Преобразовываем параметр типа вариант в строковое представление
	this.VarTypeToString2 = function ( VarType ) {
		rv = ""
		if (this.TypeStr2.Exists( VarType )) {
			rv = this.TypeStr2.Item( VarType );
		}
		return rv;
	}

	// Имеет ли параметр значение по умолчанию?
	this.ParamHaveDefValue = function( Param ) {
		rv = false;		
		if (Param.Default && Param.Optional) {
			rv = true;
		}
		return rv;
	}
		// Это обязательный параметр
	this.ParamIsBinding = function( Param ) {
		rv = false;		
		if (Param.Default || Param.Optional) {
			rv = true;
		}
		return rv;
	}
	
	this.insertInterfaseToDump = function (iName) {
    	var rv = trimSimple(LCase(iName));
		if(!this.InterfaseIsDump(rv)) {
			if(!this.InterfasesToDumpAll.Exists(iName)) {
				this.InterfasesToDumpAll.Add(iName,iName);
            }
        }
    }
	
	// Обработан ли интерфейс с пом. DumpInterfaseObject
	this.InterfaseIsDump = function( Name ) {
		return this.InterfasesToDumpAllready.Exists(trimSimple(LCase(Name)));
	}
	
		// Отметить что интерфейс выведен. DumpInterfaseObject
	this.InterfaseIsDumpMark = function  ( Name ) {
		if (!this.InterfaseIsDump(trimSimple(LCase(Name)))) { 
			this.InterfasesToDumpAllready.Add(trimSimple(LCase(Name)), trimSimple(LCase(Name)));
		} 		
	}
	this.GetReturnedTypeStr = function( Param )  {
		var vReturnedTypeStr = "String";		
		return vReturnedTypeStr = this.VarTypeToString2(Param.ReturnType.VarType);
	}

	
	// Возвращает строковое представление типа параметра
	// todo - тут зависает конкретно.....
	this.GetParamTypeStr = function( Param )  {
		ParamTypeStr = "";
		var ParaVarTypeInfo = Param.VarTypeInfo;
		ParaVarType  = ParaVarTypeInfo.VarType;
		Fixed = Fix ( ParaVarType / 4096);
		FlagVT_ARRAY = OstDel(Fixed, 2);
		FlagVT_VECTOR = OstDel( Fix( Fixed / 2),2);
		TypeVars = Fix(Fixed/4)*4*4096+(ParaVarType - Fixed);
		if (TypeVars == 0) { // Неопределено.....
			TKind = 0;
			do { // Будем выполнять пока нет ошибок
				try { 
					var InfoOfType = ParaVarTypeInfo.TypeInfo;
					var TIType =  ParaVarTypeInfo.TypeInfo;
					
					TIResolved = ParaVarTypeInfo.TypeInfo;
					TKind = TIResolved.TypeKind;

                } catch(e) {
					TKind = ParaVarTypeInfo.TypeInfo.TypeKind;
                }
				break;
			} while(true);
			
			while(TKind == this.TKIND_ALIAS) {
				TKind = TKIND_MAX;
				try { 
					TIResolved = TIResolved.ResolvedType;
					TKind = TIResolved.TypeKind;
                } catch(e) {
					break;
                }
			}
			
			if (TKind == 0) {
				ParamTypeStr = "?";
			} else {
				if (ParaVarTypeInfo.IsExternalType) {
					ParamTypeStr = ParaVarTypeInfo.TypeLibInfoExternal.Name+"."+TIType.Name;
				} else {
					ParamTypeStr = TIType.Name;
				}
			}
		} else {
			if (ParaVarTypeInfo.VarType != this.VT_VARIANT) {
				ParamTypeStr = this.VarTypeToString(Param.VarTypeInfo.VarType);
			} else {
				ParamTypeStr = "VT_VARIANT";
			}

		}
		if ( ParamTypeStr || ParamTypeStr == "")  {
			if (Param.VarTypeInfo.TypeInfoNumber != -1) {
				ParamTypeStr = Param.VarTypeInfo.TypeInfo.TypeKindString;
			} else {
				ParamTypeStr = this.VarTypeToString(Param.VarTypeInfo.VarType);
			}
		}
		return ParamTypeStr;
	}

	// Преобразовываем имя интерфейса для Интела
	// Дефолтный интерфейс у нас идет как просто прог-ид, остальные с приставкой из прог-ида.
	 this.MakeIName = function ( iName ) {
		nMakeIName = LCase(iName);
		if (LCase(nMakeIName) == LCase(this.DefaultInterfaseName)) { nMakeIName = "";}
		return this.ThisProgIDForIntel + nMakeIName;
	}
	
	// Сохраняем данные для словаря из Intellisence "TypesStructureExt" 
	this.SaveForTypesStructureExt = function (Interf1, FuncPropName, Interf2) {
		return;
		SaveStr = this.MakeIName(""+Interf1)+ "." + LCase(FuncPropName)+"," + "VALUE|"+this.MakeIName(""+Interf2)
		this.DumpStringToFile(SaveStr, this.FileNameTypesStructureExt);
		this.DumpStringToFile(this.MakeIName(""+Interf2)+","+Interf2, this.FileNameTypesStructureExtDef);
	}	


	// Вываливаем информацию по интерфейсу в окно сообщений...
	// и за одно не забываем генерить файлы для интеллиценза...
	// Name - имя интерфейса
	// AllStrIterf - пройденный путь к этому интерфейсу
	this.DumpInterfaseObject = function ( Name , AllStrIterf ) {
		//Message( "%% " + AllStrIterf + "." + Name
		//Message( "Информация по интерфейсу: " + Name
		var FindInterfases = ""; // найденные "по пути" интерфейсы...
		try { 
			var Object = this.GetObjectByName( "" + Name );
			var TrueMembers = Object.Members.GetFilteredMembers;
        } catch(e) {
			return;
        }
		IntsFileName = gIntelDir2 + '\\' + this.MakeIName(Name)+".ints";
		if (gFSO.FileExists(IntsFileName)) { gFSO.DeleteFile(IntsFileName,true); }
		var IntsFile = gFSO.CreateTextFile(IntsFileName);
		status("Генерируем: " + IntsFileName);
				
		for (i=1; i<TrueMembers.Count; i++) {
			var Member = TrueMembers.item(i);
			var MemberInfo = this.GetMemberOfObjectInfo ( Member, Object );
			var vStrForLVal = "";
			MemberIK = Member.InvokeKinds;
			if (this.AttrIsProps( MemberIK)) { //INVOKE_EVENTFUNC  событие				
				if(this.ModeLValRepresent == 1) {
					vStrForLVal = ' = '+this.MakeIName(Name)+'.'+Member.Name;
				} else {
					vStrForLVal = ' = '+Name+'.'+Member.Name;
                }
				if (MemberInfo.ReturnType.TypeInfoNumber != -1) {
					if (MemberInfo.ReturnType.TypeInfo.TypeKindString == "coclass") {
						// Если это соклас, тогда ищем интерфейс 
						//Message( " prop - " + Member.Name + " dispinterface " + MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name
						// FindInterfases = FindInterfases + '\n' + MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name;
						this.insertInterfaseToDump(MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name);
						this.SaveForTypesStructureExt(Name, Member.Name, MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name);
						if(this.ModeLValRepresent == 1) {
							vStrForLVal = this.MakeIName(MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name) + vStrForLVal;
						} else {
							vStrForLVal = MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name + vStrForLVal;
                        }
						
					} else if (MemberInfo.ReturnType.TypeInfo.TypeKindString == "dispinterface") {
						//Message( " prop - " + Member.Name + " " + MemberInfo.ReturnType.TypeInfo.TypeKindString + " " + MemberInfo.ReturnType.TypeInfo.Name
						//FindInterfases = FindInterfases + '\n' + MemberInfo.ReturnType.TypeInfo.Name;
						this.insertInterfaseToDump(MemberInfo.ReturnType.TypeInfo.Name);
						this.SaveForTypesStructureExt(Name, Member.Name, MemberInfo.ReturnType.TypeInfo.Name);
						if(this.ModeLValRepresent == 1) {
							vStrForLVal = this.MakeIName(MemberInfo.ReturnType.TypeInfo.Name) + vStrForLVal;
						} else {
							vStrForLVal = MemberInfo.ReturnType.TypeInfo.Name + vStrForLVal;
                        }
						
					} else {
						vRetValTp = this.GetReturnedTypeStr( MemberInfo );
						vStrForLVal = vRetValTp + vStrForLVal;
					} 
				} else {
					vRetValTp = this.GetReturnedTypeStr( MemberInfo );
					vStrForLVal = vRetValTp + vStrForLVal;
				} 
				
				IntsFile.WriteLine("0000 "+ Member.Name);
			} else if (this.AttrIsFunc ( MemberIK)) { //INVOKE_FUNC  функция/метод
				// Формируем строку метода....
				if(this.ModeLValRepresent == 1) {
					vStrForLVal = ' = '+this.MakeIName(Name)+'.'+Member.Name+'()';
				} else {
					vStrForLVal = ' = '+Name+'.'+Member.Name+'()';
                }
				StrForMessage = "";
				if (MemberInfo.ReturnType.TypeInfoNumber == -1) {
					StrForMessage = " meth - " + Member.Name;
				} else {
					StrForMessage = " func - " + Member.Name;				
				}
				ForFileString = Member.Name + "(";
				for (ParCnt = 1; ParCnt<MemberInfo.Parameters.Count; ParCnt++) {
					var Param = MemberInfo.Parameters.Item(ParCnt);
					// Param.Default = true -> Имеет значение по умолчанию = необязательный 
					//if flOutNameAndTypeParameters {
						if (Param.Default) { 
							StrForMessage = StrForMessage + "[";
						}
						StrForMessage = StrForMessage + Param.Name + " as " + this.GetParamTypeStr ( Param );
						if (Param.Default) { 
							StrForMessage = StrForMessage + "]";
						}	
					//} 
					if (ParCnt != MemberInfo.Parameters.Count) { ForFileString = ForFileString + ", ";}
					if (ParCnt != MemberInfo.Parameters.Count) { StrForMessage = StrForMessage + ", ";}
					StrForMessage = Replace(StrForMessage," ",""); // Убираем пробелы
					ForFileString = Replace(ForFileString," ",""); // Убираем пробелы
				}
				ForFileString = ForFileString + ")";
				StrForMessage = StrForMessage + ")";
				// Надо выяснить тип возвращаемого значения
				if (MemberInfo.ReturnType.TypeInfoNumber != -1) {
					if (MemberInfo.ReturnType.TypeInfo.TypeKindString == "dispinterface") {
						//FindInterfases = FindInterfases + '\n' + MemberInfo.ReturnType.TypeInfo.Name;
						this.insertInterfaseToDump(MemberInfo.ReturnType.TypeInfo.Name);
						StrForMessage = StrForMessage + " as Interfase " + MemberInfo.ReturnType.TypeInfo.Name;
						this.SaveForTypesStructureExt(Name, Member.Name, MemberInfo.ReturnType.TypeInfo.Name);
						if(this.ModeLValRepresent == 1) {
							vStrForLVal = this.MakeIName(MemberInfo.ReturnType.TypeInfo.Name) + vStrForLVal;
						} else {
							vStrForLVal = MemberInfo.ReturnType.TypeInfo.Name + vStrForLVal;
                        }
					} else if (MemberInfo.ReturnType.TypeInfo.TypeKindString == "coclass") {
						//FindInterfases = FindInterfases + '\n' + MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name;
						this.insertInterfaseToDump(MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name);
						this.SaveForTypesStructureExt(Name, Member.Name, MemberInfo.ReturnType.TypeInfo.DefaultInterface.Name);
						//FindInterfases = FindInterfases + '\n' + MemberInfo.ReturnType.TypeInfo.DefaultEventInterface.Name;
						this.insertInterfaseToDump(MemberInfo.ReturnType.TypeInfo.DefaultEventInterface.Name);
						this.SaveForTypesStructureExt(Name, Member.Name, MemberInfo.ReturnType.TypeInfo.DefaultEventInterface.Name);
						if(this.ModeLValRepresent == 1) {
							vStrForLVal = this.MakeIName(MemberInfo.ReturnType.TypeInfo.DefaultEventInterface.Name) + vStrForLVal;
                        } else {
							vStrForLVal = MemberInfo.ReturnType.TypeInfo.DefaultEventInterface.Name + vStrForLVal;							
						}
					}
				} else {
					vRetValTp = this.GetReturnedTypeStr( MemberInfo );
					vStrForLVal = vRetValTp + vStrForLVal;
				}
				ForFileString = "0000 " + ForFileString;
				if(MemberInfo.HelpString != "") {
					// Хелп не помешает, тем паче обрабатывается.
					ForFileString = ForFileString + " | " + MemberInfo.HelpString;
                }
				IntsFile.WriteLine(ForFileString);
			}
			if(vStrForLVal) {
				this.DumpStringToFile(vStrForLVal,gFileNameLvalCommon);
            }
		}		
		IntsFile.Close();
		this.InterfaseIsDumpMark(Name);
		var ara = toJSArray(this.InterfasesToDumpAll.Keys());
		//ArrNameOfIntrf = FindInterfases.split('\n');
		for (i=0; i< ara.length; i++) {
			iName = trimSimple(ara[i]);
			if (iName != "") { 
				if (!this.InterfaseIsDump(iName)) { 
					this.DumpInterfaseObject(iName, AllStrIterf + "." + Name);
				}
			}
		}
	} // this.DumpInterfaseObject = function
	
} //function ITypeLib() 

// Ключевая процедура генерации 
function IntsGenerator( ProgID ){
	var retVal = false;
	if (ProgIDIsDumped( ProgID )) return false;
	if (!IsProgID( ProgID ))  return false;
	var li = new ITypeLib;
	li.DebugFlag = true;
	li.flOutNameAndTypeParameters = false;
	//debugger;
	if (li.LoadLibrary( ProgID , true)) {
		vStr = "#секция объектов "+ProgID;		li.DumpStringToFile(vStr,gFileNameLvalCommon);
		retVal = true;
		AllStrIterf = "";		//debugger;
		li.DumpInterfaseObject(li.DefaultInterfaseName , AllStrIterf);
		
		
	} else if (li.ErrorNumber != 0) {
		//message ("Ошибка генерации файлов по прог-иду: " + li.ThisProgID, mExclamation);
	}
	return retVal;
}

function TestLibrary() {
	try { 
		TLITypeLibInfo = CreateObject("TLI.TypeLibInfo")
		TLIApplication = CreateObject("TLI.TLIApplication")	
		alert( "Библиотека: TLBINF32.DLL зарегистрирована! Все в порядке!" );
    } catch(e) {
		alert("Библиотека: TLBINF32.DLL не зарегистрирована на данном рабочем месте!");
    }
}



// Нам надо отдампить что:
//1. ints-файлы с именем интерфейса
//2. Для TypesStructureExt из Intellisence файл для вытяжки следующих данных
//	TypesStructureExt.Add "excel_application.range", "VALUE|excel_applicationrange"
//	TypesStructureExt.Add "excel_applicationrange.cells", "VALUE|excel_applicationcells"
//3 для OtherTypesDefine из из Intellisence файл для вытяжки следующих данных
//	OtherTypesDefine.Add "word.application", "word_application"
//4 Перечень прог-идов по которым уже сформированны данные или тех по которым нельзя формировать 
// такую информацию, из-за того, что объект, созданный по прог-иду может быть опасен.

function ComonGenerator( ) {
	IntsGenerator( "MSXML2.DOMDocument" );
	IntsGenerator( "Scripting.FileSystemObject" );
	IntsGenerator( "ADODB.Connection" );
	IntsGenerator( "WScript.Shell" );

	return ''; // остальные ради прикола.......
	IntsGenerator( "Excel.Application" );
	IntsGenerator( "Word.application" );
	IntsGenerator( "SYSINFO.SysInfo" );
	IntsGenerator( "Svcsvc.Service" );
	IntsGenerator( "v77.Application" );	
	IntsGenerator( "VBScript.RegExp" ); // нету там собирающего интерфейса (((( придется ручками....
	IntsGenerator( "SHPCE.Profiler" );
	IntsGenerator( "ODBCSQL.RarusSQL" );
	IntsGenerator( "TLI.TypeLibInfo" );
	IntsGenerator( "TLI.TLIApplication" );
	IntsGenerator( "Rarus.ApiExtender" );	
}