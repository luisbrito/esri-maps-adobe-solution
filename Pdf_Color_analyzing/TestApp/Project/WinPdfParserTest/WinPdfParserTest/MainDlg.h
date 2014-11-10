// MainDlg.h : interface of the CMainDlg class
//
/////////////////////////////////////////////////////////////////////////////

#pragma once

#include "GeoPdfColorFinder.h"
#include "ColorButton.h"
class CCancel : public ICancel
{
public:
	CCancel()
	{
		m_isCanceled = false;
	}
	virtual bool ShouldContinue(){return (!m_isCanceled);}
	virtual void SetProgress(int progr)
	{
		LPARAM lP = progr;
		PostMessage(m_hwndDlg,WM_USER+1, 0, lP);
	}
	void SetCanceled(){m_isCanceled = true;}
	void SetHwnd(HWND hwndDlg){m_hwndDlg = hwndDlg;}
	HWND m_hwndDlg;
private:
	bool m_isCanceled;
};

struct MY_THREAD_PARAMS
{
	ColorType m_colorType;
	SymbolParts m_symbolParts;
	std::vector<long> m_colorComponents;
	std::string m_path;
	std::string m_mess;
	CCancel* m_pCancel;
	std::map< std::string, std::vector<SFeatureOrDecore> > m_results;
};

typedef struct MY_THREAD_PARAMS SMyThreadParams;

DWORD WINAPI MyThreadFunction( LPVOID lpParam )
{
	CGeoPdfColorFinder finder;
	SMyThreadParams* pParams= (SMyThreadParams*)lpParam;
	if (pParams == NULL)
		return 1;
	if (!finder.IsLibraryInit())
	{
		PostMessage(pParams->m_pCancel->m_hwndDlg, WM_USER+2, 0, 0);
		pParams->m_mess = "Could not init library";
		//finder.GetErrorMessage(pParams->m_mess);
		return 2;
	}
	if (!finder.OpenPdf(pParams->m_path.c_str()))
	{
		PostMessage(pParams->m_pCancel->m_hwndDlg, WM_USER+2, 0, 0);
		finder.GetErrorMessage(pParams->m_mess);
		return 2;
	}
	finder.SetCancelTracker(pParams->m_pCancel);
	if (finder.FindFeatures4Color(pParams->m_colorType, pParams->m_colorComponents, pParams->m_symbolParts))
	{
		pParams->m_results.clear();
		std::vector<std::string> lays;
		finder.GetFoundLayers(lays);
		for (size_t i = 0; i < lays.size(); i++)
		{
			std::vector<SFeatureOrDecore> feats;
			finder.GetFoundFeatures4Layer(lays[i], feats);
			pParams->m_results[lays[i]] = feats;
		}
	}

	PostMessage(pParams->m_pCancel->m_hwndDlg, WM_USER+2, 0, 0);

	return 0;
}

class CMyProgressDialog : public CDialogImpl<CMyProgressDialog>
{
public:
	enum { IDD = IDD_PROGRESS_DLG };
	BEGIN_MSG_MAP(CMyProgressDialog)
		MESSAGE_HANDLER(WM_INITDIALOG, OnInitDialog)
		MESSAGE_HANDLER(WM_USER+1, OnChangeProgress)
		MESSAGE_HANDLER(WM_USER+2, OnFinish)
		COMMAND_ID_HANDLER(IDCANCEL, OnCancel)
	END_MSG_MAP()

	LRESULT OnFinish(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM lParam, BOOL& /*bHandled*/)
	{
		WaitForSingleObject(m_hThread, INFINITE);
		CloseHandle(m_hThread);
		EndDialog(2);
		return 0;
	}

