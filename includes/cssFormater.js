/* идея - https://stackoverflow.com/questions/11835894/tidy-css-for-notepad*/
function cssFormater() {
    this.s = '';
    this.len = 0;
	this.FormatCSS = function() {
    	var vRetVal = this.s, vReg1;
		//vReg1 = new RegExp('([\{;]+)([\r\n]+)\s([a-z])','ig');		vRetVal = vRetVal.replace(vReg1,'$1$2$3');

		vReg1 = new RegExp('([^\r\n;])\}(?![\r\n])','ig');		vRetVal = vRetVal.replace(vReg1,'$1;\r\n}\r\n');    	
 		vReg1 = new RegExp('([^\r\n])\}(?![\r\n])','ig');		vRetVal = vRetVal.replace(vReg1,'$1\r\n}\r\n');
		//vReg1 = new RegExp('([^\r\n])\{(?![\r\n])','ig');		vRetVal = vRetVal.replace(vReg1,'$1\r\n{\r\n'); - оставим скобку { наверху.
		vReg1 = new RegExp('([^\r\n])\{(?![\r\n])','ig');		vRetVal = vRetVal.replace(vReg1,'$1 {\r\n');
		vReg1 = new RegExp(';(?![\r\n])','ig');		vRetVal = vRetVal.replace(vReg1,';\r\n');
		//vReg1 = new RegExp('(^(?![ \t]).+;)','ig');		vRetVal = vRetVal.replace(vReg1,'    $1');
		vReg1 = new RegExp('\}(?!(\r?\n\r?\n))','ig');		vRetVal = vRetVal.replace(vReg1,'}\r\n');	
		vReg1 = new RegExp(':(?![ ])(?=.+;)','ig');		vRetVal = vRetVal.replace(vReg1,': ');
		
		vReg1 = new RegExp('([\{;]+)([\r\n]+)([a-z-])','ig');		vRetVal = vRetVal.replace(vReg1,'$1$2\t$3');

		return vRetVal;
    }
	this.MinifyCSS = function() {
		/* не тестировал */
    	var vRetVal = this.s, vReg1;
		vReg1 = new RegExp('[\r\n\t ]+','ig');		vRetVal = vRetVal.replace(vReg1,' ');
		vReg1 = new RegExp('[ ]*\}[ ]*','ig');		vRetVal = vRetVal.replace(vReg1,'}');
		vReg1 = new RegExp('[ ]*\{[ ]*','ig');		vRetVal = vRetVal.replace(vReg1,'{');
		vReg1 = new RegExp('[ ]*;[ ]*','ig');		vRetVal = vRetVal.replace(vReg1,';');
		vReg1 = new RegExp(';\}','ig');		vRetVal = vRetVal.replace(vReg1,'}');
		vReg1 = new RegExp('[ ]*:[ ]*','ig');		vRetVal = vRetVal.replace(vReg1,':');
		
		return vRetVal;		
	} 	
}