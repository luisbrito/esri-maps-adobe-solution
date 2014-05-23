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
	SpatialReference, Extent, Point, ProjectParameters, GeometryService,
	config, esriLang) {

    var baseMapGallery, baseLayerName;

    var portalUrl = 'http://www.arcgis.com';
    //var geometryServiceUrl = "http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer";
    //var geometryServiceUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";
    //var mapServerUrl = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
    var portalProps = null;

    var portal, portalUrl, groupGrid, lastStyle, mapInfo;
    function startup() {
        //create the portal
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
            			console.log(portalProps);
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

    function onMapLoad() {
    	layerList = new LayerList( "LayerList", dom.byId( 'layers-content' ) );
    	layerList.addLayer( map.getLayer( "layer0" ) );

    	map.resize();
    }
    
    function startDownLoadMap()
    {
    	var addLs = map.graphicsLayerIds;
    	var ext = null;
    	var extWebM = new SpatialReference(102100);
    	for (var i = 0; i < addLs.length; i++)
    	{
    		var lay = map.getLayer(addLs[i]);
    		var ex;
    		if (extWebM.equals(lay.fullExtent.spatialReference))
    			ex = lay.fullExtent;
    		else
    		{
    			ex =esri.geometry.geographicToWebMercator(lay.fullExtent);
    		}
    		if (ext == null)
    			ext = ex;
    		else
    			ext.union(ex);
    	}
    	if (ext != null)
    		map.setExtent(ext).then(function(res){
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
    	webMap.exportOptions.dpi = "300",
    	webMap.exportOptions.outputSize = ["1280", "1024"];

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
				console.log( response );
				downloadPdf( response.results[0].value.url, function(){
						dom.byId('downloadStatus').innerHTML = '';
					} );
			}, function ( error ) {
				alert( "Could not export feature service" );
			} );

    }

    return { startup: startup };
});