	LRESULT OnInitDialog(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM /*lParam*/, BOOL& /*bHandled*/)
	{
		HWND hwndProgress = GetDlgItem(IDC_PARSING_PROGR);
		m_ctrlProgress.Attach(hwndProgress);
		HWND hwndStat = GetDlgItem(IDC_MY_STAT);
		m_static.Attach(hwndStat);

		m_hasCalculated = false;
		m_Cancel.m_hwndDlg = this->m_hWnd;
		m_pParams->m_pCancel = &m_Cancel;
		m_ctrlProgress.SetPos(0);
		m_hThread = CreateThread(NULL,0, MyThreadFunction, m_pParams, 0, &m_dwID);
		if (m_hThread == NULL)
			PostMessage(WM_USER + 2, 0, 0);
		return TRUE;
	}
	LRESULT OnCancel(WORD /*wNotifyCode*/, WORD wID, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{
		m_Cancel.SetCanceled();
		m_static.SetWindowTextW(_T("Please wait. Parsing is finishing"));
//		EndDialog(wID);
		return 0;
	}
	LRESULT OnChangeProgress(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM lParam, BOOL& /*bHandled*/)
	{
		if (!m_hasCalculated)
		{
			m_static.SetWindowTextW(_T(""));
			m_hasCalculated = true;
		}
		int progr = lParam;
		m_ctrlProgress.SetPos(progr);
		return TRUE;
	}
	CProgressBarCtrl m_ctrlProgress;
	CStatic m_static;
	SMyThreadParams* m_pParams;
	CCancel m_Cancel;
	HANDLE m_hThread;
	DWORD m_dwID;
	bool m_hasCalculated;
};

class CMainDlg : public CDialogImpl<CMainDlg>
{
public:
	enum { IDD = IDD_MAINDLG };

	BEGIN_MSG_MAP(CMainDlg)
		MESSAGE_HANDLER(WM_INITDIALOG, OnInitDialog)
		COMMAND_HANDLER(IDC_LAYERS_CMB,CBN_SELCHANGE,OnBoxSelChange)
		COMMAND_ID_HANDLER(IDC_MYCOLOR_BTN, OnColorBtn)
		COMMAND_ID_HANDLER(IDC_IN_FILE_BTN, OnBrowse)
		COMMAND_ID_HANDLER(IDC_START_BTN, OnStart)
		COMMAND_ID_HANDLER(IDCANCEL, OnCancel)
		COMMAND_ID_HANDLER(IDC_SAVE_BTN, OnSave)
	END_MSG_MAP()

// Handler prototypes (uncomment arguments if needed):
//	LRESULT MessageHandler(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM /*lParam*/, BOOL& /*bHandled*/)
//	LRESULT CommandHandler(WORD /*wNotifyCode*/, WORD /*wID*/, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
//	LRESULT NotifyHandler(int /*idCtrl*/, LPNMHDR /*pnmh*/, BOOL& /*bHandled*/)


