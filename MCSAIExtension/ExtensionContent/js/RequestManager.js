define( ["dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/dom", "dojo/on", "dojo/dom-class", "dojo/dom-construct",
	"esri/request",
	"esri/SpatialReference",
	"esri/tasks/ProjectParameters",
	"esri/layers/FeatureLayer",
	"js/globals"
],
function ( array, lang, query, dom, on, domClass, domConstruct, esriRequest, SpatialReference, ProjectParameters ) {

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

			flayer.id = layer.id;
			var lay = map.addLayer( flayer );
			lay.service = layer.service;
			lay.on("load", function(laye){
				if ( me.OnLayerAdded != null )
					me.OnLayerAdded( {id: laye.layer.id, url: laye.layer.url, service: laye.layer.service} ); 
			});
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
			if ( service.info.layers == null )
			{
				currentService++;
				runService();
				return;
			}
			var extSr = new SpatialReference(service.info.fullExtent.spatialReference);
			var extWebM = new SpatialReference(102100);
			var isEq = extWebM.equals(extSr);
			var webExtent;
			if (isEq) {
				webExtent = new esri.geometry.Extent(service.info.fullExtent.xmin,
						service.info.fullExtent.ymin, service.info.fullExtent.xmax, service.info.fullExtent.ymax, extWebM);
			}
			else
			{
				var layerExtent = new esri.geometry.Extent(service.info.fullExtent.xmin,
					service.info.fullExtent.ymin, service.info.fullExtent.xmax, service.info.fullExtent.ymax, extSr);
				webExtent = esri.geometry.geographicToWebMercator( layerExtent );
			}
			if ( me.extent == null )
				me.extent = webExtent;
			else
				me.extent = me.extent.union(webExtent);
			for ( var i = 0; i < service.info.layers.length; ++i ) {
				var layer = service.info.layers[i];
				runLayer( { id: service.title, url: service.url + "/" + layer.id.toString(), service: service });
			}
			currentService++;
			runService();
		};

		this.run = function () {
			dom.byId( 'searchStatus' ).innerHTML = "Adding selected layers...";
			me.extent = null;
			runService();

		};

		return this;
	} );

} );