/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, window, location, CSInterface, SystemPath, themeManager*/
var map;
require([
    "dojo/on", "esri/arcgis/Portal", "esri/request", "esri/arcgis/utils", "esri/IdentityManager",
    "esri/map", "esri/layers/FeatureLayer", "esri/SpatialReference", "dojo/domReady!", "js/themeManager.js"

], function (on, esriPortal, esriRequest, arcgisUtils, idManager, Map, FeatureLayer, SpatialReference) {
    'use strict';
    var csInterface = new CSInterface();
	var currTabId = "tabSearch";
	var currTitleId = "searchTitle";
    var portalUrl = 'http://www.arcgis.com';
    var searchURL = "http://www.arcgis.com/sharing/rest/search";
    var portalProps = null;
    var currentSearchPattern = "";
    var portal = null;
    var selectedService = "";
    var addedServiceList = [];
    var wasServAddActivated = false;
    var wasLayerAddActivated = false;
    var layerCount = 0;
    var currentLayer = 0;
    var selectedLayer = "";
    var userAuth = null;
    var layerList = [];
    
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
        map = new Map("mapDiv",{basemap:"topo", center: [-122.45,37.75], zoom:2});
        dojo.connect( map, "onLoad", onMapLoad );
        
        // Init event handlers for search start
        var searcIcon = document.getElementById("searchImg");
        searcIcon.src = "./icons/ZoomGeneric16.png"
        searcIcon.addEventListener("click",startSearch);
        var searcText = document.getElementById("searchTextId");
        searcText.addEventListener("search",function (ev){
            if (ev.target.value == "") {
                document.getElementById("foundList").innerHTML = "";
                if (wasServAddActivated) {
                    document.getElementById("addServBtn").removeEventListener("click", onPlusClik);
                    document.getElementById("addServBtn").src = "./icons/AddContent16BW.png";
                    wasServAddActivated = false;
                }
                selectedService = "";
            }
            else
                startSearch();
        });
        document.getElementById("signBtn").src = "./icons/SignIn16.png";
        document.getElementById("signBtn").attributes["userStatus"] = "no";
        document.getElementById("signBtn").addEventListener("click", onSignClick);
        document.getElementById("bottomToolBar").innerHTML = "Ready ...";
        document.getElementById("layerDown").attributes["hasHandler"] = "no";
        document.getElementById("layerUp").attributes["hasHandler"] = "no";
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
        
        // If Search tab was active, remove its event listeners
        if (wasServAddActivated) {
            document.getElementById("addServBtn").removeEventListener("click", onPlusClik);
            document.getElementById("addServBtn").src = "./icons/AddContent16BW.png";
            wasServAddActivated = false;
        }
        
        // If Map Layaers tab was active, remove its event listeners
        if (wasLayerAddActivated) {
            document.getElementById("loupe").removeEventListener("click", onLoupeClick);
            document.getElementById("loupe").src = "./icons/LayerZoomTo16BW.png";
            document.getElementById("deleteBtn").removeEventListener("click", deleteLayer);
            document.getElementById("deleteBtn").src = "./icons/LayerRemove16BW.png";
            document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16BW.png";
            if (document.getElementById("layerUp").attributes["hasHandler"] == "yes") {
                document.getElementById("layerUp").removeEventListener("click",moveUp);
                document.getElementById("layerUp").attributes["hasHandler"] = "no";
            }
            document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16BW.png";
            if (document.getElementById("layerDown").attributes["hasHandler"] == "yes") {
                document.getElementById("layerDown").removeEventListener("click",moveDown);
                document.getElementById("layerDown").attributes["hasHandler"] = "no";
            }
            wasLayerAddActivated = false;
        }
	}
    
    // Select tab with layers in the map
	function mapLayerClick() {
		if (currTabId == "tabMapLayers")
			return;
			
		unselectPrev();
		
        // Make Map layer list Tab Title selected
		var title = document.getElementById("mapLayersTitle");
		if(title.classList.contains("unselected"))
			title.classList.remove("unselected");
        title.classList.add("fnTabColor");
		title.classList.add("selected");
        title.classList.add("bgTabColor");
        
		
        // Make Map layer list Tab visible
		var tab = document.getElementById("tabMapLayers");
		if(tab.classList.contains("hiddenTab"))
			tab.classList.remove("hiddenTab");
		tab.classList.add("visibleTab");
		
		currTabId = "tabMapLayers";
		currTitleId = "mapLayersTitle";
        
        // If there is a selected layer, add event listener
        if ((!wasLayerAddActivated) && (selectedLayer != "")) {
            document.getElementById("loupe").addEventListener("click",onLoupeClick);
            document.getElementById("loupe").src = "./icons/LayerZoomTo16.png";
            document.getElementById("deleteBtn").addEventListener("click",deleteLayer);
            document.getElementById("deleteBtn").src = "./icons/LayerRemove16.png";
            
            var layer = document.getElementById(selectedLayer);
            var last = document.getElementById("mapLayerList").lastElementChild.lastElementChild;
            var first = document.getElementById("mapLayerList").firstElementChild.firstElementChild;
            // Check: whether we can move it down
            if ((layer.id == last.id) || /* The last layer in the map (index == 0)*/
                ((layer.attributes["itemType"] == "service_descr") && /* the root of the service*/
                 (last.attributes["servId"] == layer.attributes["servId"])) /* the last service in the map*/
                || ((layer.attributes["itemType"] == "service_layer") && /* simple layer ( not service)*/
                    (layer.parentNode.lastElementChild.id == layer.id))) /* the ;ast layer in the service*/ {
                // it cannot be moved down
                document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16BW.png";
                if (document.getElementById("layerDown").attributes["hasHandler"] == "yes") {
                    document.getElementById("layerDown").removeEventListener("click",moveDown);
                    document.getElementById("layerDown").attributes["hasHandler"] = "no";
                }
            }
            else {
                // it can be moved down
                document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16.png";
                document.getElementById("layerDown").addEventListener("click",moveDown);
                document.getElementById("layerDown").attributes["hasHandler"] = "yes";
            }

            // Check: whether we can move it up
            if ((layer.id == first.id) /* the first service in the map*/
                || ((layer.attributes["itemType"] == "service_layer") /* simple layer (not service)*/
                    && (layer.previousSibling.attributes["itemType"] == "service_descr"))) /* first layer in the service*/ {
                // it cannot be moved up
                document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16BW.png";
                if (document.getElementById("layerUp").attributes["hasHandler"] == "yes") {
                    document.getElementById("layerUp").removeEventListener("click",moveUp);
                    document.getElementById("layerUp").attributes["hasHandler"] = "no";
                }
            }
            else {
                // it can be moved up
                document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16.png";
                document.getElementById("layerUp").addEventListener("click",moveUp);
                document.getElementById("layerUp").attributes["hasHandler"] = "yes";
            }
            wasLayerAddActivated = true;
        }
	}
    
    // Select tab with search controls
	function searchClick() {
		if (currTabId == "tabSearch")
			return;
			
		unselectPrev();
		
        // Make Search Tab Title selected
		var title = document.getElementById("searchTitle");
		if(title.classList.contains("unselected"))
			title.classList.remove("unselected");
		title.classList.add("selected");
        title.classList.add("bgTabColor");
        title.classList.add("fnTabColor");
		
        // Make Search Tab visible
		var tab = document.getElementById("tabSearch");
		if(tab.classList.contains("hiddenTab"))
			tab.classList.remove("hiddenTab");
		tab.classList.add("visibleTab");
		
        // If there is a selected service, add event listener
        if ((!wasServAddActivated) && (selectedService != "")) {
            document.getElementById("addServBtn").addEventListener("click",onPlusClik);
            document.getElementById("addServBtn").src = "./icons/AddContent16.png";
            wasServAddActivated = true;
        }
        
		currTabId = "tabSearch";
		currTitleId = "searchTitle";
	}
    
    // Select tab with settings
	function settingClick() {
		if (currTabId == "tabSetting")
			return;
			
		unselectPrev();
		
        // Make Setting Tab Title selected
		var title = document.getElementById("settingTitle");
		if(title.classList.contains("unselected"))
			title.classList.remove("unselected");
		title.classList.add("selected");
        title.classList.add("bgTabColor");
        title.classList.add("fnTabColor");
		
        // Make Setting Tab visible
		var tab = document.getElementById("tabSetting");
		if(tab.classList.contains("hiddenTab"))
			tab.classList.remove("hiddenTab");
		tab.classList.add("visibleTab");
		
		currTabId = "tabSetting";
		currTitleId = "settingTitle";
	}
    
    function startSearch() {
        var searchText = document.getElementById("searchTextId").value;
        
        // Empty result of previous search
        var rootElem = document.getElementById("foundList");
        rootElem.innerHTML = "";
        
        // Inform user about current operation
        var status = document.getElementById("bottomToolBar");
        if(status.classList.contains("hostFontColor"))
            status.classList.remove("hostFontColor");
        else if (status.classList.contains("redFont"))
            status.classList.remove("hostFontColor");
        if (!status.classList.contains("blueFont"))
            status.classList.add("blueFont");
        status.innerHTML = "Searching ..."
        
        // Construct the search request
        selectedService = "";
        if (wasServAddActivated) {
            document.getElementById("addServBtn").removeEventListener("click", onPlusClik);
            document.getElementById("addServBtn").src = "./icons/AddContent16BW.png";
            wasServAddActivated = false;
        }
        wasServAddActivated = false;
        addedServiceList = [];
        if (currentSearchPattern == searchText)
            return;
        var serviceCount = document.getElementById("foundCount").value;
        var whatToSearch = document.getElementById("resourceToFind").value;
        if (whatToSearch == "vector")
            whatToSearch = " AND type:\"feature service\"";
        else
            whatToSearch = " AND type:\"image service\"";
        var qParams = {
            q: searchText + whatToSearch,
            sortField:""
        };
        portal.queryItems(qParams).then(
            function (response){
                showSearchResults(response.results);
            }, function (err) {
                var status = document.getElementById("bottomToolBar");
                status.classList.remove("blueFont");
                status.classList.add("redFont");
                status.innerHTML = "error: " + err.message;
            });
    }
    
    function showSearchResults(results) {
        
        // Clear the list of found resources
        var rootElem = document.getElementById("foundList");
        if (results.length == 0)
            rootElem.innerHTML = "No items found";
        var whatToSearch = document.getElementById("resourceToFind").value;
        
        for ( var i = 0; i < results.length; i++) {
            var servDiv = document.createElement("div");
            servDiv.id =results[i].id;
            
            // Create thumb
            var servThumb = document.createElement("img");
            servThumb.src = arcgisUtils.arcgisUrl + "/" + results[i].id + "/info/" + results[i].thumbnail;
            servThumb.classList.add("imageSize");
            servDiv.appendChild(servThumb);
            
            // Create Service name
            var servName = document.createElement("span");
            servName.classList.add("textMargs");
            servName.innerHTML = results[i].title;
            servDiv.appendChild(servName);
            
            // Define div properties
            servDiv.classList.add("serviceItem");
            servDiv.classList.add("mainBorderColor");
            servDiv.attributes["servUrl"] = results[i].url;
            servDiv.attributes["thumbUrl"] = servThumb.src;
            servDiv.attributes["srvTitle"] = results[i].title;
            servDiv.attributes["serviceType"] = whatToSearch;
            rootElem.appendChild(servDiv);
            servDiv.addEventListener("click", servClick);
        }
        
        var status = document.getElementById("bottomToolBar");
        status.classList.remove("blueFont");
        status.classList.add("hostFontColor");
        status.innerHTML = "Ready ..."
    }
    
    // Selection of a service
    function servClick(ev)
    {
        if (ev.currentTarget.id == selectedService)
            return;
        
        // Unselect previous service
        if (selectedService != "") {
            var prev = document.getElementById(selectedService);
            if (prev) {
                if (prev.classList.contains("selectedItem"))
                    prev.classList.remove("selectedItem");
            }
        }
        
        // Select new service
        selectedService = ev.currentTarget.id;
        ev.currentTarget.classList.add("selectedItem");
        if (!wasServAddActivated) {
            document.getElementById("addServBtn").addEventListener("click",onPlusClik);
            document.getElementById("addServBtn").src = "./icons/AddContent16.png";
            wasServAddActivated = true;
        }
    }
    
    // Maybe it isn't necessary
    function onMapLoad() {
        map.resize();
        document.getElementById("zoomFull").src = "./icons/ZoomFullExtent16.png";
        document.getElementById("zoomFull").addEventListener("click", toFullExtent);
    }
    
    // Adding layers of the selected service into the map
    function onPlusClik() {
        
        if (document.getElementById(selectedService).attributes["serviceType"] != "vector") {
            alert("Oops! Only feature service");
            return;
        }
        
        if (addedServiceList.indexOf(selectedService) > -1) {
            alert("Oops! Layers of the service are in the map already");
            return;
        }
        
        // Inform user about current operation
        var status = document.getElementById("bottomToolBar");
        if(status.classList.contains("hostFontColor"))
            status.classList.remove("hostFontColor");
        else if (status.classList.contains("redFont"))
            status.classList.remove("hostFontColor");
        if (!status.classList.contains("blueFont"))
            status.classList.add("blueFont");
        status.innerHTML = "Requesting layers of the service ..."
        
        // Send the request
        var servURL = document.getElementById(selectedService).attributes["servUrl"];
        var layerReq = esriRequest({
            url: servURL + "?f=pjson",
            handleAs: "json",callbackParamName: "callback"
        });
        layerReq.then(
            function (response) {
                //console.log(response);
                addServiceInMap(response);
            },
            function (err) {
                var status = document.getElementById("bottomToolBar");
                status.classList.remove("blueFont");
                status.classList.add("redFont");
                status.innerHTML = "error: " + err.message;
            });
    }
    
    // Adding layers of a service into the map
    function addServiceInMap (servDescription) {
        if (selectedService == "")
            return;
        if (servDescription.layers.length == 0)
            return;
        var servElement = document.getElementById(selectedService);
        currentLayer = 0;
        layerCount = servDescription.layers.length;
        for (var i = 0; i < servDescription.layers.length; i++) {
            var fLayer = new FeatureLayer(servElement.attributes["servUrl"] + "/" + i,{id: servElement.id + "_" + i});
            var layer = map.addLayer(fLayer);
            layer.service = servElement.id;
            layer.myName = servDescription.layers[i].name;
            layer.myExt = servDescription.initialExtent;
            layer.servExtent = servDescription.fullExtent;
            layer.myIndex = i;
            layerList[i] = null;
            layer.on ("load", onLayerLoad);
        }
    }
    
    // Adding layer loaded in the map into the list of map layers
    function onLayerLoad (layer) {
        
        layerList[layer.layer.myIndex] = layer.layer;
        currentLayer ++;
        var myExt = null;
        
        if (currentLayer == layerCount) {
            // All layers are ready, build element with layer list
            var status = document.getElementById("bottomToolBar");
            status.classList.remove("blueFont");
            status.classList.add("hostFontColor");
            status.innerHTML = "Ready ..."
            layerCount = 0;
            currentLayer = 0;
            
            // Check whether was really loaded something
            var isOK = false;
            for (var j = 0; j < layerList.length; j++) {
                if (layerList[j] != null) {
                    isOK = true;
                    break;
                }
            }
            
            if (!isOK) {
                // No one layer was loaded
                layerList = [];
                return;
            }
            
            // build element with layer list
            var servRoot = makeRootForService (layer.layer.service, layer.layer.servExtent);
            for (var i = (layerList.length -1); i >= 0; i--) {
                if (layerList[i] == null)
                    continue;
                if (!myExt)
                    myExt = layerList[i].myExt;
                var lDiv = document.createElement("div");
                lDiv.id = layerList[i].id;
                lDiv.attributes["itemType"] = "service_layer";
                lDiv.attributes["servId"] = layer.layer.service;

                // Element style
                lDiv.classList.add("serviceItem");
                lDiv.classList.add("mainBorderColor");

                // Image corresponding leaf node of the layer list
                var lThumb = document.createElement("img");
                lThumb.src = "./icons/EditingCircleTool16BW.png";
                lThumb.classList.add("imageSize");
                lThumb.classList.add("layerMargs");
                lDiv.appendChild(lThumb);

                // The name of the layer
                var lName = document.createElement("span");
                lName.classList.add("textMargs");
                lName.innerHTML = layerList[i].myName;
                lDiv.appendChild(lName);

                servRoot.appendChild(lDiv);
                lDiv.addEventListener("click",onLayerClick);        
            }
            // Zoom to extent of adding service
            if (myExt)
                zoomToExt(myExt);
            layerList = [];
        }
    }
    
    // Adding service element in the map layer list
    function makeRootForService (servId, ext){
        var servElement = document.getElementById(servId);
        var rootElem = document.getElementById("mapLayerList");
        
        // Create div element containing service contents
        var newDiv = document.createElement("div");
        newDiv.id = servId + "_with_layers";
        newDiv.attributes["servId"] = servId;
        newDiv.attributes["itemType"] = "service";
        
        // Create element with service description
        var sDiv = document.createElement("div");
        
        sDiv.id = servId + "_description";
        sDiv.classList.add("serviceItem");
        sDiv.classList.add("mainBorderColor");
        sDiv.attributes["itemType"] = "service_descr";
        sDiv.attributes["servExtent"] = ext;
        sDiv.attributes["servId"] = servId;
        
        // Image corresponding not leaf node
        var arrow = document.createElement("img");
        arrow.src = "./icons/GenericBlueDownArrowNoTail16B.png";
        arrow.classList.add("imageSize");
        arrow.attributes["isOpen"] = "yes";
        arrow.addEventListener("click",onTreeNodeClick);
        sDiv.appendChild(arrow);
        
        // Image of service map
        var newThumb = document.createElement("img");
        newThumb.src = servElement.attributes["thumbUrl"];
        newThumb.classList.add("imageSize");
        newThumb.style.marginLeft = "5px";
        sDiv.appendChild(newThumb);
        
        // Title of the service
        var newName = document.createElement("span");
        newName.classList.add("textMargs");
        newName.innerHTML = servElement.attributes["srvTitle"];
        sDiv.appendChild(newName);
        newDiv.appendChild(sDiv);

        rootElem.insertBefore(newDiv, rootElem.firstChild);
        newDiv.addEventListener("click",onLayerClick);
        
        // Add service in the list off added services
        addedServiceList.push(servId);
        
        // Unselect this service
        var prev = document.getElementById(servId);
        if (prev) {
            if (prev.classList.contains("selectedItem"))
                prev.classList.remove("selectedItem");
        }
        selectedService = "";
        
        // Remove event handler from "+" button
        if (wasServAddActivated) {
            document.getElementById("addServBtn").removeEventListener("click", onPlusClik);
            document.getElementById("addServBtn").src = "./icons/AddContent16BW.png";
            wasServAddActivated = false;
        }
        
        return newDiv;
    }
    
    // Zoom to added service
    function zoomToExt(ext) {    
        var extSr = new SpatialReference(ext.spatialReference);
        var webMsr = new SpatialReference(102100);
        var webExtent = null;
        if (webMsr.equals(extSr)) {
            webExtent = new esri.geometry.Extent(ext.xmin, ext.ymin, ext.xmax, ext.ymax, webMsr);
        }
        else {
            var layerExtent = new esri.geometry.Extent(ext.xmin, ext.ymin, ext.xmax, ext.ymax, extSr);
            webExtent = esri.geometry.geographicToWebMercator( layerExtent );
        }
        
        map.setExtent( webExtent, false );
        map.centerAt( webExtent.getCenter());
    }
    
    function onTreeNodeClick(ev) {
        var isOpen = true;
        if (ev.target.attributes["isOpen"] == "yes")
            isOpen = false;
        var disp;
        if (isOpen) {
            ev.target.attributes["isOpen"] = "yes";
            ev.target.src = "./icons/GenericBlueDownArrowNoTail16B.png";
            disp = "block";
        }
        else {
            ev.target.attributes["isOpen"] = "no";
            ev.target.src = "./icons/GenericBlueRigtArrowNoTail16B.png";
            disp = "none";
        }
        var layer = ev.target.parentNode.nextSibling;
        while (layer) {
            layer.style.display = disp;
            layer = layer.nextSibling;
        }
    }
    
    function onLayerClick(ev) {
        var layer;
        if (ev.target.nodeName == "DIV")
            layer = ev.target;
        else
            layer = ev.target.parentNode;
        if (layer.id == selectedLayer)
            return;
        
        // Unselect previous layer
        if (selectedLayer != "") {
            var prev = document.getElementById(selectedLayer);
            if (prev) {
                if (prev.classList.contains("selectedItem"))
                    prev.classList.remove("selectedItem");
            }
        }
        
        // Select new service
        selectedLayer = layer.id;
        layer.classList.add("selectedItem");
        if (!wasLayerAddActivated) {
            document.getElementById("loupe").addEventListener("click",onLoupeClick);
            document.getElementById("loupe").src = "./icons/LayerZoomTo16.png";
            document.getElementById("deleteBtn").addEventListener("click",deleteLayer);
            document.getElementById("deleteBtn").src = "./icons/LayerRemove16.png";
            wasLayerAddActivated = true;
        }
        
        var last = document.getElementById("mapLayerList").lastElementChild.lastElementChild;
        var first = document.getElementById("mapLayerList").firstElementChild.firstElementChild;
        
        // Check: whether we can move it down
        if ((layer.id == last.id) || /* The last layer in the map (index == 0)*/
            ((layer.attributes["itemType"] == "service_descr") && /* the root of the service*/
             (last.attributes["servId"] == layer.attributes["servId"])) /* the last service in the map*/
            || ((layer.attributes["itemType"] == "service_layer") && /* simple layer ( not service)*/
                (layer.parentNode.lastElementChild.id == layer.id))) /* the ;ast layer in the service*/ {
            // it cannot be moved down
            if (document.getElementById("layerDown").attributes["hasHandler"] == "yes") {
                document.getElementById("layerDown").removeEventListener("click",moveDown);
                document.getElementById("layerDown").attributes["hasHandler"] = "no";
            }
            document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16BW.png";
        }
        else {
            // it can be moved down
            document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16.png";
            document.getElementById("layerDown").addEventListener("click",moveDown);
            document.getElementById("layerDown").attributes["hasHandler"] = "yes";
        }
        
        // Check: whether we can move it up
        if ((layer.id == first.id) /* the first service in the map*/
            || ((layer.attributes["itemType"] == "service_layer") /* simple layer (not service)*/
                && (layer.previousSibling.attributes["itemType"] == "service_descr"))) /* first layer in the service*/ {
            // it cannot be moved up
            document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16BW.png";
            if (document.getElementById("layerUp").attributes["hasHandler"] == "yes") {
                document.getElementById("layerUp").removeEventListener("click",moveUp);
                document.getElementById("layerUp").attributes["hasHandler"] = "no";
            }
        }
        else {
            // it can be moved up
            document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16.png";
            document.getElementById("layerUp").addEventListener("click",moveUp);
            document.getElementById("layerUp").attributes["hasHandler"] = "yes";
        }
    }
    
    // Zoom on the selected layer
    function onLoupeClick() {
        if (selectedLayer == "")
            return;
        var layer = document.getElementById(selectedLayer);
        var ext;
        var webExtent = null;
        if (layer.attributes["itemType"] == "service_descr")
            ext = layer.attributes["servExtent"];
        else
            ext = map.getLayer(selectedLayer).initialExtent;
        var extSr = new SpatialReference(ext.spatialReference);
        var webMsr = new SpatialReference(102100);
        if (webMsr.equals(extSr)) {
            webExtent = new esri.geometry.Extent(ext.xmin, ext.ymin, ext.xmax, ext.ymax, webMsr);
        }
        else {
            var layerExtent = new esri.geometry.Extent(ext.xmin, ext.ymin, ext.xmax, ext.ymax, extSr);
            webExtent = esri.geometry.geographicToWebMercator( layerExtent );
        }
        map.setExtent( webExtent, false );
        map.centerAt( webExtent.getCenter());
    }
    
    function deleteLayer () {
        if (selectedLayer == "")
            return;
        if (document.getElementById(selectedLayer).attributes["itemType"] == "service_descr")
            removeWholeService();
        else {
            if (document.getElementById(selectedLayer).parentElement.children.length == 2)
                removeWholeService();
            else {
                var l = map.getLayer(selectedLayer);
                if (l)
                    map.removeLayer(l);
                document.getElementById(selectedLayer).parentElement.removeChild(document.getElementById(selectedLayer));
            }
        }
        
        selectedLayer = "";
        document.getElementById("loupe").removeEventListener("click", onLoupeClick);
        document.getElementById("loupe").src = "./icons/LayerZoomTo16BW.png";
        document.getElementById("deleteBtn").removeEventListener("click", deleteLayer);
        document.getElementById("deleteBtn").src = "./icons/LayerRemove16BW.png";
        document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16BW.png";
        document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16BW.png";
        document.getElementById("layerUp").removeEventListener("click",moveUp);
        document.getElementById("layerUp").attributes["hasHandler"] = "no";
        document.getElementById("layerDown").removeEventListener("click",moveDown);
        document.getElementById("layerDown").attributes["hasHandler"] = "no";
        wasLayerAddActivated = false;
    }
    
    function removeWholeService() {
        var serv = document.getElementById(selectedLayer);
        var layer = serv.nextSibling;
        while (layer) {
            var l = map.getLayer(layer.id);
            if (l)
                map.removeLayer(l);
            layer = layer.nextSibling;
        }
        var index = addedServiceList.indexOf(serv.attributes["servId"]);
        if (index >= 0) {
            addedServiceList.splice(index, 1);
        }
        var parent = serv.parentNode;
        parent.parentNode.removeChild(parent);
    }
    
    // Sign in using OAuth2
    function signIn() {
        clearStatusBar ();
        // Just in case really it cannot happen
        if (document.getElementById("signBtn").attributes["userStatus"] == "yes")
            return;
        
        // Wait massage from the child extention which performs signing in
        csInterface.addEventListener("esri.authorizing.event.message", function (event){
            
            // Parse the message from the child extension
            userAuth = {};
            
            // Split to (name, value) pairs
            var s = event.data.split("&");
            for (var i = 0; i < s.length; i++) {
                
                // Split the pair
                var ss = s[i].split("=");
                if (ss.length != 2) {
                    userAuth.error = "Wrong format of answer";
                    break;
                }
                var qq = ss[0];
                userAuth[qq] = decodeURI(ss[1]);
            }
            if (userAuth["error_description"]) {
                printErrorMessage("error: " + userAuth["error_description"]);
                return;
            }
            else if (userAuth["error"]) {
                printErrorMessage("error: " + userAuth["error"]);
                return;
            }
            
            // Get credits
            idManager.registerToken({
                server: portal.portalUrl,
                userId: userAuth.username,
                token: userAuth.access_token,
                expires: userAuth.expires_in,
                ssl: portal.ssl
            });
            var cred = idManager.findCredential(portal.portalUrl, userAuth.username);
            portal.signIn().then(
                function(portalUser) {
                    document.getElementById("signBtn").src = "./icons/system-log-out.png";
                    document.getElementById("signBtn").attributes["userStatus"] = "yes";
                    document.getElementById("userName").innerHTML=portalUser.fullName;
                }, function (err) {
                    printErrorMessage("error: " + err.message);
            });
        });
        
        // Run child extension which perfoms signing in
        csInterface.requestOpenExtension("com.esri.outh2.dialog", "");
    }
    
    function printErrorMessage (mess) {
        var status = document.getElementById("bottomToolBar");
        if (status.classList.contains("blueFont"))
            status.classList.remove("blueFont");
        if (status.classList.contains("hostFontColor"))
            status.classList.remove("hostFontColor");
        status.classList.add("redFont");
        status.innerHTML = mess;
    }
    
    // Clear status bar from older messages and set base font color
    function clearStatusBar () {
        var status = document.getElementById("bottomToolBar");
        if (status.classList.contains("redFont"))
            status.classList.remove("redFont");
        if (status.classList.contains("blueFont"))
            status.classList.remove("blueFont");
        status.classList.add("hostFontColor");
        status.innerHTML = "Ready...";
    }
    
    function onSignClick ()
    {
        if (document.getElementById("signBtn").attributes["userStatus"] == "no")
            signIn();
        else {
            portal.signOut();
            document.getElementById("signBtn").src = "./icons/SignIn16.png";
            document.getElementById("signBtn").attributes["userStatus"] = "no";
            document.getElementById("userName").innerHTML="Not signed in";
            userAuth = null;
        }
    }
    
    function toFullExtent() {
        map.setZoom(map.getMinZoom());
    }
    
    function moveUp() {
        var sel = document.getElementById(selectedLayer);
        if (sel.attributes["itemType"] == "service_layer") {
            // Single layer, move it up in Z order
            var index = map.graphicsLayerIds.indexOf(selectedLayer);
            if (index < 0)
                return;
            index++;
            if (index >= map.graphicsLayerIds.length)
                return;
            var layer = map.getLayer(selectedLayer);
            map.reorderLayer(layer, index);
            
            // Reflect moving in UI
            var prev = sel.previousElementSibling;
            var prevPrev = prev.previousElementSibling;
            sel.parentElement.insertBefore(sel, prev);
            
            // Define where we can move selected layer now
            if (prevPrev.attributes["itemType"] == "service_descr") {
                document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16BW.png";
                document.getElementById("layerUp").removeEventListener("click",moveUp);
                document.getElementById("layerUp").attributes["hasHandler"] = "no";
            }
            if (document.getElementById("layerDown").attributes["hasHandler"] == "no") {
                document.getElementById("layerDown").addEventListener("click",moveDown);
                document.getElementById("layerDown").attributes["hasHandler"] = "yes";
            }
            document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16.png";
            return;
        }

        // The list of layers to move (layers of service in the z-order in map)
        var layerArr = [];
        // Get get the layer which is the closest to the bittom
        var whatMove = sel.parentElement;
        var prev = whatMove.lastElementChild;
        // Coolect all layers of the sevice moving up
        while(prev.attributes["itemType"] != "service_descr") {
            layerArr.push(prev.id);
            prev = prev.previousElementSibling;
        } // Got the layer list to move
        
        // Find layer index in the map where we have to move layers of selected service
        var whereMove = whatMove.previousElementSibling; // Get element with previous service
        var serv = whereMove.firstElementChild; // Get element with service description
        var whereIn = serv.nextElementSibling;  // Get element with first layer of the previous service
        
        // Get index of the found layer in the map
        var index = map.graphicsLayerIds.indexOf(whereIn.id);
        if (index < 0)
            return;
        // Move layers of the selected service in found place
        for (var i = 0; i < layerArr.length; i++){
            var l = map.getLayer(layerArr[i]);
            map.reorderLayer(l, index);
        }
        
        // Reflect the current order oflayers in the UI
        
        var whoMove = whatMove.parentElement;
        whoMove.insertBefore(whatMove, whereMove);
        
        // Define where can we move selelected service after performed operation
        var first = document.getElementById("mapLayerList").firstElementChild.firstElementChild;
        if (first.attributes["servId"] == sel.attributes["servId"]) {
            document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16BW.png";
            if (document.getElementById("layerUp").attributes["hasHandler"] == "yes") {
                document.getElementById("layerUp").removeEventListener("click",moveUp);
                document.getElementById("layerUp").attributes["hasHandler"] = "no";
            }
        }
        if (document.getElementById("layerDown").attributes["hasHandler"] == "no") {
            document.getElementById("layerDown").addEventListener("click",moveDown);
            document.getElementById("layerDown").attributes["hasHandler"] = "yes";
        }
        document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16.png";
    }
    
    function moveDown() {
        var sel = document.getElementById(selectedLayer);
        if (sel.attributes["itemType"] == "service_layer") {
            // Single layer, move it dow in Z order
            var index = map.graphicsLayerIds.indexOf(selectedLayer);
            if (index < 0)
                return;
            var layer = map.getLayer(selectedLayer);
            index--;
            if (index < 0)
                return;
            map.reorderLayer(layer, index);
            
            // Reflect moving in UI
            var next = sel.nextElementSibling;
            var last = sel.parentElement.lastElementChild;
            sel.parentElement.insertBefore(next, sel);
            
            // Define where can we move selelected service after performed operation
            if (last.id == next.id) {
                document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16BW.png";
                document.getElementById("layerDown").removeEventListener("click",moveDown);
                document.getElementById("layerDown").attributes["hasHandler"] = "no";
            }
            if (document.getElementById("layerUp").attributes["hasHandler"] == "no") {
                document.getElementById("layerUp").addEventListener("click",moveUp);
                document.getElementById("layerUp").attributes["hasHandler"] = "yes";
            }
            document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16.png";
            return;
        }
        
        var layerArr = [];
        var whatMove = sel.parentElement;
        var prev = whatMove.lastElementChild;
        while(prev.attributes["itemType"] != "service_descr") {
            layerArr.push(prev.id);
            prev = prev.previousElementSibling;
        }
        
        var whereMove = whatMove.nextElementSibling;
        var whereIn = whereMove.lastElementChild;
        var index = map.graphicsLayerIds.indexOf(whereIn.id);
        if (index < 0)
            return;
        
        for (var i = (layerArr.length -1); i >= 0; i--){
            var l = map.getLayer(layerArr[i]);
            map.reorderLayer(l, index);
        }
        
        var whoMove = whatMove.parentElement;
        whoMove.insertBefore(whereMove, whatMove);
        
        var last = document.getElementById("mapLayerList").lastElementChild.firstElementChild;
        if (last.attributes["servId"] == sel.attributes["servId"]) {
            document.getElementById("layerDown").src = "./icons/GenericBlueDownArrowLongTail16BW.png";
            if (document.getElementById("layerDown").attributes["hasHandler"] == "yes") {
                document.getElementById("layerDown").removeEventListener("click",moveDown);
                document.getElementById("layerDown").attributes["hasHandler"] = "no";
            }
        }
        if (document.getElementById("layerUp").attributes["hasHandler"] == "no") {
            document.getElementById("layerUp").addEventListener("click",moveUp);
            document.getElementById("layerUp").attributes["hasHandler"] = "yes";
        }
        document.getElementById("layerUp").src = "./icons/GenericBlueUpArrowLongTail16.png";
    }
    
    
                
        /*$("#btn_test").click(function () {
            csInterface.evalScript('sayHello()');
        });*/
});