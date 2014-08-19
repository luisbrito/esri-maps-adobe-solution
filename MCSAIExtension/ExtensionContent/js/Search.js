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
	
	var currentPage = null;

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
			SearchTool.findFeatureServices(0);

	} );
	searchText.focus();

	// find groups based on input keyword
	SearchTool.findFeatureServices = function( direction) {
		dom.byId( 'searchStatus' ).innerHTML = "Searching...";
		if (currentPage == null)
			direction = 0;
		// The URL of search service. I tried to use appropriate object from ArcGIS for JavaScript. But this son of a bitch does not wanna sort by relevance  
		var path = 'http://www.arcgis.com/sharing/rest/search?q=';
		var len = parseInt(dom.byId( 'outList_Size' ).value);
		if (len < 10)
			len = 10;
		if (len > 100)
			len = 100;
		var keyword = dom.byId( 'searchText' ).value;

		if (( keyword == currentKeyword) && (currentPage == null) ) {
			//just show the current result
			SearchTool.showResults( );


			return;
		}

		path += keyword;
		path += '+type:%22feature%20service%22&num=' + len;
		dom.byId("prevItemsLink").style.display = "none";
		dom.byId("nextItemsLink").style.display = "none";
		var start = 0;
		if (direction == 0){
			start = -1;
		}
		else if (direction < 0){
			if (currentPage.start > 1){
				start = currentPage.start - currentPage.num;
			}
		}
		else {
			start = currentPage.start + currentPage.num;
			if (start > currentPage.total)
				start = -1;
		}
		if (start > 0)
			path += '&start=' + start;
		path += '&f=pjson';
		currentPage = null;


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
			currentPage = {};
			currentPage.start =response.start; 
			currentPage.num = response.num; 
			currentPage.total = response.total;
			if (currentPage.start > 1){
				var pb = dom.byId("prevItemsLink");
				dom.byId("prevItemsLink").style.display = "block";
			}
			if ((currentPage.start + response.num) < response.total){
				var pb = dom.byId("nextItemsLink");
				dom.byId("nextItemsLink").style.display = "block";
			}

			SearchTool.serviceList.deleteAll();
			if ( response.total > 0 ) {
				for ( var i = 0; i < response.results.length; i++ ) {
					SearchTool.serviceList.appendService( response.results[i], i );
				}
			} else {
				// Just report about empty search result
				dom.byId( 'services-content' ).innerHTML = '<p>No layers was found.</p>';
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
		cp = extent.getCenter();
		map.setExtent( extent, true );

		map.centerAt( cp );

	};
} );
