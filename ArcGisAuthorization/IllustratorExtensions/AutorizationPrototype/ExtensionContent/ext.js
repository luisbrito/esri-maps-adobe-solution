
function onLoaded() {
    var csInterface = new CSInterface();
	
	 var myPath = csInterface.getSystemPath(SystemPath.USER_DATA);
	 myPath += "/ArcGISillustrator.uid";
	 console.log(myPath);
	 var res = window.cep.fs.readFile(myPath);
	 console.log(res);
	 if (res.err == 0)
	 	window.location = "http://pod.arcgis.com/oauth/oauth-callback.html" + "#" + res.data;
	 else
	{
		 var mes = document.getElementById("messages");
		 mes.innerHTML = "Do not run this extension from menu";
	}
}




