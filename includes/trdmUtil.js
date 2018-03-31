/* —кладывает минуты в форме: 
15, 2.20, 20, 25 = 3.20 где 3,20 - 3 часа, 20 минут
35, 50, 40, 55, 45, 40
*/
//(c)trdmval@gmail.com 2017-12-28 11:23:09
function timeAddition()
{
	var selText = "15, 2.20, 20, 25";// Editor.currentView.selection;
	selText = Editor.currentView.selection;
	selText = selText.replace("+",",");
	var arr = new Array;
	arr = selText.split(",");
	//debugger;
	
	var result = 0;
	var tmS = "";
	var i = 0;
	var parseRes = 0;
	for (i = 0; i<arr.length; i++ ) {
		tmS = arr[i].split(".");
		if (tmS.length == 1) {
			parseRes = parseInt(tmS[0]);
			if(parseRes < 5) {
				parseRes *= 60;
            }
		} else {
			parseRes = parseInt(tmS[0])*60 + parseInt(tmS[1]);
		}
		result +=  parseRes;
	}
	if (result <= 0) {
		alert("Нужно выделить числа, типа: 15, 2.45, 20, 25")
	}
		
	var resultH = (result / 60);
	tmS = (""+resultH).split(".")[0];
	resultH = (result % 60);
	if(resultH<10) {
		resultH = '0'+resultH;
    } else {
		resultH = resultH + "000";
		resultH = resultH.substring(0,2);
    }
	tmS = tmS + "."+resultH;
	EditorMessage(selText+" = " + tmS);
	//alert(selText+" = " + tmS);
	result = parseFloat(tmS);
}
jN.scriptsMenu = (!jN.scriptsMenu) ? {} : jN.scriptsMenu;
scriptsMenu = jN.scriptsMenu; // глобальная переменная с меню скриптами.

var myTimeAdditionItem = {
    text: "Time addition(2.45+20 = 3.05)\tCtrl+Shift+D", 
    ctrl: true,
    shift: true,
    alt: false,
    key: 0x44, // "I"
    cmd: timeAddition
};
scriptsMenu.addSeparator();
addHotKey(myTimeAdditionItem); scriptsMenu.addItem(myTimeAdditionItem);

