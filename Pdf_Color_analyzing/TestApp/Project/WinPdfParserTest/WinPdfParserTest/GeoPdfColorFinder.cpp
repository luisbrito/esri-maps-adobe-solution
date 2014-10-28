#include "stdafx.h"
#include "GeoPdfColorFinder.h"


CGeoPdfColorFinder::CGeoPdfColorFinder(void)
{
	m_isInit = false;
	m_isOpen = false;
	m_maxCount = 0;
	m_myErrorCode = MyErrorCodes::NoError;
	m_lastError = 0;
	m_canceltTracker = NULL;

	// Initialize PDFL
	PDFLDataRec	pdflData;
	memset(&pdflData, 0, sizeof(PDFLDataRec));
	pdflData.size = sizeof(PDFLDataRec);
	if (PDFLInitHFT(&pdflData) != 0)
	{
		m_myErrorCode = MyErrorCodes::NotInitialized;
		return; // Oops!
	}
	m_isInit = true;
}


CGeoPdfColorFinder::~CGeoPdfColorFinder(void)
{
	if (m_isOpen)
		PDDocClose(m_Doc);
	if (m_isInit)
		PDFLTermHFT();
}


void CGeoPdfColorFinder::GetErrorMessage(std::string& mess)
{
	mess.clear();
	if (m_lastError != MyErrorCodes::NoError)
	{
		char buf[1024];
		ASGetErrorString(m_lastError, buf, 1023);
		mess = buf;
		return;
	}
	switch (m_myErrorCode)
	{
	case MyErrorCodes::NotInitialized:
		mess = "PDFL was not initialized";
		break;
	case MyErrorCodes::InputColorComptents:
		mess = "Wrong number of comonents in color";
		break;
	case MyErrorCodes::UnknownColorCode:
		mess = "Unkonown color scheme";
		break;
	case MyErrorCodes::WrongColorInFeature:
		mess = "Wrong color type of feature";
		break;
	default:
		mess = "No error";
	}
}

bool CGeoPdfColorFinder::OpenPdf(const char* path)
{
	if (m_isOpen)
		PDDocClose(m_Doc);
	m_isOpen = false;
	m_featuresWithColor.clear();
	ASPathName pathName = ASFileSysCreatePathName(NULL,ASAtomFromString("Cstring"), path,NULL);
	DURING
		m_Doc = PDDocOpen (pathName, NULL, NULL, false);
	HANDLER
		m_lastError = ERRORCODE;
		return false;
	END_HANDLER
	m_isOpen = true;
	return true;
}

int CGeoPdfColorFinder::CalcMaxElement()
{
		PDSTreeRoot tree;
		ASBool r = PDDocGetStructTreeRoot(m_Doc, &tree);
		ASInt32 count = PDSTreeRootGetNumKids(tree);
		int retVal = 0;
		for (ASInt32 i = 0; i < count; i++)
		{
			PDSElement kid;
			PDSTreeRootGetKid(tree, i, &kid);
			ASAtom  type =  PDSElementGetType(kid); 
			CString sType(ASAtomGetString(type));
			if (sType.CompareNoCase(_T("Figure")) != 0)
				continue;
			retVal++;
			CalcElements(kid, retVal);
		}
		return retVal;
}

bool CGeoPdfColorFinder::FindFeatures4Color(ColorType colorType, std::vector<long> components)
{
	if ((!m_isInit) || (!m_isOpen))
		return false;
	m_lastError = MyErrorCodes::NoError; 
	m_myErrorCode = MyErrorCodes::NoError;
	m_featuresWithColor.clear();
	if (!SetColors(colorType, components))
		return false;
	bool retVal = true;
	m_maxCount = CalcMaxElement();
	m_curIndex = 0;
	m_curPercentage = 0;
	m_canceltTracker->SetProgress(0);
	DURING
		PDSTreeRoot tree;
		ASBool r = PDDocGetStructTreeRoot(m_Doc, &tree);
		ASInt32 count = PDSTreeRootGetNumKids(tree);
		for (ASInt32 i = 0; i < count; i++)
		{
			PDSElement kid;
			PDSTreeRootGetKid(tree, i, &kid);
			ASAtom  type =  PDSElementGetType(kid); 
			CString sType(ASAtomGetString(type));
			if (sType.CompareNoCase(_T("Figure")) != 0)
				continue;
			m_curIndex++;
			int curP = (int)(((double)m_curIndex/(double)m_maxCount)*100 +0.5);
			if (curP > m_curPercentage)
			{
				m_curPercentage = curP;
				m_canceltTracker->SetProgress(curP);
			}
			if (!ParseTreeElement(kid))
			{
				retVal = false;
				break;
			}
		}
	HANDLER
		m_lastError = ERRORCODE;
		return false;
	END_HANDLER
	return retVal;
}

