#target Illustrator

var docRef = app.activeDocument;
var textFrames = docRef.textFrames;

for (j=textFrames.length -1; j>=0 ; j--) {
    var textFrame = textFrames[j];   

    var initpos = textFrame.position;
    var newpos =  textFrame.position;
    newpos[0] =newpos[0] + 1.0;
    
    textFrame.position = newpos;
    textFrame.position = initpos;
 }
