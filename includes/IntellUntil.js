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
