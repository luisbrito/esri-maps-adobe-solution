#target Illustrator

var docRef = app.activeDocument;
 
 run();

function run(){
    for (var i=0; i<docRef.layers.length; i++) {
        removeClipping(docRef.layers[i]);

        var  subLayers  = new Array();
        getSubLayers(subLayers, docRef.layers[i]);
        for (var j =0; j <subLayers.length; j++) {
            removeClipping(subLayers[j]);
        }
    }
}

function removeClipping(layer){
    if (layer.pageItems.length > 0  && layer.pageItems[0].clipping== true){
            layer.pageItems[0].remove();
    }
    if (layer.groupItems.length > 0 
         && layer.groupItems[0].pageItems.length > 0 
         && layer.groupItems[0].pageItems[0].clipping== true){
            layer.groupItems[0].pageItems[0].remove();
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
