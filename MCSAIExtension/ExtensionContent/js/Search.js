define( ["dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/dom", "dojo/on", "dojo/dom-class", "dojo/dom-construct",
	"esri/request",
	"dijit/TooltipDialog", "dijit/popup", "dijit/focus",
	"js/RequestManager",
	"js/FeatureServiceList",
	"esri/layers/FeatureLayer",
	"js/globals"
],
function ( array, lang, query, dom, on, domClass, domConstruct, esriRequest, TooltipDialog, popup, focusUtil ) {
	SearchTool = ( function () {
		return this;
	} );

	var currentKeyword = "";

	SearchTool.serviceList = new FServiceList( "ServiceList", dom.byId( 'services-content' ) );
	SearchTool.serviceList.OnSelectionChanged = function () {
		var sel = SearchTool.serviceList.getSelected();
		if ( sel.length > 0 ) {
			dom.byId( 'runServiceBtn' ).className = 'buttonBlue';
			if ( sel.length == 1 )
				dom.byId( 'searchStatus' ).innerHTML = sel.length.toString() + " service selected";
			else
				dom.byId( 'searchStatus' ).innerHTML = sel.length.toString() + " services selected";
		}
		else {
			dom.byId( 'runServiceBtn' ).className = 'buttonGrey';
			dom.byId( 'searchStatus' ).innerHTML = "";
			//dom.byId( 'runServiceBtn' ).onclick = null;
		}
	};

	var searchText = dom.byId( "searchText" );
	if ( searchText.placeholder != null )
		searchText.placeholder = Headers.SearchDataPlaceholder;
	else { //for old MSIE
		searchText.value = Headers.SearchDataPlaceholder;
		searchText.style.color = "#aaa";
		on( searchText, "focus", function () {
			if ( this.value == Headers.SearchDataPlaceholder ) {
				this.value = '';
				this.style.color = '#FFF';
				this.onfocus = '';
			}
		} );
	}

	on( searchText, "keydown", function ( event ) {
		if ( event.keyCode == 13 )
			SearchTool.findFeatureServices();

	} );
	searchText.focus();

	// find groups based on input keyword
	SearchTool.findFeatureServices = function() {
		dom.byId( 'searchStatus' ).innerHTML = "Searching...";
		// The URL of search service. I tried to use appropriate object from ArcGIS for JavaScript. But this son of a bitch does not wanna sort by relevance  
		var path = 'http://www.arcgis.com/sharing/rest/search?q=';
		var keyword = dom.byId( 'searchText' ).value;

		if ( keyword == currentKeyword ) {
			//just show the current result
			SearchTool.showResults( );


			return;
		}

		path += keyword;
		path += '+type:%22feature%20service%22&f=pjson';


		// Let's go to search
		var layersRequest = esriRequest( {
			url: path,
			handleAs: "json",
			callbackParamName: "callback"
		} );
		layersRequest.then(
			function ( response ) {
				dom.byId( 'searchStatus' ).innerHTML = "";
				SearchTool.showResults( response );
			}, function ( error ) {
				dom.byId( 'searchStatus' ).innerHTML = "";
				alert( "Search request faild" );
			} );

	};

	//display a list of feature services that match the input pattern
	SearchTool.showResults = function ( response ) {
		if ( response != null ) {
			//clear any existing results
			if ( SearchTool.OnSearchCompleted != null )
				SearchTool.OnSearchCompleted();

			SearchTool.serviceList.deleteAll();
			if ( response.total > 0 ) {
				for ( var i = 0; i < response.results.length; i++ ) {
					SearchTool.serviceList.appendService( response.results[i] );
				}
			} else {
				// Just report about empty search result
				dom.byId( 'services-content' ).innerHTML = '<h2>Group Results</h2><p>No groups were found. If the group is not public use the sign-in link to sign in and find private groups.</p>';
			}
		}
		else {

		}
	};


	SearchTool.runSelectedServices = function () {

		var requestManager = new RequestManager( SearchTool.serviceList.getSelectedServices() );

		requestManager.OnLayerAdded = function ( layer ) {
			layerList.addLayer( layer );
		};

		requestManager.OnCompleted = function () {
			SearchTool.serviceList.clearSelection();
			var ztl = dom.byId( 'zoomToLayers' );
			if ( ztl.checked )
				SearchTool.zoomToExtent( requestManager.extent );
		};

		requestManager.run();

	};

	SearchTool.zoomToExtent = function ( extent ) {
		var ext = extent.expand( 1.2 );
		cp = ext.getCenter();
		var dw = map.extent.getWidth() / ext.getWidth();
		dw = dw >= 1 ? dw : ( 1 / dw );
		var dh = map.extent.getHeight() / ext.getHeight();
		dh = dh >= 1 ? dh : ( 1 / dh );
		if ( dw > 1.2 || dh > 1.2 )
			map.setExtent( ext, true );

		map.centerAt( cp );

	}
} );
