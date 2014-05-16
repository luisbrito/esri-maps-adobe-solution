define( ["dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/dom", "dojo/on", "dojo/dom-class", "dojo/dom-construct",
	"esri/request",
	"esri/layers/FeatureLayer",
	"js/globals"
],
function ( array, lang, query, dom, on, domClass, domConstruct, esriRequest ) {

	RequestManager = ( function (services ) {

		var serviceQueue = services;
		var me = this;
		var queueCapacity = serviceQueue.length;
		var currentService = 0;
		this.OnLayerAdded = null;
		this.OnCompleted = null;
		this.extent = null;

		getCurrentService = function () {
			return serviceQueue[currentService];
		};
		runLayer = function ( layer ) {
			var flayer = new esri.layers.FeatureLayer( layer.url );
			var layerExtent = new esri.geometry.Extent( {
				"xmin": layer.service.extent[0][0],
				"ymin": layer.service.extent[0][1],
				"xmax": layer.service.extent[1][0],
				"ymax": layer.service.extent[1][1],
				"spatialReference": layer.service.spatialReference
			} );

			var webExtent = esri.geometry.geographicToWebMercator( layerExtent );
			if ( me.extent == null )
				me.extent = webExtent;
			else
				me.extent = me.extent.union( webExtent );

			flayer.id = layer.id;
			map.addLayer( flayer );
			if ( me.OnLayerAdded != null )
				me.OnLayerAdded( layer );
		};

		runService = function () {
			if ( currentService >= queueCapacity ) {
				if ( me.OnCompleted != null ) {
					me.OnCompleted( );
				}
				dom.byId( 'searchStatus' ).innerHTML = "";
				return;
			}

			var service = serviceQueue[currentService];
			var serviceRequest = esriRequest( {
				url: service.url + "?f=pjson",
				handleAs: "json",
				callbackParamName: "callback"
			} );

			serviceRequest.then(
				function ( response ) {
					if ( response.layers != null ){ 
						for ( var i = 0; i < response.layers.length; ++i ) {
							var layer = response.layers[i];
							runLayer( { id: service.title, url: service.url + "/" + layer.id.toString(), service: service });
						}

					}
					currentService++;
					runService();

				},
				function ( error ) {
					runService();
				}
			);

		};

		this.run = function () {
			dom.byId( 'searchStatus' ).innerHTML = "Adding selected layers...";
			me.extent = null;
			runService();

		};

		return this;
	} );

} );