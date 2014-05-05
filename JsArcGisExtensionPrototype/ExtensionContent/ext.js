
function onLoaded() {
    var csInterface = new CSInterface();
	
    
    var appName = csInterface.hostEnvironment.appName;
    
    if(appName != "FLPR"){
    	loadJSX();
    }    
    
    var appNames = ["ILST"];
    for (var i = 0; i < appNames.length; i++) {
        var name = appNames[i];
        if (appName.indexOf(name) >= 0) {
           var btn = document.getElementById("btn_" + name);
           if (btn)
                btn.disabled = false;
        }
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

function dowloadPdf(ppid) {
	
	// Get the path to save tmp file
	var inter = new CSInterface();
	var userPath = inter.getSystemPath(SystemPath.USER_DATA) + '/myTemp.pdf';
	
	// Create the request to download the PDF file
	var xhr = new XMLHttpRequest();
	xhr.open("GET", ppid, true);
	xhr.responseType = "blob";
	var blob;
	xhr.onload = function onReady(e){
		if (e.target.status == 200){
			
			// Convert got BLOB to URL something
			blob = this.response;
			var reader = new FileReader();
			
			reader.onload = function(){
				// remove the prefix from the text representation of file
				var prefix = "data:application/pdf;base64,";
				var len = prefix.length;
				var pdfBase = this.result;
				var l = pdfBase.length - len;
				var nakedPDF = pdfBase.substr(len,l);
				var res = window.cep.fs.writeFile(userPath, nakedPDF,"Base64");
				if(res.err != 0)
				{
					alert("Could not save PDF in local file system");
					return;
				}
				
				// Add PDF to Illustrator document
				var extScript = '$._ext_ILST.run("' + userPath + '")';
				inter.evalScript(extScript, function(pp){
					
					// Got here from the heart of Illustrator
					window.cep.fs.deleteFile(userPath);
					var newScript = '$._ext_ILST.xmpUpdate("102100;30e5fe3149c34df1ba922e6f5bbf808f")';
					inter.evalScript(newScript, function(ret){
						console.log("adding XMP");
					});
				});
				console.log("what");
			};
			// Go to convert
			reader.readAsDataURL(blob);
		}
		else
			alert("Could not download PDF file");
	};
	
	// Go to download
	xhr.send(null);
	console.log("Sent");
}
