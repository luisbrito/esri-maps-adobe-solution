#target Illustrator

var activeDocument= app.activeDocument;
var textFrames = activeDocument.textFrames;

for (j=textFrames.length -1; j>=0 ; j--) {
    if ( textFrames[j].contents === '!')
         textFrames[j].createOutline();
 }




