#pragma once

#include <string>
#include <vector>
#include <set>
#include <map>
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
#include "GeoPdfParserUtilities.h"

struct FeatureOrDecor
{
	bool m_isInt;
	int m_Feature;
	std::string m_Decor;
};

typedef struct FeatureOrDecor SFeatureOrDecore;

class CGeoPdfColorFinder
{
public:
	CGeoPdfColorFinder(void);
	~CGeoPdfColorFinder(void);

	bool IsLibraryInit(){return m_isInit;}
	bool IsPdfOpen(){return m_isOpen;}
	void ClearError(){m_lastError = 0;}
	bool WasError(){return ((m_lastError != MyErrorCodes::NoError) &&(m_myErrorCode != MyErrorCodes::NoError));}
	void SetCancelTracker(ICancel* pCT){m_canceltTracker = pCT;}
	void GetErrorMessage(std::string& mess);
	bool OpenPdf(const char* path);
	bool FindFeatures4Color(ColorType colorType, std::vector<long> components);
	void ClosePdfFile()
	{
		if (m_isOpen)
		{
			PDDocClose(m_Doc);
			m_isOpen = false;
		}
	}
	void GetFoundLayers(std::vector<std::string>& layers);
	void GetFoundFeatures4Layer(std::string& layer, std::vector<SFeatureOrDecore>& features);
private:
	bool ParseTreeElement(PDSElement element);
	bool SetColors(ColorType colorType, std::vector<long> components);
	bool CheckColors(PDEGraphicState grState, int id, std::string layer, bool checkStroke, bool checkFill);
	bool CheckColor(PDEColorSpec cs);
	bool ParseStructElement(CosObj elem, ASInt32 count);
	int CalcMaxElement();
	void CalcElements(PDSElement element, int& count);
	bool ParseStream();
	bool ParseStreamElement(PDEElement elem);
	void PaseStreamDestination(std::string& name, std::string& parent, PDEElement elem);
protected:
	std::map< std::string, std::vector<SFeatureOrDecore> > m_featuresWithColor;
	std::map <std::string, std::string> m_missedNodes;
	bool m_isInit;
	bool m_isOpen;
	bool m_hasLabels;
	PDDoc m_Doc;
	ASErrorCode m_lastError;
	int m_myErrorCode;
	int m_maxCount;
	int m_curIndex;
	int m_curPercentage;
	ICancel* m_canceltTracker;
	std::vector<long> m_rgbComponents;
	std::vector<long> m_cmykComponents;
	std::vector<long> m_rgbBackgroundComponents;
	std::vector<long> m_cmykBackgroundComponents;
};

