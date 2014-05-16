define(["dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/dom", "dojo/on", "dojo/dom-class", "dojo/dom-construct", "esri/request", "js/ItemList"],
function (array, lang, query, dom, on, domClass, domConstruct, esriRequest) {

    FServiceList = function (id, parentNode) {
        this.parentElement = parentNode;
        this.theID = id;

        var me = this;
        if (this.parentElement != null)
            this.parentElement.onkeydown = function (e) {
                me.navigate(e, me);
            };

        this.listContainer = document.createElement("div");
        this.listContainer.id = this.theID;
        this.listContainer.className = 'ServiceListContainer';

        var itemList = document.createElement("ul");
        itemList.id = 'listAllServices_' + this.theID;
        itemList.className = 'ServiceList';
        this.listContainer.appendChild( itemList );
		if (parentNode != null)
			parentNode.appendChild(this.listContainer);

        this.itemList = dom.byId('listAllServices_' + this.theID);
        this.classes = {
            emptyItem: "empty",
            itemList: "",
            selectedItem: "fServiceItemSelected",
            notSelectedItem: "fServiceItem"
        };

        // URL of Geometry Service
        this.geoService = null;

        this.setGeoService = function (service) {
            this.geoService = service;
        };

        this.RunService = null;

        this.OnDblClick = function (event) {
            // we have chosen a feature service to export
            // Now let's define the extent of feature service in base map spatial reference

            // get URL of feature service
            //var li = event.target;
            //console.log( mapInfo );
            //var mapInfo;
            if (me.RunService)
                me.RunService(service);

        };

        addService = function (service) {
            //var itemCount = me.getCount();
            var li = document.createElement('li');
            li.className = me.classes.notSelectedItem;
            li.id = "li" + service.title;
            li.title = service.description;

            //var selItem = me.selectItem;
            li.onclick = function (e) {
            	me.selectItem( e.currentTarget, !e.ctrlKey, me );
            };

            var sr = service.spatialReference;
            if (!sr) // Id spatial reference is undefined set it to Web Mercator WGS 1984 - maybe it's wrong
                sr = "WGS_1984_Web_Mercator_Auxiliary_Sphere";

            // Add URL of feature service, extent and SR to attributes of <div> 
            var serviceNode = domConstruct.create('div', { id: "div" + service.title, className: 'layerItem', path: service.url, sr: service.spatialReference, ext: service.extent }, li);

            // thumb is the URL of a raster imge with preview
            var thumb = 'http://www.arcgis.com/sharing/rest/content/items/' + service.id + '/info/' + service.thumbnail;
            domConstruct.create('img', { src: thumb, className: 'layerImg' }, serviceNode);

            // Add <span> with title of found feature service 
            var labelText = service.title;
            labelText = labelText.replace( /_/g, ' ' );
            var label = domConstruct.create('span', { className: 'layerItemLabel', title: service.description }, serviceNode);
            domConstruct.create('span', { innerHTML: labelText, title: service.description }, label);
            lastStyle = serviceNode.style.backgroundColor;
            on(li, 'dblclick', me.OnDblClick);

            li.service = dojo.clone(service);

            me.itemList.appendChild(li);

            if (me.OnFServiceAdded != null)
                me.OnFServiceAdded(service);


            var empty = dom.byId("emptyli" + me.theID);
            if (empty == null) {
                empty = document.createElement("li");
                empty.className = me.classes.emptyItem;
                empty.id = "emptyli" + me.theID;
                me.itemList.appendChild(empty);
            }
            else {
                domConstruct.place(empty, me.itemList, "last");
            }

            sortList();
        };

        this.appendService = function (service) {
            var serviceRequest = esriRequest({
                url: service.url + "?f=pjson",
                handleAs: "json",
                callbackParamName: "callback"
            });
            serviceRequest.then(
			    function (response) {
			        if (response.layers != null && response.layers.length > 0) {
			            var itemService = service;
			            itemService.info = response;
			            addService(itemService);
			        }
			    },
                function (error) {
                    alert(error);
                });
        };

        sortList = function () {
        	var liCollection = me.itemList.children;
        	
        	var ali = Array.prototype.slice.call( liCollection );
        	ali.sort( function ( one, two ) {return one.id < two.id ? -1 : ( one.id > two.id ? 1 : 0 );} );
        	for ( var i = 0; i < ali.length; i++ ) {
        		me.itemList.appendChild( ali[i] );
        	}
        };
        return this;
    };

    FServiceList.prototype = new ItemList;
} );
