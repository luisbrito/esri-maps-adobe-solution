
function onLoaded() {
    var csInterface = new CSInterface();
	
    
    var appName = csInterface.hostEnvironment.appName;
    
    if(appName != "FLPR"){
    	loadJSX();
    }    
}




    
/**
 * Load JSX file into the scripting context of the product. All the jsx files in 
 * folder [ExtensionRoot]/jsx will be loaded. 
 */
function loadJSX() {
    var csInterface = new CSInterface();
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript('$._ext.evalFiles("' + extensionRoot + '")');
}

function evalScript(script, callback) {
    new CSInterface().evalScript(script, callback);
}
