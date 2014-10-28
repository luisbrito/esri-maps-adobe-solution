/*********************************************************************

 ADOBE SYSTEMS INCORPORATED
 Copyright (C) 1994-2006 Adobe Systems Incorporated
 All rights reserved.

 NOTICE: Adobe permits you to use, modify, and distribute this file
 in accordance with the terms of the Adobe license agreement
 accompanying it. If you have received this file from a source other
 than Adobe, then your use, modification, or distribution of it
 requires the prior written permission of Adobe.

 ---------------------------------------------------------------------

 PDFLInitHFT.c  -- derived from:
 PIMain.c - Source code that must be linked into every plug-in.

*********************************************************************/

#include "ASExpT.h"
#include "PDFLInitCommon.h"
#include "PDFLCalls.h"
#if WIN_ENV
#include <windows.h>
#endif

#if MAC_PLATFORM && !defined(__cplusplus)
#error This file needs to be compiled as C++ on Macintosh  
#elif UNIX_PLATFORM && !defined(__cplusplus)
#error This file needs to be compiled as C++ on Unix
#endif

#ifdef __cplusplus
extern "C" {
#endif

ASInt32 PDFLInitHFT(PDFLData data)
{
	InitProcs procs;
	ASInt32 errorCode;

	/* Get location of functions needed to initialize the HFT mechanism */
	procs.initProc = (PDFLInitType) PDFLInit;
	procs.getCoreHFTProc = (PDFLGetCoreHFTType) PDFLGetCoreHFT;
	procs.initThreadLocalData = PDFLInitThreadLocalData;
	if ( !procs.getCoreHFTProc )
		return GenError(ERR_GENERAL);
	
	/* Initialize the library */
	if ( (errorCode = PDFLInitCommon(data, &procs, sizeof(HFTLocations))) != 0)
		return errorCode;
	return 0;

}

void PDFLTermHFT(void)
{
	TermProcs termProcs;

	/* Specify termination function */
	termProcs.termProc = (PDFLTermType) PDFLTerm;

	 /* Shutdown PDF Library */
	PDFLTermCommon(&termProcs);
}


#ifdef __cplusplus
}
#endif

