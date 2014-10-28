#pragma once

#include <string>
#include "PDFInit.h"
#include "PDFLCalls.h"
#include "PDBasicExpT.h"
#include "PDExpT.h"
#include "CoreExpT.h"
#include "CorCalls.h"
#include "ASExpT.h"
#include "ASCalls.h"
#include "CosCalls.h"
#include "PEExpT.h"
#include "PagePDECntCalls.h"
#include "PERCalls.h"
#include "PDSExpT.h"
#include "PDSReadCalls.h"

class ICancel
{
public:
	virtual bool ShouldContinue() = 0;
	virtual void SetProgress(int progr) = 0;
};

enum ColorType
{
	cmyk,
	rgb
};

enum MyErrorCodes
{
	NoError,
	NotInitialized,
	InputColorComptents,
	UnknownColorCode,
	WrongColorInFeature
};

ASErrorCode GetPdsTitleAsString(PDSElement elem, std::string& res);
ASErrorCode GetObjId(PDSElement elem, std::string& value);