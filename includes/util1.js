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
	for (i = 0; i<arr.length; i++ ) {
		tmS = arr[i].split(".");
		if (tmS.length == 1) {
			result = result + parseInt(tmS[0]);
		} else {
			result = result + parseInt(tmS[0])*60 + parseInt(tmS[1]);
		}
	}
	if (result <= 0) {
		alert("Нужно выделить числа, типа: 15, 2.20, 20, 25")
	}
		
	var resultH = (result / 60);
	tmS = (""+resultH).split(".")[0];
	resultH = ""+(result % 60);
	resultH = resultH + "000";
	resultH = resultH.substring(0,2);
	tmS = tmS + "."+resultH;
	
	alert(selText+" = " + tmS);
	result = parseFloat(tmS);
}
jN.scriptsMenu = (!jN.scriptsMenu) ? {} : jN.scriptsMenu;
scriptsMenu = jN.scriptsMenu; // глобальная переменная с меню скриптами.

var myTimeAdditionItem = {
    text: "Time addition", 
    ctrl: true,
    shift: false,
    alt: false,
    key: 0, // "I"
    cmd: timeAddition
};
addHotKey(myTimeAdditionItem); scriptsMenu.addItem(myTimeAdditionItem);

//timeAddition();
