$._ext_ILST={
	    run : function(path) {
	        var doc /*= app.activeDocument*/;
	        if (app.documents.length > 0)
	            doc = app.activeDocument;
	        else
	            doc = app.documents.add();
	        if (!doc)
	        {
	            alert ("No document");
	            return path;
	        }
	        var pi = doc.placedItems.add();
	        if (!pi)
	        {
	            alert ("Could not add placed item");
	            return path;
	        }
	        var f = new File(path);
	        if (!f)
	        {
	            alert ("Could not open file");
	            return path;
	        }
	        f.open('r');
	        pi.file = f;
	        pi.embed();
	        f.close();
	        /************************************************************************/
	        
	        return path;
	    },
	    
	    
	    getArcGISmetadata : function()
	    {
	    	if (app.documents.length == 0)
	    		return '{"error" : "No document"}';
	    		 
	    	// Load library for working with XMP
			if (ExternalObject.AdobeXMPScript == undefined)
		    	ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
		   	if (ExternalObject.AdobeXMPScript == undefined)
		   		return '{"error" : "No library"}';
		   		
		   	// Get metadata of the active doc
		    var doc = app.documents[0];
		    if (doc == undefined)
		    	return '{"error" : "No document"}';
		    var myXmp = new  XMPMeta(doc.XMPString);
			if (myXmp == undefined)
				return '{"error" : "No XMP"}';
				
			// Check if needed properties are in metadata
			var pr = XMPMeta.registerNamespace ("http://ArcGIS.com/", "arcGIS"); //Register the prefix with name space
			var isSr = myXmp.doesPropertyExist( "http://ArcGIS.com/", "SpatialReference");
			var isId = myXmp.doesPropertyExist( "http://ArcGIS.com/", "BaseMapID");
			if ((!isSr) && (!isId))
				return '{"error" : "No ArcGIS metadata"}';
			
			// Get the properties
			var ret = '{"error" : "No", "metadata" : {';
			if (isSr)
			{
				var sr = myXmp.getProperty( "http://ArcGIS.com/", "SpatialReference");
				ret += ('"SpatialReference" : ' + sr);
			}
			if (isId)
			{
				if (isSr)
					ret += ',';
				var mId = myXmp.getProperty( "http://ArcGIS.com/", "BaseMapID");
				ret += ('"BaseMapID" : "' + mId + '"');
			}
			ret += '}}';
		    return ret;
	    },
	    
	   xmpUpdate: function(newXmp)
	   {
	   		var props = newXmp.split(";",2);
	   		if ((props == undefined) || (props.length < 2))
	   			return '{"error" : "No input data"}'; 
	    	if (app.documents.length == 0)
	    		return '{"error" : "No document"}';
	    		 
	    	// Load library for working with XMP
			if (ExternalObject.AdobeXMPScript == undefined)
		    	ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
		   	if (ExternalObject.AdobeXMPScript == undefined)
		   		return '{"error" : "No library"}';
		   		
		   	// Get metadata of the active doc
		    var doc = app.documents[0];
		    if (doc == undefined)
		    	return '{"error" : "No document"}';
		    var myXmp = new  XMPMeta(doc.XMPString);
			if (myXmp == undefined)
				return '{"error" : "No XMP"}';
			var pr = XMPMeta.registerNamespace ("http://ArcGIS.com/", "arcGIS"); //Register the prefix with name space
			myXmp.setProperty("http://ArcGIS.com/", "SpatialReference",  props[0]);
			myXmp.setProperty("http://ArcGIS.com/", "BaseMapID",  props[1]);
			var ser = myXmp.serialize();
			doc.XMPString = ser;
			return '{"error" : "No"}';
	   },
	};
