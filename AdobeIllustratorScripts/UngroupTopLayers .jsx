#target Illustrator

var docRef = app.activeDocument;

var length = docRef.layers.length;
 for (i=length-1; i>=0; i--) {
     if (docRef.layers[i].layers.length > 0){
         for (j=docRef.layers[i].layers.length -1; j>=0 ; j--) {
             var layer = docRef.layers[i].layers[j];
             layer.move(docRef.layers[i], ElementPlacement.PLACEAFTER);
         }
     docRef.layers[i].remove();
     }
}