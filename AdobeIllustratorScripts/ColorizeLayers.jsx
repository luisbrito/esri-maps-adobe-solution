#target Illustrator

var colors = [createColor(255, 0, 0), 
                    createColor(0, 152, 152),
                    createColor(255, 128, 0),
                    createColor(0, 0, 255),
                    createColor(0, 128, 0),
                    createColor(255, 0, 0),
                    createColor(180, 170, 70),
                    createColor(128, 0, 0),                    
                    createColor(0, 255, 0),
                    createColor(128, 0, 128),
                    createColor(0, 255, 255),
                    createColor(0, 0, 128),
                    createColor(255, 0, 255)];

var colorsCount = colors.length;
var docRef = app.activeDocument;

for (i=0; i<docRef.layers.length; i++) {
    var colorIndex = i % colorsCount;
    var rgbColor = colors[colorIndex];
    docRef.layers[i].color =rgbColor;
    var  subLayers  = new Array();
    getSubLayers(subLayers, docRef.layers[i]);
    for (j =0; j <subLayers.length; j++) {
        subLayers[j].color =rgbColor;
     }
}

function getSubLayers (destination, mainLayer) {
      for (k=0; k<mainLayer.layers.length; k++) {
             destination.push(mainLayer.layers[k]);
             if (mainLayer.layers[k].length > 0)
                getSubLayers(destination, mainLayer.layers[k]);
         }
};

function createColor(red, green, blue){
     var newRGBColor = new RGBColor();
    newRGBColor.red =red;
    newRGBColor.green = green;
    newRGBColor.blue = blue;
    return newRGBColor;
}