bool CGeoPdfColorFinder::SetColors(ColorType colorType, std::vector<long> components)
{
	// Setting up pattern color components
	if ((colorType != ColorType::cmyk) && (colorType != ColorType::rgb))
	{
		m_myErrorCode = MyErrorCodes::UnknownColorCode;
		return false;
	}
	m_rgbComponents.clear();
	m_cmykComponents.clear();
	if (colorType == ColorType::rgb)
	{
		size_t sz = components.size();
		if (sz != 3)
		{
			m_myErrorCode = MyErrorCodes::InputColorComptents;
			return false;
		}
		for (size_t i = 0; i < components.size(); i++)
			m_rgbComponents.push_back(components[i]);

		// Convert RGB to CMYK
		double r = ((double)components[0])/255.;
		double g = ((double)components[1])/255.;
		double b = ((double)components[2])/255.;
		double k = r;
		if (k < g)
			k = g;
		if (k < b)
			k = b;
		k = 1. - k;
		double c = (1. - r - k)/(1. - k);
		double m = (1. - g - k)/(1. - k);
		double y = (1. - b - k)/(1. - k);
		m_cmykComponents.push_back((long)(c*100 + 0.5));
		m_cmykComponents.push_back((long)(m*100 + 0.5));
		m_cmykComponents.push_back((long)(y*100 + 0.5));
		m_cmykComponents.push_back((long)(k*100 + 0.5));
	}
	else
	{
		size_t sz = components.size();
		if (sz != 4)
		{
			m_myErrorCode = MyErrorCodes::InputColorComptents;
			return false;
		}
		for (size_t i = 0; i < components.size(); i++)
			m_cmykComponents.push_back(components[i]);

		// Convert CMYK to RGB
		double c = ((double)components[0])/100.;
		double m = ((double)components[1])/100.;
		double y = ((double)components[2])/100.;
		double k = ((double)components[3])/100.;
		m_rgbComponents.push_back((long)((1. - c)*(1. - k)*255. +0.5));
		m_rgbComponents.push_back((long)((1. - m)*(1. - k)*255. +0.5));
		m_rgbComponents.push_back((long)((1. - y)*(1. - k)*255. +0.5));
	}
	return true;
}

void CGeoPdfColorFinder::CalcElements(PDSElement element, int& count)
{
	ASInt32 c = PDSElementGetNumKids(element);
	if (c == 0)
		return;
	count += c;
	for (ASInt32 i = 0; i < c; i++)
	{
		PDSElement kid;
		ASAtom t = PDSElementGetKid(element, i, &kid, NULL, NULL);
		CString sType(ASAtomGetString(t));
		if (sType.CompareNoCase(_T("MC")) == 0) // We need only elements corresponding to marked content in the stream
		{
			//count++;
			continue;
		}

		CalcElements(kid, count);
	}
}

bool CGeoPdfColorFinder::ParseTreeElement(PDSElement element)
{
	ASInt32 attrsNum = PDSElementGetNumAttrObjs(element);
	ASInt32 count = PDSElementGetNumKids(element);
	if (! m_canceltTracker->ShouldContinue())
		return false;
	m_curIndex++;
	int curP = (int)(((double)m_curIndex/(double)m_maxCount)*100 +0.5);
	if (curP > m_curPercentage)
	{
		m_curPercentage = curP;
		m_canceltTracker->SetProgress(curP);
	}

	if (count < 1)
		return true; // no kid, go forward
	if (count > 1)
	{
		// It's not leaf node, go in depth
		if (!ParseStructElement(element, count))
			return false;
		return true;
	}
	CosObj kid;
	PDSMC cont;
	PDSMCInfo mcInfo;
	mcInfo.size = sizeof(PDSMCInfo);
	ASAtom  typ = PDSElementGetKidWithMCInfo(element, 0, &kid, &mcInfo, (void**)&cont, NULL);
	CString sType(ASAtomGetString(typ));
	if (sType.CompareNoCase(_T("MC")) != 0) // We need only elements corresponding to marked content in the stream
		return true;

	std::string idVal;
	if (attrsNum > 0)
	{
		// There are attributes. Supposed it's feature's attribute fields
		m_lastError = GetObjId(element, idVal);
		if (m_lastError != MyErrorCodes::NoError)
			return false;
	}

	// Get the parent of the feature (layer)
	PDSElement parentElem;
	ASBool isRoot;
	PDSElementGetParent(element, &parentElem, &isRoot);

	std::string layerName;
	ASErrorCode res = GetPdsTitleAsString(parentElem, layerName);
	if (res != MyErrorCodes::NoError)
	{
		m_lastError = res;
		return false;
	}
	// Find out: is this a feature?
	long id = -1;
	if (!idVal.empty())
		sscanf_s(idVal.c_str(), "%ld", &id, sizeof(long));
	if (id < 0)
		return true; // It's not a feature

	// Find graphical elements of the feature
	PDEContainer featureCont = (PDEContainer)cont;
	PDEContent fContent = PDEContainerGetContent(featureCont);
	count = PDEContentGetNumElems(fContent);
	for (ASInt32 i = 0; i < count; i ++)
	{
		PDEElement child = PDEContentGetElem(fContent, i);
		PDEGraphicState grState;
		ASBool hasG = PDEElementHasGState(child, &grState, sizeof(PDEGraphicState));
		if (!hasG)
			continue;

		// We've got such (it's a graphical element)

		bool found = CheckColors(grState,id, layerName);
		if ((m_myErrorCode != MyErrorCodes::NoError) || (m_lastError != MyErrorCodes::NoError))
			return false;
		if (found)
			return true;
	}
	return true;
}

