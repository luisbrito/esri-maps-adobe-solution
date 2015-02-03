#target Illustrator

var docRef = app.activeDocument;
  
 run();
 
 function run(){
    var isLayerGrouped = true;
    while (isLayerGrouped){
        var length = docRef.layers.length;
        isLayerGrouped = false;
        for (var j= length-1; j>=0; j--) {
            var currentLayer = docRef.layers[j];
            if (checkLayer(currentLayer)){
                ungoupLayer(currentLayer);
                isLayerGrouped = true;
           }
        }
    }
}

function checkLayer(layer){
      for (j=layer.layers.length -1; j>=0 ; j--) {
                if (layer.layers[j].layers.length > 0)
                    return true;
      }
      return false;
}

function ungoupLayer(groupLayer){
    if (groupLayer.layers.length > 0){
        for (j=groupLayer.layers.length -1; j>=0 ; j--) {
                var layer = groupLayer.layers[j];
                layer.move(groupLayer, ElementPlacement.PLACEAFTER);
        }
        groupLayer.remove();
    }
}





