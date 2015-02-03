#target Illustrator

var docRef = app.activeDocument;

for (i=docRef.pageItems.length-1;i>=0;i--) {
        if (docRef.pageItems[i].clipping == true){
            docRef.pageItems[i].remove();
        }
}