/*
QString Dialog::translateString(const QString &arg1, int var)
{
	QString txt_end = "";
    QString txt = arg1;
	switch (var) {
	case 1:	{
        txt = arg1.trimmed();
        QString ruChars = QString::fromUtf8("А,а,Б,б,В,в,Г,г,Д,д,Е,е,Ё,ё,  Ж,ж,  З,з,И,и,Й,й,К,к,Л,л,М,м,Н,н,О,о,П,п,Р,р,С,с,Т,т,У,у,Ф,ф,Х,х,  Ц,ц,  Ч,ч,  Ш,ш,  Щ,щ,      Ы,ы,Э,э,Ю,ю,  Я,я,  Ъ,ъ,Ь,ь");
        QString laChars = "A,a,B,b,V,v,G,g,D,d,E,e,YE,ye,ZH,zh,Z,z,I,i,Y,y,K,k,L,l,M,m,N,n,O,o,P,p,R,r,S,s,T,t,U,u,F,f,KH,kh,TS,ts,CH,ch,SH,sh,SHCH,shch,Y,y,E,e,YU,yu,YA,ya,_,_,_,_";
        QString laCharsAll = "A a,B b,C c,D d,E e,F f,G g,H h,I i,J j,K k,L l,M m,N n,O o,P p,Q q,R r,S s,T t,U u,V v,W w,X x,Y y,Z z";
        laCharsAll = laCharsAll.replace(" ",",");
        QMap<QString,QString> chMap;
        QStringList st_ru = ruChars.split(",");
        QStringList st_la = laChars.split(",");
        QStringList st_laAll = laCharsAll.split(",");

        QStringList st_NumberAll;
        st_NumberAll << "0"  << "1"  << "2"  << "3"  << "4"  << "5"  << "6"  << "7"  << "8"  << "9";

        if (st_ru.size() == st_la.size()){
            for(int i = 0; i<st_la.size(); i++){
                chMap[st_ru.at(i).trimmed()] = st_la.at(i).trimmed();
            }
        }
        QString txt_ch_ru, txt_ch_la;
        for(int i = 0; i<txt.count(); i++){
            txt_ch_ru = txt.at(i);
            txt_ch_la = "_";
            if (chMap.contains(txt_ch_ru)){
                txt_ch_la = chMap.value(txt_ch_ru);
            } else if (st_laAll.contains(txt_ch_ru)){
                txt_ch_la = txt_ch_ru;
            } else if (st_NumberAll.contains(txt_ch_ru)){
                txt_ch_la = txt_ch_ru;
            }
            txt_end.append(txt_ch_la);
        }
        while (txt_end.indexOf("__") != -1) {
            txt_end = txt_end.replace("__","_");
        }
        txt_end = txt_end.left(100);

		break;
	}
	case 2:	{
        txt = arg1.trimmed();

		QChar txt_ch;
		QString txt_t;
        txt_end.append(txt).append(",\"");
        if (txt.count()>0){
            txt_end.append(txt.at(0));
        }

		for(int i = 1; i<txt.count(); i++){
			txt_ch = txt.at(i);
			txt_t = txt_ch;
			if (txt_ch.isLetter())
				if (!txt_ch.isLower()){
					txt_t = QString(" ").append(txt_ch.toLower());
				}
				txt_end.append(txt_t);
			}

		txt_end.append("\"");

		break;
	}
    case 3:	{
        txt = arg1.trimmed();
        QString empStr(" ");
        txt_end = txt;
        txt_end = txt_end.replace(QString("\n\r"),empStr);
        txt_end = txt_end.replace(QString("\n"),empStr);
        txt_end = txt_end.replace(QString("\r"),empStr);
        break;

    }
    case 4:	{
        // Объединить абзацы в строки.
        txt_end = txt;
        QStringList list = txt_end.split("\n");
        int cnt = list.count();
        QString resStr, curStr;
        QChar charItem;
        bool newLine = false;

        if (cnt > 0) {
            resStr = list.at(0);
            for (int i=1; i<cnt; i++){
                curStr = list.at(i);
                newLine = false;

                if (curStr.length()>0){
                    charItem = curStr.at(0);
                    newLine = charItem.isDigit() || charItem.isSpace() || (charItem.isLetter() && charItem.isUpper());
                }
                if (newLine){
                    resStr.append("\n");
                } else {
                    resStr.append(" ");
                }
                resStr.append(curStr);
            }
        }
        txt_end = resStr;
        txt_end.append("\n");
        break;
    }
    case 6:	{
        // Qwertyu -> Йцукенг
        txt_end = ""; //Результат. txt - исходник;
        QString latQwerty = QString::fromUtf8("qwertyuiop[]asdfghjkl;'zxcvbnm,..QWERTYUIOP[]ASDFGHJKL;'ZXCVBNM,./");
        QString rusQwerty = QString::fromUtf8("йцукенгшщзхъфывапролджэячсмитьбю.ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ.");
        int pos = 0;
        for (int i = 0; i<txt.length(); i++){
            QChar cCur = txt.at(i);
            pos = latQwerty.indexOf(cCur);
            if (pos != -1) {
                cCur = rusQwerty.at(pos);
            }
            txt_end.append(cCur);
        }
        break;
    }
    case 5:	{
        // Порезать строки на N символов
        txt_end = txt;
        int sLen = ui->lineLength->text().toInt();
        if (sLen<=0 || sLen<=10 || sLen > 150) {
            break;
        }

        QStringList list = txt_end.split("\n");
        int cnt = list.count();
        QString resStr, curStr;
        QChar charItem;
        for (int i=0; i<cnt; i++){
            curStr = list.at(i);
            int steps = curStr.length()/sLen;
            for (int s = 1; s<=steps; s++){
                int cPosS = s*sLen;
                int cPosE = (s-1)*sLen;
                while(cPosS > cPosE) {
                    charItem = curStr.at(cPosS);
                    if (charItem.isSpace()){
                        curStr[cPosS] = QChar('\n');
                        break;
                    }
                    cPosS--;
                }
            }

            resStr.append(curStr).append("\n");
        }

        txt_end = resStr;
//        txt_end.append("\n");
        break;
    }

	default:
		break;
	}
	return txt_end;
}
*/
