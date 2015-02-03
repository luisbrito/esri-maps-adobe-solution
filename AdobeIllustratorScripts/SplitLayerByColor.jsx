#target Illustrator

var docRef = app.activeDocument;
var activeLayer = docRef.activeLayer;

for (i=0; i<docRef.layers.length; i++) {
     var currentLayer = docRef.layers[i];
     splitLayer(currentLayer);
     if (currentLayer.name != "All_Dallas_HighSchools"){
        var  subLayers  = new Array();
        getSubLayers(subLayers, currentLayer);
        for (j =0; j <subLayers.length; j++) {
            splitLayer(subLayers[j]);
        } 
    }
}

function splitLayer(layer) {
    var nikeSportLayer, nikeFootballLayer, otherLayer;
    if (layer.name == "All_Dallas_HighSchools")
    {
        otherLayer = layer.layers.add();
        otherLayer.name = 'Other';    
        nikeFootballLayer = layer.layers.add();
        nikeFootballLayer.name = 'NIKE FOOTBALL';
        nikeSportLayer = layer.layers.add();
        nikeSportLayer.name = 'NIKE SPORT';
     }
    
    var pathItems = getPaths(layer);
    var pathGroups=new Array();

    for (var j=0; j <pathItems.length; j++){
        var currentPath = pathItems[j];
        var isNewSymbol = true;
        for (var k=0; k<pathGroups.length; k++){
             if (currentPath.strokeWidth ==  pathGroups[k].strokeWidth
                 && compareColors(pathGroups[k].strokeColor, currentPath.strokeColor)
                 && compareColors(pathGroups[k].fillColor, currentPath.fillColor)){
                     pathGroups[k].pathItems.push(currentPath.path);
                     isNewSymbol = false;
                     break;
             }
        }

        if (isNewSymbol)
            pathGroups.push({fillColor: currentPath.fillColor, strokeColor:  currentPath.strokeColor, strokeWidth: currentPath.strokeWidth,  pathItems: [currentPath.path]});
  }

   if (pathGroups.length > 1){
        //handle All_Dallas_HighSchools
        if (layer.name == "All_Dallas_HighSchools"){
            for (var j=0; j <pathGroups.length; j++){
                    var pathGroup = pathGroups[j];
                    
                    if (pathGroup.fillColor.red == 76
                        && pathGroup.fillColor.green == 230
                        && pathGroup.fillColor.blue == 0){
                        for (var k=0; k <pathGroup.pathItems.length; k++){
                            pathGroup.pathItems[k].move(nikeSportLayer, ElementPlacement.INSIDE);
                        }
                    }                    
                    else if (pathGroup.fillColor.red == 115
                        && pathGroup.fillColor.green == 76
                        && pathGroup.fillColor.blue == 0){
                            for (var k=0; k <pathGroup.pathItems.length; k++){
                            pathGroup.pathItems[k].move(nikeFootballLayer, ElementPlacement.INSIDE);
                        }
                    }
                    else{
                            for (var k=0; k <pathGroup.pathItems.length; k++){
                            pathGroup.pathItems[k].move(otherLayer, ElementPlacement.INSIDE);
                        }
                    }
            }
        }
        //handle other layers
        else {
            for (var j=0; j <pathGroups.length; j++){
                    var newLayer = layer.layers.add();
                    var  pathGroup = pathGroups[j];
                    for (var k=0; k <pathGroup.pathItems.length; k++){
                            pathGroup.pathItems[k].move(newLayer, ElementPlacement.INSIDE);
                    }
            }
        }
    }   
 }

function getSubLayers (destination, layer) {
      for (k=0; k<layer.layers.length; k++) {
             destination.push(layer.layers[k]);
             if (layer.layers[k].length > 0)
                getSubLayers(destination, layer.layers[k]);
         }
}

function getPaths(layer){
    var paths = new Array();
    for (var i=0; i <layer.compoundPathItems.length; i++){
            for (var j=0; j <layer.compoundPathItems[i].pathItems.length; j++){
                    addPathInfo(layer.compoundPathItems[i], layer.compoundPathItems[i].pathItems[j],  paths);
                  break;
            }
     }      
    for (var i=0; i <layer.pathItems.length; i++)
            addPathInfo(layer.pathItems[i], layer.pathItems[i],  paths);
     getGroupPathItems(layer.groupItems, paths);
     return paths;
 }

function getGroupPathItems (groupItems, destination) {
      for (var i=0; i<groupItems.length; i++) {
             for (var k =0; k <groupItems[i].compoundPathItems.length; k++){
                    for (var j=0; j <groupItems[i].compoundPathItems[k].pathItems.length; j++){
                         addPathInfo(groupItems[i].compoundPathItems[k], groupItems[i].compoundPathItems[k].pathItems[j],  destination);
                       
                    break;
                    }
             }      
           for (var j=0; j <groupItems[i].pathItems.length; j++){
                   addPathInfo(groupItems[i].pathItems[j], groupItems[i].pathItems[j], destination);
            }
           if (groupItems[i].groupItems.length > 0)
                getGroupPathItems(destination, groupItems[i].groupItems);
      }
}

function addPathInfo(pathObject, sourcePath, destination){
        destination.push({fillColor: sourcePath.fillColor,  strokeColor:  sourcePath.strokeColor,  strokeWidth: sourcePath.strokeWidth, path: pathObject});    
}

function compareColors(color1, color2){
    if (color1.typename == "NoColor" 
        &&  color2.typename == "NoColor" )
        return true;

    if (color1.typename == "RGBColor" 
        &&  color2.typename == "RGBColor" 
        && color1.red ==color2.red
        && color1.green == color2.green
        && color1.blue == color2.blue)
        return true;
        
        if (color1.typename == "CMYKColor" 
        &&  color2.typename == "CMYKColor" 
        && color1.black ==color2.black
        && color1.cyan == color2.cyan
        && color1.magenta == color2.magenta
        && color1.yellow == color2.yellow)
        return true;
        
        if (color1.typename == "GrayColor" 
        &&  color2.typename == "GrayColor" 
        && color1.gray ==color2.gray)
        return true;
        
        return false;
 }













