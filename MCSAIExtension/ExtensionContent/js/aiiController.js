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
    var geometryServiceUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";
    var mapServerUrl = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";

    var portal, portalUrl, groupGrid, lastStyle, mapInfo, geoService;
    function startup() {
        //create the portal
        portal = new esriPortal.Portal(portalUrl);
        //dom.byId("h_layers").innerHTML = Headers.layers;
        on(portal, 'ready', function (p) {
            dom.byId('findResults').disabled = false;
            on(dom.byId('findResults'), 'click', SearchTool.findFeatureServices);

        });

        createMap();

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
				dlb.onclick = downloadMap;
        	

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
    	//arcgisUtils.createMap( "30e5fe3149c34df1ba922e6f5bbf808f", "map" ).then( function ( response ) {
    	//	//update the app 
    	//	//dom.byId( "title" ).innerHTML = response.itemInfo.item.title;
    	//	//dom.byId( "subtitle" ).innerHTML = response.itemInfo.item.snippet;

    	//	map = response.map;
    	//	dojo.connect( map, "onLoad", onMapLoad );

    	//} );

    	//return;
        var startExtent = esri.geometry.Extent({
            "xmin": -15204166.06,
            "ymin": 1593253.26,
            "xmax": -6398620.40,
            "ymax": 7463617.03,
            "spatialReference": {
                "wkid": 102100
            }
        });
        map = new esri.Map("map", {
            //center: [-110, 35], // long, lat
        	extent: startExtent,
            //nav:false,
            sliderStyle: "small",
            //sliderPosition: "top-right"
            //zoom: 5,
            //basemap: "topo"
        } );


        var baseLayer = esri.dijit.BasemapLayer( {
        	url: "http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
        } );

        var baseLayers = [];
        baseLayers.push( baseLayer );

        var basemap = esri.dijit.Basemap( {
        	layers: baseLayers,
        	id: "Topographic",
        	title: "Topographic"
        } );

        var basemaps = [];
        basemaps.push( basemap );
        basemapGallery = esri.dijit.BasemapGallery( {
        	showArcGISBasemaps: false,
        	basemaps: basemaps,
        	//bingMapsKey: '30e5fe3149c34df1ba922e6f5bbf808f',
        	map: map
        } );

        map.resize();
        dojo.connect(map, "onLoad", onMapLoad);
        var rsb = dom.byId( 'runServiceBtn' );
        if ( rsb != null ) {
        	rsb.innerHTML = Headers.runService;
        	rsb.title = Headers.runService;
        	rsb.onclick = function ( event ) {
        		SearchTool.runSelectedServices();
        	}
       	};

 
    }

    function onMapLoad() {
    	layerList = new LayerList( "LayerList", dom.byId( 'layers-content' ) );
    	layerList.addLayer( map.getLayer( "layer0" ) );

    	map.resize();
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
    	var ppp = 'http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task/execute?Web_Map_as_JSON=';
    	ppp += strMap;
    	ppp += '&Format=pdf&Layout_Template=&outSR=&processSR=&returnZ=false&returnM=false&f=pjson';
    	console.log( ppp );
    	var pdfRequest = esriRequest( {
    		url: ppp,
    		handleAs: "json",
    		callbackParamName: "callback"
    	} );
    	pdfRequest.then(
			function ( response ) {
				// success request
				dom.byId( 'downloadStatus' ).innerHTML = '';
				console.log( response );
				window.open( response.results[0].value.url );
				//downloadPdf( response.results[0].value.url, function(){
				//		dom.byId('downloadStatus').innerHTML = '';
				//	} );
			}, function ( error ) {
				alert( "Could not export feature service" );
			} );

    }

    return { startup: startup };
});
