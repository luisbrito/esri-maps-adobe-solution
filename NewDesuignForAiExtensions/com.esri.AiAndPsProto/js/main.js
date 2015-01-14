/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, window, location, CSInterface, SystemPath, themeManager*/

require([
    "js/themeManager.js"

], function (dom, domClass){
    //var csInterface = new CSInterface();
	var currTabId = "tabSearch";
	var currTitleId = "searchTitle";
    
    themeManager.init();
    var titleML = document.getElementById("mapLayersTitle");
    titleML.addEventListener("click",mapLayerClick);
    
    var titleSrch = document.getElementById("searchTitle");
    titleSrch.addEventListener("click",searchClick);
    
    var titleSet = document.getElementById("settingTitle");
    titleSet.addEventListener("click",settingClick);
    
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
                
        /*$("#btn_test").click(function () {
            csInterface.evalScript('sayHello()');
        });*/
});