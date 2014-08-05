define([
	"dojo/parser", "dojo/ready", "dojo/dom", "dojo/dom-class", "dojo/dom-construct", "dojo/_base/array", "dijit/registry",
	"dojo/on",
	"esri/arcgis/Portal",
	"esri/arcgis/utils",
	"esri/urlUtils",
 	"esri/request",
	"esri/SpatialReference", "esri/geometry/Extent", "esri/geometry/Point",
	"esri/tasks/ProjectParameters",
	"esri/tasks/GeometryService",
	"esri/toolbars/draw",
	"dojo/_base/event",
	"esri/toolbars/edit",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleFillSymbol",
	"esri/symbols/Font", "esri/symbols/TextSymbol",
	"esri/Color",
	"esri/graphic",
	"esri/config", "esri/lang",
	"dijit/layout/BorderContainer", "dijit/layout/StackContainer", "dijit/layout/ContentPane",
	"dijit/form/TextBox", "dojo/domReady!",
	"esri/dijit/BasemapGallery",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ImageParameters",
	"js/aiiconfig",
	"js/LayerList",
	"js/Search",
	"js/globals",
	"js/utils"
], function (
	parser, ready, dom, domClass, domConstruct, array, registry, on, esriPortal, arcgisUtils,urlUtils,
	esriRequest,
	SpatialReference, Extent, Point, ProjectParameters, GeometryService, Draw, event, Edit, SimpleLineSymbol, SimpleFillSymbol,
	Font, TextSymbol, Color, Graphic, config, esriLang) {

    var baseMapGallery, baseLayerName;

    var portalUrl = 'http://www.arcgis.com';
    //var geometryServiceUrl = "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";
    //var geometryServiceUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";
    //var mapServerUrl = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
    var portalProps = null;
    var aoiExtent = null;
    var aoiSignX = null;
    var aoiSignY = null;
    var oaiGraphic = null;
    var fillSymbol;
    var editTool = null;
    var tb = null;
    var outUnits = "Pixels";

    var portal, portalUrl, groupGrid, lastStyle, mapInfo;
    function startup() {
        //create the portal
    	fillSymbol = new SimpleFillSymbol();
        portal = new esriPortal.Portal(portalUrl);
        //dom.byId("h_layers").innerHTML = Headers.layers;
        on(portal, 'ready', function (p) {
            dom.byId('findResults').disabled = false;
            on(dom.byId('findResults'), 'click', SearchTool.findFeatureServices);
            var reqPath = portalUrl + "/sharing/rest/portals/self?f=json";
            partalPropsReq = esriRequest({url:reqPath, handleAs:"json", callbackParamName:"callback"});
            partalPropsReq.then(
            		function(response)
            		{
            			portalProps = response;
            			geometryService = new GeometryService(portalProps.helperServices.geometry.url);
            	        createMap();
            		}
            );
        });
        
        

        var serviceTab = dom.byId( "serviceList" );
        if ( serviceTab != null ) {
        	serviceTab.onclick = function () {
        		switchPane( serviceTab );
        	};
        }

        var layerTab = dom.byId( "layerList" );
        if ( layerTab != null ) {
        	layerTab.onclick = function () {
        		switchPane( layerTab );
        	};
        }

        var baseMapTab = dom.byId( "baseMap" );
        if ( baseMapTab != null ) {
        	baseMapTab.onclick = function () {
        		switchPane( baseMapTab );
        	};
        }

        var closeServBtn = dom.byId( "closeServices_button" );
        if ( closeServBtn != null ) {
        	closeServBtn.onclick = function () {
        		hidePanels( );
        	};
        }

        var closeLayersBtn = dom.byId( "closeLayers_button" );
        if ( closeLayersBtn != null ) {
        	closeLayersBtn.onclick = function () {
        		hidePanels();
        	};
        }

        var closeBaseBtn = dom.byId( "closeBase_button" );
        if ( closeBaseBtn != null ) {
        	closeBaseBtn.onclick = function () {
        		hidePanels();
        	};
        }

        var setBaseBtn = dom.byId( "map_utput_set_button" );
        if ( setBaseBtn != null ) {
        	setBaseBtn.onclick = function () {
        		setSpatialReference();
        		//setScale();
        		addSigns();
        	};
        }

        var refreshBaseBtn = dom.byId( "map_doc_refresh_button" );
        if ( refreshBaseBtn != null ) {
        	refreshBaseBtn.onclick = function () {
        		refreshDocProps();
        	};
        }

        var addRect = dom.byId( 'addRect' );
        if ( addRect != null ) {
        	addRect.innerHTML = "Define Map Extent";
        	//addRect.onclick = onAddRect;
 //       	dlb.title = Headers.download_description;
        }

        var dlb = dom.byId( 'downLoadBtn' );
        if ( dlb != null ) {
        	dlb.innerHTML = Headers.download;
        	dlb.title = Headers.download_description;
        	//if ( window.cep == null ) 
        	//	dlb.className = "buttonGrey";
			//else 
				dlb.onclick = startDownLoadMap;
        	

        }

        SearchTool.OnSearchCompleted = function () {
        	var serviceTab = dom.byId( "serviceList" );
        	if ( domClass.contains( serviceTab, "unselected" ) ) {
        		switchPane( serviceTab );

        	}
        };
	}

	// Hides all tabs
    function deactivateTabs( ) {

    	var leftTabs = dom.byId( "panelOpener" ).children;
    	array.forEach( leftTabs, function ( leftTab, index ) {
    		leftTab.className = "unselected " + leftTab.id + "-tab";
    	} );
	}

    function activateTab( pane ) {
    		var id = pane.id + "-tab";
    		pane.className = "selected " + id;
    }

    function hidePanels() {
    	var up = dom.byId( "utilityPanel" ).children;
    	array.forEach( up, function ( panel ) {
    		if ( panel.id != "panelOpener" )
    			panel.style.display = "none";
    	} );

    	dijit.byId( 'content' ).resize();
    	deactivateTabs();

    	map.resize();
    }

    function showPanel( pane ) {
    	var panel = dom.byId( pane.id + "Content" );
    	panel.style.display = "block";
    	dijit.byId( 'content' ).resize();
    	activateTab( pane );
    	map.resize();
	}

    function switchPane( pane ) {
    	hidePanels();
    	showPanel( pane );
    }

    function createMap() {
    	
    	map = new esri.Map("map", {basemap: "topo"});
   		dojo.connect( map, "onLoad", onMapLoad );
        var rsb = dom.byId( 'runServiceBtn' );
        if ( rsb != null ) {
           	rsb.innerHTML = Headers.runService;
           	rsb.title = Headers.runService;
           	rsb.onclick = function ( event ) {
           		SearchTool.runSelectedServices();
           	};
        }
    }
    
    function refreshDocProps(){
        var inter = new CSInterface();
        var newScript = '$._ext_ILST.getUnits()';
        inter.evalScript( newScript, function ( pp ) {
        	var arr = pp.split(".");
        	if ((arr[1] == "Centimeters") ||
        			(arr[1] == "Inches") ||
        			(arr[1] == "Millimeters") ||
        			(arr[1] == "Picas") ||
        			(arr[1] == "Points"))
        		outUnits = arr[1];
        	var unitDiv = dom.byId( "document_units");
        	if (unitDiv != null)
        	{
        		unitDiv.innerHTML = "<b>Document units:</b> " + outUnits;
        	}
        });
        
        newScript = '$._ext_ILST.getArcGISmetadata()';
        inter.evalScript( newScript, function ( pp ) {
        	var objRet = JSON.parse(pp);
        	if (objRet.error == "No"){
        		var sfID = parseInt(objRet.metadata.SpatialReference);
        		var docSr = new SpatialReference(sfID);
        		if (!map.spatialReference.equals(docSr))
        			map.spatialReference = docSr;
        	}
        });
    }

    function onMapLoad() {
    	layerList = new LayerList( "LayerList", dom.byId( 'layers-content' ) );
    	/*layerList.addLayer( map.getLayer( "layer0" ) );*/

    	map.resize();
        var addRect = dom.byId( 'addRect' );
        if ( addRect != null ) {
        	addRect.onclick = onAddRect;
        }
        refreshDocProps();
        /*var inter = new CSInterface();
        var newScript = '$._ext_ILST.getUnits()';
        inter.evalScript( newScript, function ( pp ) {
        	var arr = pp.split(".");
        	if ((arr[1] == "Centimeters") ||
        			(arr[1] == "Inches") ||
        			(arr[1] == "Millimeters") ||
        			(arr[1] == "Picas") ||
        			(arr[1] == "Points"))
        		outUnits = arr[1];
        	var unitDiv = dom.byId( "document_units");
        	if (unitDiv != null)
        	{
        		unitDiv.innerHTML = "<b>Document units:</b> " + outUnits;
        	}
        });*/
    }
    
    function endGraphic(evt){
    	tb.deactivate();
    	map.enableMapNavigation();
    	aoiExtent = new Extent(evt.geometry._extent);
    	var ext = aoiExtent.expand(1.2);
    	oaiGraphic = new Graphic(evt.geometry, fillSymbol);
    	map.graphics.add(oaiGraphic);
    	var addRect = dom.byId( 'addRect' );
    	map.setExtent(ext);
    	addSigns();
    	if (editTool == null){
    		editTool = new Edit(map);
            map.graphics.on("click", function(evt) {
                event.stop(evt);
            	if (aoiSignY != null){
            		map.graphics.remove(aoiSignY);
            		aoiSignY = null;
            	}
            	if (aoiSignX != null){
            		map.graphics.remove(aoiSignX);
            		aoiSignX = null;
            	}
                map.disableMapNavigation();
                map.on("click", function(ev){
                	editTool.deactivate();
                	addSigns();
                });
                editTool.on("graphic-move-stop", function(evMove){
                	aoiExtent = new Extent(evMove.graphic.geometry._extent);
                });
                editTool.on("scale-stop", function(evMove){
                	aoiExtent = new Extent(evMove.graphic.geometry._extent);
                });
                editTool.activate(Edit.MOVE|Edit.SCALE,evt.graphic);
              });
     	}
    	addRect.innerHTML = "Remove Map Extent";
    }
    
    function endEditGraph(evt){
    	tb.deactivate();
    	oaiGraphic = evt.graphic;
    	map.enableMapNavigation();
    	addRect.innerHTML = "Change AOI";
    }
    
    function addSigns(){
    	if (oaiGraphic == null)
    		return;
    	if (aoiSignY != null){
    		map.graphics.remove(aoiSignY);
    		aoiSignY = null;
    	}
    	if (aoiSignX != null){
    		map.graphics.remove(aoiSignX);
    		aoiSignX = null;
    	}
    	var corner = new Point(aoiExtent.xmin, aoiExtent.ymin, aoiExtent.spatialReference);
    	var res = parseInt(dom.byId( 'outMap_DPI' ).value);
    	var sc = parseInt(dom.byId( 'baseMap_scale' ).value);
    	var wInt = aoiExtent.getWidth()/sc;
    	var hInt = aoiExtent.getHeight()/sc;
    	var mes = " px";
    	if (outUnits == "Centimeters"){
    		wInt *= 100;
    		hInt *= 100;
    		mes = " cm";
    	}
    	else if (outUnits == "Inches"){
    		wInt *= 39.3700787;
    		hInt *= 39.3700787;
    		mes = "'";
    	}
    	else if (outUnits == "Millimeters"){
    		wInt *= 1000;
    		hInt *= 1000;
    		mes = " mm";
    	}
    	else if (outUnits == "Picas"){
    		wInt *= (39.3700787*6);
    		hInt *= (39.3700787*6);    		
    		mes = " picas";
    	}
    	else if (outUnits == "Points"){
    		wInt *= (39.3700787*72);
    		hInt *= (39.3700787*72);    		
    		mes = " pts";
    	}
    	else if (outUnits == "Pixels"){
    		wInt *= (39.3700787*res);
    		hInt *= (39.3700787*res);    		
    	}
    	var valWidth = "w = " + wInt.toFixed(2) + " " + mes;
    	var valHeight = "h = " + hInt.toFixed(2) + " " + mes;
    	var font = new Font(
                "10pt",
                Font.STYLE_NORMAL, 
                Font.VARIANT_NORMAL,
                Font.WEIGHT_NORMAL,
                "Helvetica"
              );
        var textSymbol1 = new TextSymbol(
        		valWidth,
                font,
                new Color("white")
              );
        textSymbol1.setOffset(8,8);
        textSymbol1.setAlign(TextSymbol.ALIGN_START);
        aoiSignX = new Graphic(corner, textSymbol1);
        map.graphics.add(aoiSignX);
        var textSymbol2 = new TextSymbol(
                valHeight,
                font,
                new Color("white")
              );
        textSymbol2.setOffset(20,30);
        textSymbol2.setAlign(TextSymbol.ALIGN_START);
        textSymbol2.setAngle(270);
        aoiSignY = new Graphic(corner, textSymbol2);
        map.graphics.add(aoiSignY);

    }
    
    function setSpatialReference(){
    	var sr = parseInt(dom.byId( 'basemap_SR' ).value);
    	var oldSr = map.spatialReference.wkid;
    	if(oldSr == sr)
    		return;
    	var mySr = new SpatialReference(sr);
    	map.spatialReference = mySr;
    }
    
    function setScale(){
    	var sc = parseInt(dom.byId( 'baseMap_scale' ).value);
    	map.setScale(sc);
    }
    
    function onAddRect(){
    	var addRect = dom.byId( 'addRect' );
    	if (addRect.innerHTML == "Define Map Extent"){
	    	aoiExtent = null;
	    	oaiGraphic = null;
	    	if (tb == null){
		    	tb = new Draw(map);
		    	tb.on("draw-end", endGraphic);
	    	}
	    	map.disableMapNavigation();
	    	tb.activate(Draw.RECTANGLE);
    	}
    	else if (addRect.innerHTML == "Remove Map Extent"){
    		editTool.deactivate();
    		map.graphics.remove(oaiGraphic);
        	if (aoiSignY != null){
        		map.graphics.remove(aoiSignY);
        		aoiSignY = null;
        	}
        	if (aoiSignX != null){
        		map.graphics.remove(aoiSignX);
        		aoiSignX = null;
        	}
	    	aoiExtent = null;
	    	oaiGraphic = null;
    		addRect.innerHTML = "Define Map Extent";
        	map.enableMapNavigation();
    	}
    }
    
    function startDownLoadMap()
    {
    	dom.byId("prg_container").style.display="block";
    	var ext = null;
    	if (aoiExtent){
    		ext = aoiExtent;
    	}
    	else {
	    	var addLs = map.graphicsLayerIds;
	    	var extWebM = new SpatialReference(102100);
	    	for (var i = 0; i < addLs.length; i++)
	    	{
	    		var lay = map.getLayer(addLs[i]);
	    		var ex;
	    		if (extWebM.equals(lay.fullExtent.spatialReference))
	    		{
	    			ex = lay.fullExtent;    			
	    		}
	    		else
	    		{
	    			ex =esri.geometry.geographicToWebMercator(lay.fullExtent);
	    		}
	    		if (ext == null)
	    			ext = ex;
	    		else
	    			ext = ext.union(ex);
	    	}
    	}
    	if (ext != null)
    		map.setExtent(ext, true).then(function(res){
    			downloadMap();
    		});
    	else
    		downloadMap();
    }

    function downloadMap() {
    	var webMap = {
    		"mapOptions": {},
    		"operationalLayers": [],
    		"baseMap": [],
    		"exportOptions": {},
    		"layoutOptions": {}
    	};
    	
    	dom.byId('downloadStatus').innerHTML = 'Downloading the map...';

    	// Define layer in service always 0. Should be discussed 
    	webMap.mapOptions.extent = map.extent.toJson();

    	// Defining layers with feature service to be exported
    	array.forEach( map.getLayersVisibleAtScale(), function ( mapLayer, idx ) {

    		var opLayer = {
    			id: mapLayer.id,
    			url: mapLayer.url
    		};
    		if ( idx == 0 ) {
    			opLayer.visibility = "false";
    			opLayer.opacity = "1";
    			webMap.baseMap.baseMapLayers = [opLayer];
    			webMap.baseMap.title = map.getBasemap();
    		}

    		webMap.operationalLayers.push( opLayer );
    		
    	} );

    	// Export options. I chose these just from example
    	var res = parseInt(dom.byId( 'outMap_DPI' ).value);
    	var sc = parseInt(dom.byId( 'baseMap_scale' ).value);
    	var wInt = map.extent.getWidth()/sc;
    	var hInt = map.extent.getHeight()/sc;
		wInt *= (39.3700787*res);
		hInt *= (39.3700787*res);    		
    	var valWidth = wInt.toFixed(0);
    	var valHeight = hInt.toFixed(0);
    	webMap.exportOptions.dpi = dom.byId( 'outMap_DPI' ).value;
    	webMap.exportOptions.outputSize = [valWidth, valHeight];

    	var strMap = JSON.stringify( webMap );
    	// REST request to GP tool for exporting web maps
    	var exportUrl;
    	if(portalProps.helperServices.printTask.url)
    		exportUrl = portalProps.helperServices.printTask.url;
    	else
    		exportUrl = 'http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';
    	exportUrl += '/execute?Web_Map_as_JSON=';
    	exportUrl += strMap;
    	exportUrl += '&Format=pdf&Layout_Template=&outSR=&processSR=&returnZ=false&returnM=false&f=pjson';
    	var pdfRequest = esriRequest( {
    		url: exportUrl,
    		handleAs: "json",
    		callbackParamName: "callback"
    	} );
    	pdfRequest.then(
			function ( response ) {
				// success request
				dom.byId( 'downloadStatus' ).innerHTML = '';
				var sc = map.getScale();
				var bId = map.basemapLayerIds[0];
				var lar = map.getLayer(bId);
				var srId = map.spatialReference.wkid;
				downloadPdf( response.results[0].value.url, sc,map.extent, srId, "topo", function(){
					dom.byId("prg_container").style.display="none";
						dom.byId('downloadStatus').innerHTML = '';
					} );
			}, function ( error ) {
				dom.byId('downloadStatus').innerHTML = '';
				dom.byId("prg_container").style.display="none";
				alert( "Could not export feature service" );
			} );

    }

    return { startup: startup };
});
