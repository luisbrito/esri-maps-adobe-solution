/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, window, location, CSInterface, SystemPath, themeManager*/

require([
    "dojo/on","esri/arcgis/Portal", "esri/request", "esri/arcgis/utils","js/themeManager.js"

], function (on, esriPortal, esriRequest, arcgisUtils){
    //var csInterface = new CSInterface();
	var currTabId = "tabSearch";
	var currTitleId = "searchTitle";
    var portalUrl = 'http://www.arcgis.com';
    var searchURL = "http://www.arcgis.com/sharing/rest/search";
    var portalProps = null;
    var currentSearchPattern = "";
    var portal = null;
    
    // Init events for changing themes
    themeManager.init();
    
    // Init event handlers
    
    // Selecting tab with layers in the map
    var titleML = document.getElementById("mapLayersTitle");
    titleML.addEventListener("click",mapLayerClick);
    
    // Selecting tab with search controls
    var titleSrch = document.getElementById("searchTitle");
    titleSrch.addEventListener("click",searchClick);
    
    // Selecting tab with extension settings
    var titleSet = document.getElementById("settingTitle");
    titleSet.addEventListener("click",settingClick);
    
    // Init ArcGIS portal
    portal = new esriPortal.Portal(portalUrl);
    on(portal, 'load', function (p) {
        portalProps = p.target;
        arcgisUtils.arcgisUrl = portalProps.portalUrl + "content/items";
        
        // Init event handlers for search start
        var searcIcon = document.getElementById("searchImg");
        searcIcon.addEventListener("click",startSearch);
        var searcText = document.getElementById("searchTextId");
        searcText.addEventListener("keyup",function (ev){
            if (ev.keyCode == 13)
                startSearch();
        });
    });
    
    // Change look of previously selected tab (make it unselected)
	function unselectPrev() {
		var currTitle = document.getElementById(currTitleId);
		if(currTitle.classList.contains("selected"))
			currTitle.classList.remove("selected");
		if(currTitle.classList.contains("bgTabColor"))
			currTitle.classList.remove("bgTabColor");
		if(currTitle.classList.contains("fnTabColor"))
			currTitle.classList.remove("fnTabColor");
		currTitle.classList.add("unselected");
		
		var currTab = document.getElementById(currTabId);
		if(currTab.classList.contains("visibleTab"))
			currTab.classList.remove("visibleTab");
		currTab.classList.add("hiddenTab");
	}
    
    // Select tab with layers in the map
	function mapLayerClick() {
		if (currTabId == "tabMapLayers")
			return;
			
		unselectPrev();
		
		var title = document.getElementById("mapLayersTitle");
		if(title.classList.contains("unselected"))
			title.classList.remove("unselected");
		title.classList.add("selected");
        title.classList.add("bgTabColor");
        title.classList.add("fnTabColor");
        
		
		var tab = document.getElementById("tabMapLayers");
		if(tab.classList.contains("hiddenTab"))
			tab.classList.remove("hiddenTab");
		tab.classList.add("visibleTab");
		
		currTabId = "tabMapLayers";
		currTitleId = "mapLayersTitle";
	}
    
    // Select tab with search controls
	function searchClick() {
		if (currTabId == "tabSearch")
			return;
			
		unselectPrev();
		
		var title = document.getElementById("searchTitle");
		if(title.classList.contains("unselected"))
			title.classList.remove("unselected");
		title.classList.add("selected");
        title.classList.add("bgTabColor");
        title.classList.add("fnTabColor");
		
		var tab = document.getElementById("tabSearch");
		if(tab.classList.contains("hiddenTab"))
			tab.classList.remove("hiddenTab");
		tab.classList.add("visibleTab");
		
		currTabId = "tabSearch";
		currTitleId = "searchTitle";
	}
    
    // Select tab with settings
	function settingClick() {
		if (currTabId == "tabSetting")
			return;
			
		unselectPrev();
		
		var title = document.getElementById("settingTitle");
		if(title.classList.contains("unselected"))
			title.classList.remove("unselected");
		title.classList.add("selected");
        title.classList.add("bgTabColor");
        title.classList.add("fnTabColor");
		
		var tab = document.getElementById("tabSetting");
		if(tab.classList.contains("hiddenTab"))
			tab.classList.remove("hiddenTab");
		tab.classList.add("visibleTab");
		
		currTabId = "tabSetting";
		currTitleId = "settingTitle";
	}
    
    function startSearch() {
        var rootElem = document.getElementById("foundList");
        rootElem.innerHTML = "";
        var searchText = document.getElementById("searchTextId").value;
        if (currentSearchPattern == searchText)
            return;
        var serviceCount = document.getElementById("foundCount").value;
        var whatToSearch = document.getElementById("resourceToFind").value;
        if (whatToSearch == "vector")
            whatToSearch = "%20AND%20type%3A%22feature%20service%22";
        else
            whatToSearch = "%20AND%20type%3A%22image%20service%22";
        var qParams = {
            q: searchText + whatToSearch
        };
        /*portal.queryItems(qParams).then(
            function (response){
                console.log(response);
                //showSearchResults(response.results);
            }, function (err) {
                console.log(err);
                //alert(err.message);
            });*/
        var reqUrl = searchURL + "?q=" + searchText + whatToSearch + "&num=" + serviceCount + "&f=pjson";
        var layersRequest = esriRequest( {
			url: reqUrl,
			handleAs: "json",
			callbackParamName: "callback"
		} );
        layersRequest.then(
            function (response){
                showSearchResults(response.results);
            }, function (err) {
                alert(err.message);
            });
    }
    
    function showSearchResults(results) {
        
        // Clear the list of found resources
        var rootElem = document.getElementById("foundList");
        /*while (rootElem.hasChildNodes()) {
            rootElem.removeChild(rootElem.firstChild);
        }*/
        if (results.length == 0)
            rootElem.innerHTML = "No items found";
        
        for ( var i = 0; i < results.length; i++) {
            var servDiv = document.createElement("div");
            var servThumb = document.createElement("img");
            servThumb.src = arcgisUtils.arcgisUrl + "/" + results[i].id + "/info/" + results[i].thumbnail;
            servThumb.classList.add("imageSize");
            servDiv.classList.add("serviceItem");
            servDiv.classList.add("bgMainColor");
            var servName = document.createElement("span");
            servName.classList.add("textMargs");
            servName.innerHTML = results[i].title;
            servDiv.appendChild(servThumb);
            servDiv.appendChild(servName);
            rootElem.appendChild(servDiv);
        }
    }
                
        /*$("#btn_test").click(function () {
            csInterface.evalScript('sayHello()');
        });*/
});