bool CGeoPdfColorFinder::CheckColors(PDEGraphicState grState, int id, std::string layer)
{
	// Get fill color

	bool isEqual = CheckColor(grState.fillColorSpec);
	if ((m_myErrorCode != MyErrorCodes::NoError) || (m_lastError != MyErrorCodes::NoError))
		return false;

	// Add feature ID in the results if it contains the needed color
	if (isEqual)
	{
		std::map< std::string, std::vector<int> >::iterator it = m_featuresWithColor.find(layer);
		if (it != m_featuresWithColor.end())
			it->second.push_back(id);
		else
		{
			std::vector<int> vec;
			vec.push_back(id);
			m_featuresWithColor[layer] = vec;

		}
		return true;
	}

	// Get stroke color

	isEqual = CheckColor(grState.strokeColorSpec);
	if ((m_myErrorCode != MyErrorCodes::NoError) || (m_lastError != MyErrorCodes::NoError))
		return false;
	// Add feature ID in the results if it contains the needed color
	if (isEqual)
	{
		std::map< std::string, std::vector<int> >::iterator it = m_featuresWithColor.find(layer);
		if (it != m_featuresWithColor.end())
			it->second.push_back(id);
		else
		{
			std::vector<int> vec;
			vec.push_back(id);
			m_featuresWithColor[layer] = vec;
		}
		return true;
	}
	return false;
}

bool CGeoPdfColorFinder::CheckColor(PDEColorSpec cs)
{
	ASInt32 comps;
	ASAtom cSpace;
	DURING
		comps = PDEColorSpaceGetNumComps(cs.space);
		cSpace = PDEColorSpaceGetName(cs.space);
	HANDLER
		m_lastError = ERRORCODE;
		return false;
	END_HANDLER
	std::string csName(ASAtomGetString(cSpace));
	CString csString(csName.c_str());

	// Check color space
	if ((csString.CompareNoCase(_T("DeviceCMYK")) != 0) && (csString.CompareNoCase(_T("DeviceRGB")) != 0))
	{
		m_myErrorCode = MyErrorCodes::WrongColorInFeature;
		return false;
	}

	bool isEqual = true;
	bool isRGB = true;
	if (csString.CompareNoCase(_T("DeviceCMYK")) == 0)
		isRGB = false;
	for (ASInt32 n = 0; n < comps; n++)
	{
		double v;
		long comp = m_rgbComponents[n];
		if (!isRGB)
		{
			v =  ASFixedToFloat(cs.value.color[n])*100 + 0.5;
			comp = m_cmykComponents[n];
		}
		else
			v =  ASFixedToFloat(cs.value.color[n])*255 + 0.5;
		long lv = (long)v;
		if (lv != comp)
		{
			isEqual = false;
			break;
		}
	}

	return isEqual;
}

bool CGeoPdfColorFinder::ParseStructElement(CosObj elem, ASInt32 count)
{
	if (! m_canceltTracker->ShouldContinue())
		return false;

	for (ASInt32 i = 0; i < count; i++)
	{
		CosObj kid; // Child object
		PDSMC mC; // Marked content
		PDSMCInfo mcInfo; // Marked conent info
		mcInfo.size = sizeof(PDSMCInfo);
		ASAtom  typ = PDSElementGetKidWithMCInfo(elem, i, &kid, &mcInfo, (void**)&mC, NULL);
		CString sType(ASAtomGetString(typ));
		if (sType.CompareNoCase(_T("StructElem")) != 0)
			continue;
		
		// We need only dictionary
		ASInt32 kidsNum = PDSElementGetNumKids(kid);
		if (kidsNum > 0) // Pass empty elements
		{
			if (!ParseTreeElement(kid))
				return false;
			continue;
		}
	}
	return true;
}

void CGeoPdfColorFinder::GetFoundLayers(std::vector<std::string>& layers)
{
	layers.clear();
	std::map< std::string, std::vector<int> >::iterator it = m_featuresWithColor.begin();
	for (; it != m_featuresWithColor.end(); it++)
		layers.push_back(it->first);
}

void CGeoPdfColorFinder::GetFoundFeatures4Layer(std::string& layer, std::vector<int>& features)
{
	features.clear();
	std::map< std::string, std::vector<int> >::iterator it = m_featuresWithColor.find(layer);
	if (it == m_featuresWithColor.end())
		return;
	features = it->second;
}
