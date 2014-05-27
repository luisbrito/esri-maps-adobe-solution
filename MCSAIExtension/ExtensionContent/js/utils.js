	function downloadPdf( ppid, sc, ext, sr, mType, callb ) {

		// Get the path to save tmp file
		var inter = new CSInterface();
		var userPath = inter.getSystemPath( SystemPath.USER_DATA ) + '/' + 'myTemp.pdf';
		// Create the request to download the PDF file
		var xhr = new XMLHttpRequest();
		xhr.open( "GET", ppid, true );
		xhr.responseType = "blob";
		var blob;
		xhr.onload = function onReady( e ) {
			if ( e.target.status == 200 ) {

				// Convert got BLOB to URL something
				blob = this.response;
				var reader = new FileReader();

				reader.onload = function () {
					// remove the prefix from the text representation of file
					var prefix = "data:application/pdf;base64,";
					var len = prefix.length;
					var pdfBase = this.result;
					var l = pdfBase.length - len;
					var nakedPDF = pdfBase.substr( len, l );
					var res = window.cep.fs.writeFile( userPath, nakedPDF, "Base64" );
					if ( res.err != 0 ) {
						alert( "Could not save PDF in local file system" );
						return;
					}

					// Add PDF to Illustrator document
					var extScript = '$._ext_ILST.run("' + userPath + '")';
					inter.evalScript( extScript, function ( pp ) {
						window.cep.fs.deleteFile( userPath );
						var newScript = '$._ext_ILST.xmpUpdate("';
						newScript += sc.toString();
						newScript += ';';
						var xy = ext.xmax;
						newScript += xy.toString();
						newScript += ';';
						xy = ext.xmin;
						newScript += xy.toString();
						newScript += ';';
						xy = ext.ymax;
						newScript += xy.toString();
						newScript += ';';
						xy = ext.ymin;
						newScript += xy.toString();
						newScript += ';';
						newScript += sr.toString();
						newScript += ';';
						newScript += mType;
						newScript += '")';
						//"102100;30e5fe3149c34df1ba922e6f5bbf808f")';
						inter.evalScript(newScript, function(ret){
							if (callb)
								callb();
						});
						// Got here from the heart of Illustrator
						
					} );
				};
				// Go to convert
				reader.readAsDataURL( blob );
			}
			else
			{
				alert( "Could not download PDF file" );
				if (callb)
					callb();
			}
		};

		// Go to download
		xhr.send( null );
		console.log( "Sent" );
	}
