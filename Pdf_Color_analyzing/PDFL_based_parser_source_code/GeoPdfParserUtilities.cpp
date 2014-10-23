#include "stdafx.h"
#include "GeoPdfParserUtilities.h"

ASErrorCode GetPdsTitleAsString(PDSElement elem, std::string& res)
{
    res.clear();
    ASInt32 titLen;
    // Find out the length
    DURING
        titLen = PDSElementGetTitle(elem, NULL);
    HANDLER
        return ERRORCODE;
    END_HANDLER

    if (titLen == 0)
        return MyErrorCodes::NoError;

    // Get title
    char* buff = new char[titLen + 1];
    DURING
        titLen = PDSElementGetTitle(elem, (ASUns8*)buff);
    HANDLER
        delete[] buff;
        return ERRORCODE;
    END_HANDLER
    if (titLen == 0)
	{
        // Oops!
        delete[] buff;
        return MyErrorCodes::NoError;
	}

    // Remove auxilary bytes
    for (ASInt32 i = 0; i < titLen; i++)
	{
        if (buff[i] > 0)
            res.push_back(buff[i]);
	}

    delete[] buff;

    return MyErrorCodes::NoError;
}

ASErrorCode GetObjId(PDSElement elem, std::string& value)
{
	value.clear();
	PDSAttrObj at;
    // Get attributes of the element
    DURING
	    PDSElementGetAttrObj(elem, 0, &at);
    HANDLER
        return ERRORCODE;
    END_HANDLER

    // Go to low level objects
	CosObj attr = PDSAttrObjGetCosObj(at);
	if (CosObjGetType(attr) == CosDict)
	{
        // Get array with attributive fileds values
		CosObj arr = CosDictGetKeyString(attr, "P");
		if (CosObjGetType(arr) == CosArray)
		{
            // Get first attribute (field). Supposed it's Object ID
			CosObj firstAttr = CosArrayGet(arr, 0);
			if (CosObjGetType(firstAttr) == CosDict)
			{
                // Get the value of the field
				CosObj objVal = CosDictGetKeyString(firstAttr, "V");
				if (CosObjGetType(objVal) == CosString)
				{
					ASTCount strSize;
					char* strValue = CosStringValue(objVal, &strSize);

                    // Remove auxilary bytes
					for (ASTCount ind = 0; ind < strSize; ind++)
					{
						if (strValue[ind] > 0)
							value.push_back(strValue[ind]);
					}
				}
			}
		}
	}
    return MyErrorCodes::NoError;
}