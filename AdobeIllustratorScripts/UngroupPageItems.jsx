#target Illustrator

var docRef = app.activeDocument;
   
for (var i=0; i<docRef.layers.length; i++) {
   ungroup(docRef.layers[i]);
   
    var  subLayers  = new Array();
    getSubLayers(subLayers, docRef.layers[i]);
    for (var j =0; j <subLayers.length; j++) {
         ungroup(subLayers[j]);
     }
}

function ungroup(layer){
     for (var o=0; o<layer.groupItems.length; o++) {
        for ( var k = layer.groupItems[o].pageItems.length-1; k >= 0; k--) {
                var artItem =layer.groupItems[o].pageItems[k];
                artItem.move(layer.groupItems[o], ElementPlacement.PLACEAFTER);
        }
    }
}

function getSubLayers (destination, mainLayer) {
      for (var k=0; k<mainLayer.layers.length; k++) {
          var currentLayer = mainLayer.layers[k];
             destination.push(currentLayer);
             if (currentLayer.layers.length > 0)
                getSubLayers(destination, currentLayer);
         }
};

