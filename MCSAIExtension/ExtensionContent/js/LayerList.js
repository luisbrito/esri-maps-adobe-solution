define( ["dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/dom", "dojo/on", "dojo/dom-class", "dojo/dom-construct", "esri/request", "js/ItemList"],
function ( array, lang, query, dom, on, domClass, domConstruct, esriRequest ) {

	LayerList = function ( id, parentNode ) {
		this.parentElement = parentNode;
		this.theID = id;
		this.upperBound = 0;

		var me = this;
		if ( this.parentElement != null )
			this.parentElement.onkeydown = function ( e ) {
				me.navigate( e, me );
			};

		this.listContainer = document.createElement( "div" );
		this.listContainer.id = this.theID;
		this.listContainer.className = 'LayerListContainer';

		var itemList = document.createElement( "ul" );
		itemList.id = 'listAlllayers_' + this.theID;
		itemList.className = 'LayerList';
		this.listContainer.appendChild( itemList );
		if ( parentNode != null )
			parentNode.appendChild( this.listContainer );

		this.itemList = dom.byId( 'listAlllayers_' + this.theID );
		this.classes = {
			emptyItem: "empty",
			itemList: "",
			selectedItem: "fLayerItem",
			notSelectedItem: "fLayerItem"
		};

		addItem = function ( layer) {
			var li = document.createElement( 'li' );
			li.className = me.classes.notSelectedItem;
			li.title = layer.description;

			li.onclick = function ( e ) {
				me.selectItem( e.currentTarget, true, me );
			};

			var layerNode;
			// thumb is the URL of a raster imge with preview
			if ( layer.service != null ) {
				var labelText = layer.id;
				li.id = "li" + labelText;
				labelText = labelText.replace( /_/g, ' ' );
				layerNode = domConstruct.create( 'div', { id: "div" + li.id, className: 'layerItem', path: layer.service.url }, li );
				var thumb = 'http://www.arcgis.com/sharing/rest/content/items/' + layer.service.id + '/info/' + layer.service.thumbnail;
				img = domConstruct.create( 'img', { src: thumb, className: 'layerImg' }, layerNode );
				var label = domConstruct.create( 'span', { className: 'layerItemLabel', title: layer.service.description }, layerNode );
				domConstruct.create( 'span', { innerHTML: labelText, title: layer.service.description }, label );
			}
			else {
				var labelText = "BaseLayer";
				li.id = "li" + labelText;
				layerNode = domConstruct.create( 'div', { id: "div" + li.id, className: 'layerItem', path: layer.url }, li );
				img = domConstruct.create( 'img', { src: "./images/topographic.png", className: 'layerImg' }, layerNode );
				var label = domConstruct.create( 'span', { className: 'layerItemLabel', title: layer.description }, layerNode );
				domConstruct.create( 'span', { innerHTML: labelText, title: layer.description }, label);
				lastStyle = layerNode.style.backgroundColor;
			}
			if ( findLi( li.id, me ) != null )
				return;

			var buttonsDiv = domConstruct.create( 'div' );
			buttonsDiv.id = "btns" + li.id;
			buttonsDiv.className = "layerButtons";
			var closeBtn = document.createElement( 'div' );
			closeBtn.id = "close" + li.id;
			closeBtn.className = "closeLayer";
			closeBtn.style.display = "block";
			closeBtn.title = "Remove Layer";
			closeBtn.onclick = removeLayer;
			buttonsDiv.appendChild( closeBtn );

			li.appendChild(buttonsDiv);

			var downBtn = document.createElement( 'div' );
			downBtn.id = "down" + li.id;
			downBtn.className = "downLayer";
			downBtn.style.display = "block";
			downBtn.title = "Move Layer down";
			downBtn.onclick = moveDown;

			buttonsDiv.appendChild( downBtn );

			var upBtn = document.createElement( 'div' );
			upBtn.id = "up" + li.id;
			upBtn.className = "upLayer";
			upBtn.style.display = "block";
			upBtn.title = "Move Layer up";
			upBtn.onclick = moveUp;

			buttonsDiv.appendChild( upBtn );

			lastStyle = layerNode.style.backgroundColor;

			// Add <span> with title of found feature layer 
			on( li, 'dblclick', me.OnDblClick );

			li.layer = layer;

			me.itemList.appendChild( li );

			if ( me.OnLayerAdded != null )
				me.OnLayerAdded( layer );


			var empty = dom.byId( "emptyli" + me.theID );
			if ( empty == null ) {
				empty = document.createElement( "li" );
				empty.className = me.classes.emptyItem;
				empty.id = "emptyli" + me.theID;
				itemList.appendChild( empty );
			}
			else {
				domConstruct.place( empty, me.itemList, "last" );
			}

			showButtons();

		};

		showButtons = function () {

			for ( var idx = 0; idx < me.getCount() ; ++idx ) {
				var li = me.itemList.children[idx];
				var buttonsDiv = dom.byId( "btns" + li.id );
				if ( idx == 0 )
					buttonsDiv.style.display = "none";
				else {
					var upBtn = dom.byId( "up" + li.id );
					var downBtn = dom.byId( "down" + li.id );

					upBtn.style.display = "block";
					if ( idx == 1 ) {
						upBtn.style.display = "none";
					}

					downBtn.style.display = "block";

					if ( idx == me.getCount() - 1 ) {
						downBtn.style.display = "none";
						if ( idx == 1 )
							upBtn.style.display = "none";
					}
				}
			}

		};

		this.addLayer = function ( layer, service ) {
			addItem( layer, service );
		};

		var removeLayer = function ( e ) {
			var li = e.currentTarget.parentElement.parentElement;

			map.removeLayer( map.getLayer( li.layer.id ) );
			me.itemList.removeChild( li );

			showButtons();
		};

		moveDown = function ( e ) {
			var li = e.currentTarget.parentElement.parentElement;

			domConstruct.place( li, li.nextSibling, "after" );

			map.reorderLayer( li.layer.id, me.getIndex( li ) + 1 );
			setTimeout( showButtons, 100 );
		};

		moveUp = function ( e ) {
			var li = e.currentTarget.parentElement.parentElement;

			domConstruct.place( li, li.previousSibling, "before" );

			map.reorderLayer( li.layer.id, me.getIndex( li ) - 1 );
			setTimeout( showButtons, 100 );
		};

		return this;
	};

	LayerList.prototype = new ItemList;
} );
