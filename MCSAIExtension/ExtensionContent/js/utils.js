	function downloadPdf( ppid, callb ) {

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

						if (callb)
							callb();
						// Got here from the heart of Illustrator
						window.cep.fs.deleteFile( userPath );
						
					} );
					console.log( "what" );
				};
				// Go to convert
				reader.readAsDataURL( blob );
			}
			else
				alert( "Could not download PDF file" );
		};

		// Go to download
		xhr.send( null );
		console.log( "Sent" );
	}
