#target Illustrator

var activeDocument= app.activeDocument;
var textFrames = activeDocument.textFrames;

run();

function run(){
    for (j=textFrames.length -1; j>=0 ; j--) {
        var texFrame = textFrames[j];
        if (texFrame.textRange.textFont.family === "ESRI Default Marker")
            texFrame.createOutline();
    }
}