	LRESULT OnBoxSelChange(WORD wNotifyCode, WORD wID, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{
		int sel = m_comboLayers.GetCurSel();
		m_lbFeatures.ResetContent();
		CString cType;
		m_comboLayers.GetLBText(sel, cType);
		char *buff;
		int len = cType.GetLength();
		buff = new char[len + 1];
		wcstombs(buff, cType, len);
		buff[len] = 0;
		std::string ss(buff);
		delete[] buff;
/*		CString str(ss.c_str());
		if (str.CompareNoCase(_T("Labels")) == 0)
		{
			std::set<std::string>::iterator iter = m_labs.begin();
			for(; iter != m_labs.end(); iter++)
			{
				CString sLab((*iter).c_str());
				m_lbFeatures.AddString(sLab);
			}
			return 0;
		}*/
		std::map< std::string, std::vector<SFeatureOrDecore> >::iterator it = m_ress.find(ss);
		if (it == m_ress.end())
			return 0;
		for (size_t i = 0; i < it->second.size(); i++)
		{
			CString sss;
			if (it->second[i].m_isInt)
				sss.Format(_T("%ld"), it->second[i].m_Feature);
			else
			{
				CString sDecor(it->second[i].m_Decor.c_str());
				sss = sDecor;
			}
			m_lbFeatures.AddString(sss);
		}
		return 0;
	}

	LRESULT OnInitDialog(UINT /*uMsg*/, WPARAM /*wParam*/, LPARAM /*lParam*/, BOOL& /*bHandled*/)
	{
		// center the dialog on the screen
		CenterWindow();

		// set icons
		HICON hIcon = AtlLoadIconImage(IDI_ICON1, LR_DEFAULTCOLOR, ::GetSystemMetrics(SM_CXICON), ::GetSystemMetrics(SM_CYICON));
		SetIcon(hIcon, TRUE);
		HICON hIconSmall = AtlLoadIconImage(IDI_ICON1, LR_DEFAULTCOLOR, ::GetSystemMetrics(SM_CXSMICON), ::GetSystemMetrics(SM_CYSMICON));
		SetIcon(hIconSmall, FALSE);

		HWND hwndColorType = GetDlgItem(IDC_CLOLOR_TYPE_CMB);
		HWND hwndInfIle = GetDlgItem(IDC_IN_PATH_EDT);
		HWND hwndComponents = GetDlgItem(IDC_COLOR_CIMPONENTS_EDT);
		HWND hwndLayers = GetDlgItem(IDC_LAYERS_CMB);
		HWND hwndFeatures = GetDlgItem(IDC_LIST1);
		HWND hwndSave = GetDlgItem(IDC_SAVE_BTN);
		HWND hwndSymbolParts = GetDlgItem(IDC_SYMBOL_PART_CMB);

		m_comboColorType.Attach(hwndColorType);
		m_editInFile.Attach(hwndInfIle);
		m_editComponents.Attach(hwndComponents);
		m_comboLayers.Attach(hwndLayers);
		m_lbFeatures.Attach(hwndFeatures);
		m_buttonSave.Attach(hwndSave);
		m_comboSymbolParts.Attach(hwndSymbolParts);

		m_comboColorType.AddString(_T("RGB"));
		m_comboColorType.AddString(_T("CMYK"));
		m_comboColorType.SetCurSel(0);

		m_comboSymbolParts.AddString(_T("ALL_PARTS"));
		m_comboSymbolParts.AddString(_T("OUTLINE_ONLY"));
		m_comboSymbolParts.AddString(_T("FILL_ONLY"));
		m_comboSymbolParts.AddString(_T("TEXT_ONLY"));
		m_comboSymbolParts.SetCurSel(0);

		return TRUE;
	}

	LRESULT OnBrowse(WORD /*wNotifyCode*/, WORD wID, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{
		CFileDialog dlg(TRUE, NULL, NULL, OFN_HIDEREADONLY | OFN_OVERWRITEPROMPT,_T("PDF files\0*.pdf\0\0"),this->m_hWnd);
		int res = dlg.DoModal();
		if (res == IDOK)
		{
			m_editInFile.SetWindowText(dlg.m_szFileName);
		}
		return 0;
	}

	LRESULT OnSave(WORD /*wNotifyCode*/, WORD wID, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{
		if (m_ress.size() == 0)
		{
			MessageBox(_T("There is nothing to save"), _T("Saving results"), MB_OK);
			return 0;
		}
		CFileDialog dlg(FALSE);
		int res = dlg.DoModal();
		if (res != IDOK)
		{
			return 0;
			//m_editInFile.SetWindowText(dlg.m_szFileName);
		}
		FILE *fileOut;
		_tfopen_s(&fileOut, dlg.m_szFileName, _T("wt"));
		if (fileOut == NULL)
		{
			MessageBox(_T("Could not create putput fale"), _T("Saving results"), MB_OK);
			return 0;
		}
		std::map< std::string, std::vector<SFeatureOrDecore> >::iterator it = m_ress.begin();
		for (; it != m_ress.end(); it++)
		{
			fprintf(fileOut, "Layer %s:\n", it->first.c_str());
			for (size_t i = 0; i < it->second.size(); i++)
			{
				if (i != 0)
					fprintf(fileOut, ", ");
				if (it->second[i].m_isInt)
					fprintf(fileOut, "%ld", it->second[i].m_Feature);
				else
					fprintf(fileOut, "%s", it->second[i].m_Decor.c_str());
			}
			fprintf(fileOut, "\n----------------------------------------------------\n");
		}
		fclose(fileOut);
		return 0;
	}

	LRESULT OnStart(WORD /*wNotifyCode*/, WORD wID, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{

		int len = m_editComponents.GetWindowTextLength();
		if (len == 0)
		{
			MessageBox(_T("Color components were not set"), _T("Start search"), MB_OK | MB_ICONERROR);
			return 0;
		}
		CString strComponents;
		m_editComponents.GetWindowText(strComponents.GetBufferSetLength(len + 1), len + 1);
		int sel = m_comboColorType.GetCurSel();
		CString cType;
		m_comboColorType.GetLBText(sel, cType);

		ColorType colorSpace = ColorType::rgb;
		SymbolParts symbolParts = SymbolParts::AllParts;

		CString sParts;
		sel = m_comboSymbolParts.GetCurSel();
		m_comboSymbolParts.GetLBText(sel, sParts);

		if (cType.CompareNoCase(_T("CMYK")) == 0)
			colorSpace = ColorType::cmyk;

		int pos = strComponents.Find(_T(","));
		if (pos < 0)
		{
			MessageBox(_T("Wrong value of color components"), _T("Start search"), MB_OK | MB_ICONERROR);
			return 0;
		}

		int ac = 0;
		std::vector<long> comps;
		int upperLimit = 255;
		if (colorSpace == ColorType::cmyk)
			upperLimit = 100;
		while (pos >= 0)
		{
			int l = pos - ac;
			CString s = strComponents.Mid(ac, l);
			s.TrimLeft();
			s.TrimRight();
			long val = -1;
			_stscanf_s(s, _T("%ld"), &val, sizeof(int));
			if ((val < 0) || (val > upperLimit))
			{
				MessageBox(_T("Wrong value of color components"), _T("Start search"), MB_OK | MB_ICONERROR);
				return 0;
			}
			comps.push_back(val);
			ac = pos + 1;
			if (ac >= len)
				break;
			pos = strComponents.Find(_T(","), ac);
		}
		int count = len - ac;
		CString s = strComponents.Mid(ac, count);
		long v = -1;
		_stscanf_s(s, _T("%ld"), &v, sizeof(int));
		if ((v < 0) || (v > upperLimit))
		{
			MessageBox(_T("Wrong value of color components"), _T("Start search"), MB_OK | MB_ICONERROR);
			return 0;
		}
		comps.push_back(v);

		if (((colorSpace == ColorType::cmyk) && (comps.size() != 4)) || ((colorSpace == ColorType::rgb) && (comps.size() != 3)))
		{
			MessageBox(_T("Wrong value of color components"), _T("Start search"), MB_OK | MB_ICONERROR);
			return 0;
		}

		len = m_editInFile.GetWindowTextLength();
		if (len == 0)
		{
			MessageBox(_T("Color components were not set"), _T("Start search"), MB_OK | MB_ICONERROR);
			return 0;
		}
		CString strInFile;
		m_editInFile.GetWindowText(strInFile.GetBufferSetLength(len + 1), len + 1);
		char *buff;
		buff = new char[len + 1];
		wcstombs(buff, strInFile, len);
		buff[len] = 0;
		std::string ss(buff);
		delete[] buff;

		if (sParts.CompareNoCase(_T("OUTLINE_ONLY")) == 0)
			symbolParts = SymbolParts::OutlineOnly;
		else if (sParts.CompareNoCase(_T("FILL_ONLY")) == 0)
			symbolParts = SymbolParts::FillOnly;
		else if (sParts.CompareNoCase(_T("TEXT_ONLY")) == 0)
			symbolParts = SymbolParts::TextOnly;

		m_ress.clear();
		SMyThreadParams sParams;
		sParams.m_colorType = colorSpace;
		sParams.m_colorComponents = comps;
		sParams.m_path = ss;
		sParams.m_symbolParts = symbolParts;
		CMyProgressDialog startDlg;
		startDlg.m_pParams = &sParams;

		m_buttonSave.EnableWindow(FALSE);
		m_comboLayers.ResetContent();
		m_lbFeatures.ResetContent();
		startDlg.DoModal();
		m_ress = sParams.m_results;
		std::map< std::string, std::vector<SFeatureOrDecore> >::iterator it = m_ress.begin();
		bool isEmpty = true;
		if (it != m_ress.end())
			isEmpty = false;
		for (; it != m_ress.end(); it++)
		{
			CString inStr(it->first.c_str());
			m_comboLayers.AddString(inStr);
			if ((it->second.size() > 0) && (it == m_ress.begin()))
			{
				m_comboLayers.SetCurSel(0);
				for (size_t i = 0; i < it->second.size(); i++)
				{
					CString sss;
					if (it->second[i].m_isInt)
						sss.Format(_T("%ld"), it->second[i].m_Feature);
					else
					{
						CString sDecor(it->second[i].m_Decor.c_str());
						sss = sDecor;
					}
					m_lbFeatures.AddString(sss);
				}
			}
		}
		if (m_ress.size() != 0)
			m_buttonSave.EnableWindow(TRUE);
		/*if (!m_labs.empty())
		{
			CString labStr(_T("Labels"));
			m_comboLayers.AddString(labStr);
			if (isEmpty)
			{
				m_comboLayers.SetCurSel(0);
				std::set<std::string>::iterator iter = m_labs.begin();
				for(; iter != m_labs.end(); iter++)
				{
					CString sLab((*iter).c_str());
					m_lbFeatures.AddString(sLab);
				}
			}
		}*/
		return 0;
	}

	LRESULT OnCancel(WORD /*wNotifyCode*/, WORD wID, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{
		EndDialog(wID);
		return 0;
	}

	LRESULT OnColorBtn(WORD /*wNotifyCode*/, WORD wID, HWND /*hWndCtl*/, BOOL& /*bHandled*/)
	{
		CColorDialog dlg;
		dlg.DoModal();

		COLORREF ref = dlg.GetColor();
		int rr = GetRValue(ref);
		int bb = GetBValue(ref);
		int gg = GetGValue(ref);

		int sel = m_comboColorType.GetCurSel();
		CString cType;
		m_comboColorType.GetLBText(sel, cType);

		CString cText;
		if (cType.CompareNoCase(_T("CMYK")) == 0)
		{
			double r = ((double)rr)/255.;
			double g = ((double)gg)/255.;
			double b = ((double)bb)/255.;
			double k = r;
			if (k < g)
				k = g;
			if (k < b)
				k = b;
			k = 1. - k;
			double c = (1. - r - k)/(1. - k);
			double m = (1. - g - k)/(1. - k);
			double y = (1. - b - k)/(1. - k);
			long cc = (long)(c*100 + 0.5);
			long mm = (long)(m*100 + 0.5);
			long yy = (long)(y*100 + 0.5);
			long kk = (long)(k*100 + 0.5);
			cText.Format(_T("%ld,%ld,%ld, %ld"), cc,mm,yy,kk);
		}
		else
			cText.Format(_T("%ld,%ld,%ld"), rr,gg,bb);
		m_editComponents.SetWindowText(cText);
		return 0;
	}
	CEdit m_editInFile;
	CEdit m_editComponents;
	CComboBox m_comboColorType;
	CComboBox m_comboSymbolParts;
	CComboBox m_comboLayers;
	CListBox m_lbFeatures;
	CButton m_buttonSave;
	std::map< std::string, std::vector<SFeatureOrDecore> > m_ress;
	std::set<std::string> m_labs;
};
