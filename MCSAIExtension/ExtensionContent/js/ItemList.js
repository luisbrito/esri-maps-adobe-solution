define(["dojo/_base/array", "dojo/_base/lang", "dojo/query", "dojo/dom", "dojo/on", "dojo/dom-class", "dojo/dom-construct", "esri/request"],
function (array, lang, query, dom, on, domClass, domConstruct, esriRequest) {

    ItemList = function (id, parentNode) {
        this.parentElement = parentNode;
        this.theID = id;
        this.upperBound = 0;

        var me = this;
        if (this.parentElement != null)
            this.parentElement.onkeydown = function (e) {
                me.navigate(e, me);
            };

        this.listContainer = document.createElement("div");
        this.listContainer.id = this.theID;
        //this.listContainer.className = 'ServiceListContainer';

        var itemList = document.createElement("ul");
        itemList.id = 'listAllServices_' + this.theID;
        //itemList.className = 'ServiceList';
        this.listContainer.appendChild( itemList );
		if (parentNode != null)
			parentNode.appendChild(this.listContainer);

        this.itemList = dom.byId('listAllServices_' + this.theID);
        this.classes = {
            emptyItem: "empty",
            itemList: "",
            selectedItem: "",
            notSelectedItem: ""
        };


        this.lastSelectedItem = null;
        this.optionGrid = null;
        this.emptyItem = null;
        this.selectedItems = [];
        this.lastSelectedItem = null;
        this.listContainer = null;
        this.optionSource = null;
        this.singleSelection = false;
        this.alwaysSelection = false;
        this.allowDeleting = true;
        //events
        this.OnClick = null;
        this.OnSelectionChanged = null;
        this.hideOptions = function (e, owner) {
            //if ( ( typeof owner ) == 'string' ) {
            //	owner = dom.byId( owner );
            //}

            var li;
            if (e.currentTarget != null)
                li = e.currentTarget;
            else
                li = findLi(e, owner);

            if (li == null)
                return;

            if (owner.optionGrid != null) {
                domConstruct.destroy(owner.optionGrid.id);
                owner.optionGrid = null;
            }
        };

        this.setParent = function (parent) {
            if (parent == null)
                return;

            parent.onkeydown = function (e) {
                me.navigate(e, this);
            };
        };

        this.setGeoService = function (service) {
            this.geoService = service;
        };

        this.deleteAll = function () {

            var itemsToDelete = this.getItems();
            array.forEach(itemsToDelete, function (itemId, idx) {
                if (me.selectedItems[itemId] != null)
                    delete me.selectedItems[itemId];

                domConstruct.destroy(itemId);

                if (me.OnItemDeleted != null)
                    me.OnItemDeleted(itemId);

                if (me.OnSelectionChanged != null)
                    me.OnSelectionChanged();

            });

            me.lastSelectedItem = null;
            me.upperBound = 0;
        };

        this.RunService = null;
    	this.getIndex = function ( testli ) {
    		var retIdx = -1;
    		array.forEach( this.itemList.children, function ( li, idx ) {
    			if ( li.id == testli.id )
    				retIdx = idx;
    		} );

    		return retIdx;
    	};



        return this;
    };
    ItemList.prototype = (function () {
        
        findLi = function (id, owner) {
            if (owner == null)
                return null;

            for (iChild in owner.itemList.children) {
                var li = owner.itemList.children[iChild];
                if (li.id == id)
                    return li;
            }

            return null;
        };

        return {
            constructor: ItemList,
            theID: "",
            parentElement: null,
            itemList: null,
            emptyItem: null,
            selectedItems: [],
            lastSelectedItem: null,
            listContainer: null,
            optionSource: null,
            classes: {
                emptyItem: "empty",
                itemList: "",
                selectedItem: "",
                notSelectedItem: ""
            },

            Delete: function (itemsToDelete, owner) {


                array.forEach(itemsToDelete, function (itemId, idx) {
                    if (owner.selectedItems[itemId] != null)
                        delete owner.selectedItems[itemId];

                    domConstruct.destroy(itemId);

                    if (owner.OnItemDeleted != null)
                        owner.OnItemDeleted(itemId);

                    if (owner.OnSelectionChanged != null)
                        owner.OnSelectionChanged();

                });

                owner.lastSelectedItem = null;

            },

            getCount: function () {
                if (this.itemList == null)
                    return 0;

                var n = this.itemList.children.length;
                if (dom.byId("emptyli" + this.theID) != null)
                    --n;

                return n;
            },

            setOptionSource: function (source) {
                this.optionSource = source;
            },

            setEvent: function (event, callback) {
                switch (event) {
                    case 'dblclick':
                        this.OnDblClick = callback;
                        break;
                    case 'click':
                        this.OnClick = callback;
                        break;
                    case 'itemAdded':
                        this.OnItemAdded = callback;
                        break;
                    case 'selectionChanged':
                        this.OnSelectionChanged = callback;
                        break;
                    case 'itemDeleted':
                        this.OnItemDeleted = callback;
                        break;
                }
            },

            selectItem: function (s, all, owner) {
                if (owner == null)
                    owner = this;

                if (s == null) {
                    owner.lastSelectedItem = null;
                    return null;
                }

                var li;
                if ((typeof s) == 'string') {
                    li = findLi(s, owner);
                }
                else {
                    if (s.currentTarget != null)
                        li = s.currentTarget;
                    else
                        li = s;
                }

                if (owner.singleSelection == true)
                    all = true;

                if (li == null || li.className == "empty") {
                    return;
                }

                var wasSelected = false;
                if (li.className == owner.classes.selectedItem) {
                	//if ( !owner.alwaysSelection ) {
                	wasSelected = true;
                    li.className = owner.classes.notSelectedItem;
                    if (owner.selectedItems[li.id] != null)
                        delete owner.selectedItems[li.id];
                    //}
                    else
                        all = false;

                }

                if (this.OnClick != null)
                    this.OnClick(li.id);

                //remove another selections
                if (all != false) {
                    var selections = Object.keys(owner.selectedItems);

                    for (var i = selections.length - 1; i >= 0; --i) {
                        var slid = selections[i];
                        if (slid != li.id) {
                            owner.selectItem(slid, all, owner);
                        }
                    }
                }

                if ( !wasSelected ) {
                	this.selectedItems[li.id] = li;
                	li.className = this.classes.selectedItem;
                	owner.lastSelectedItem = li.id;
				}

                if ( this.OnSelectionChanged != null )
                    this.OnSelectionChanged();

            },

            scrollToItem: function (itemId) {
                var li = findLi(itemId, this);
                if (li == null)
                    return;

                var ul = li.parentNode;
                if (ul == null)
                    return;

                if (ul.scrollTop + ul.offsetHeight < li.offsetTop + li.offsetHeight)
                    ul.scrollTop += li.offsetHeight;
                else if (ul.scrollTop > li.offsetTop) {
                    ul.scrollTop -= li.offsetHeight;
                }
            },

            navigate: function (event, owner) {
                var keyCode = event.keyCode || event.charOrCode;
                if (keyCode == 9) {
                    owner.parentElement.focus();
                    return;
                }

                if (event.srcElement.className == "itemOptionEditable") {
                    return;
                }

                if (keyCode == 46 && this.allowDeleting) //delete
                {
                    owner.Delete(Object.keys(owner.selectedItems), owner);
                }
                else if (keyCode == 13 || keyCode == 27) {

                }
                else if (keyCode > 36 && keyCode < 41) {

                    var lastChild = owner.itemList.lastChild.previousSibling; //avoid empty item
                    if (lastChild == null)
                        return;

                    if (lastChild.className == owner.classes.optionsContainer)
                        lastChild = lastChild.previousSibling;

                    switch (keyCode) {
                        case 37: //left
                            var li;
                            if (owner.lastSelectedItem == null) {
                                owner.selectItem(lastChild);
                                li = lastChild;
                            }
                            else {
                                li = dom.byId(owner.lastSelectedItem);
                                if (li != null) {
                                    var prev = li.previousSibling;
                                    if (prev == null)
                                        break;

                                    if (prev.className == owner.classes.optionsContainer)
                                        prev = prev.previousSibling;
                                    owner.selectItem(prev, !event.ctrlKey);
                                }
                            }
                            break;
                        case 38: //up
                            var li;
                            if (owner.lastSelectedItem == null) {
                                owner.selectItem(lastChild);
                                li = lastChild;
                            }
                            else {
                                li = dom.byId(owner.lastSelectedItem);
                                if (li == null)
                                    break;
                                var columnCount = Math.floor(owner.itemList.offsetWidth / li.offsetWidth + 0.5);
                                var n = 0;
                                while (n < columnCount && li != null) {
                                    li = li.previousSibling;
                                    if (li != null && li.className != owner.classes.optionsContainer)
                                        n++;
                                }

                                owner.selectItem(li, !event.ctrlKey);
                            }

                            break;
                        case 39: //right
                            var li;
                            if (owner.lastSelectedItem == null) {
                                owner.selectItem(owner.itemList.firstChild);
                                li = owner.itemList.firstChild;
                            }
                            else {
                                li = dom.byId(owner.lastSelectedItem);
                                if (li != null) {
                                    var next = li.nextSibling;
                                    if (next == null)
                                        return;

                                    if (next.className == 'optionsContainer')
                                        next = next.nextSibling;
                                    owner.selectItem(next, !event.ctrlKey);
                                }
                            }
                            break;
                        case 40: //down
                            var li;
                            if (owner.lastSelectedItem == null) {
                                owner.selectItem(owner.itemList.firstChild);
                                li = owner.itemList.firstChild;
                            }
                            else {
                                li = dom.byId(owner.lastSelectedItem);
                                if (li == null)
                                    break;

                                var columnCount = Math.floor(owner.itemList.offsetWidth / li.offsetWidth + 0.5);
                                var n = 0;
                                while (n < columnCount) {
                                    li = li.nextSibling;
                                    if (li == null || li.className == "empty") {
                                        li = lastChild;
                                        break;
                                    }

                                    if (li != null && li.className != owner.classes.optionsContainer)
                                        n++;
                                }
                                if (li != null)
                                    owner.selectItem(li, !event.ctrlKey);
                            }
                            break;
                        default:
                            return;
                    }

                    owner.scrollToItem(owner.lastSelectedItem);
                }
            },

            append: function (item) {
                return 0;
            },
            getSelectedServices: function () {
                var services = [];
                var keys = Object.keys(this.selectedItems);
                for (var i = 0; i < keys.length; ++i) {
                    var service = dom.byId(keys[i]).service;
                    if (service != null)
                        services.push(service);
                }

                return services;
            },

            getSelected: function () {
                return Object.keys(this.selectedItems);
            },
            setSelected: function (s, select /*true by default*/) {
                if (select == false && this.optionGrid != null)
                    domConstruct.destroy(this.optionGrid.id);

                var li;
                if ((typeof s) == 'string') {
                    li = findLi(s, this);
                }
                else {
                    li = s;
                }

                if (li == null)
                    return;

                if (this.selectedItems[li.id] != null && select == false)
                    delete this.selectedItems[li.id];

                li.className = this.classes.notSelectedItem;
                if (select != false) {
                    this.selectedItems[li.id] = li;
                    li.className = this.classes.selectedItem;
                }

                if (this.OnSelectionChanged != null)
                    this.OnSelectionChanged();
            },
            clearSelection: function () {

                var selections = Object.keys(this.selectedItems);
                var clearer = {
                    className: this.classes.notSelectedItem,
                    collection: selections,
                    items: this.selectedItems,
                    clear: function () {
                        for (var idx = 0; idx < this.collection.length; ++idx) {
                            this.items[this.collection[idx]].className = this.className;
                        };
                    }
                };
                clearer.clear();

                this.selectedItems = [];

                if (this.OnSelectionChanged != null)
                    this.OnSelectionChanged();
            },
            getItems: function () {
                var items = [];
                if (this.itemList == null)
                    return items;

                var me = this;
                array.forEach(this.itemList.children, function (li, idx) {
                    if (li.className != me.classes.optionsContainer && li.className != me.classes.emptyItem)
                        items.push(li.id);
                });

                return items;
            },
            deleteItems: function (itemsToDelete) { //items IDs array
                this.Delete(itemsToDelete, this);

            },
            isVisible: function () {
                return this.listContainer.clientHeight != 0;
            },
            showProperties: function (item, mode) {
                this.selectItem(item, mode);
            }
        };
    })();
});
