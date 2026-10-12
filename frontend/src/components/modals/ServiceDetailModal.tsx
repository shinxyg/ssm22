import React, { useState, useEffect } from 'react';
import type { ServiceItem, ApplicationRecord } from '../../types';
import { X, CheckCircle2, Upload, FileText, Send, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onAddApplication: (app: ApplicationRecord) => void;
  onProceedToForm?: (serviceTitle: string) => void;
  darkMode?: boolean;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onAddApplication,
  onProceedToForm,
  darkMode = true,
}) => {
  const { language } = useLanguage();
  const isTagalog = language === 'Tagalog';

  const [tab, setTab] = useState<'info' | 'apply'>('info');
  const [fullName, setFullName] = useState<string>('');
  const [contactNo, setContactNo] = useState<string>('');
  const [barangay, setBarangay] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  useEffect(() => {
    if (service) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [service]);

  if (!service) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      setUploadedFiles((prev) => [...prev, fileName]);
    }
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const newRefNo = `AICS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: ApplicationRecord = {
      referenceNo: newRefNo,
      serviceName: service.title,
      category: service.category.toUpperCase(),
      dateSubmitted: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
      status: 'Under Review',
      amountOrType: service.benefitAmount || 'Financial Grant',
      assignedSocialWorker: 'Social Worker Maria Santos, RSW',
    };

    onAddApplication(newApp);
    setSubmittedRef(newRefNo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        darkMode ? 'bg-[#0e172a] border-slate-700' : 'bg-white border-slate-300'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${
          darkMode ? 'bg-[#111d38] border-slate-700/80' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400' : 'bg-blue-100 border border-blue-300 text-blue-600'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{service.title}</h3>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isTagalog ? 'Oras ng Pagsusuri: 2 - 3 Araw ng Trabaho' : `Processing Time: ${service.processingTime}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        {!submittedRef && (
          <div className={`flex border-b ${
            darkMode ? 'border-slate-800 bg-[#0d162a]' : 'border-slate-200 bg-slate-50'
          }`}>
            <button
              type="button"
              onClick={() => setTab('info')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                tab === 'info'
                  ? darkMode ? 'border-blue-500 text-blue-400 bg-blue-950/20' : 'border-blue-600 text-blue-600 bg-blue-50'
                  : darkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {isTagalog ? '1. Mga Gabay at Kailangan' : '1. Guidelines & Requirements'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onProceedToForm) {
                  onClose();
                  onProceedToForm(service.title);
                } else {
                  setTab('apply');
                }
              }}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
                tab === 'apply'
                  ? darkMode ? 'border-blue-500 text-blue-400 bg-blue-950/20' : 'border-blue-600 text-blue-600 bg-blue-50'
                  : darkMode ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {isTagalog ? '2. Online Porma ng Aplikasyon' : '2. Online Application Form'}
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {submittedRef ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className={`text-lg font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {isTagalog ? 'Matagumpay na Naitala ang Aplikasyon!' : 'Application Successfully Submitted!'}
                </h4>
                <p className={`text-xs mt-1 max-w-md mx-auto ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isTagalog ? 'Ang iyong aplikasyon para sa ' : 'Your application for '}
                  <strong className="text-blue-500">{service.title}</strong>
                  {isTagalog ? ' ay naipadala na sa Tanggapan ng Serbisyong Panlipunan.' : ' has been transmitted to City Social Welfare and Development Office.'}
                </p>
              </div>

              <div className={`p-4 border rounded-xl max-w-sm mx-auto font-mono ${
                darkMode ? 'bg-slate-900 border-slate-700/80' : 'bg-slate-50 border-slate-300'
              }`}>
                <span className={`text-[10px] block uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isTagalog ? 'Numero ng Sanggunian' : 'Reference Control Number'}
                </span>
                <span className="text-lg font-bold text-amber-500">{submittedRef}</span>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/40"
              >
                {isTagalog ? 'Isara at Subaybayan ang Aplikasyon' : 'Close & Track Application'}
              </button>
            </div>
          ) : tab === 'info' ? (
            <div className="space-y-4">
              <div className={`p-4 border rounded-xl ${
                darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {isTagalog ? 'PANGUNAHING PAGSURI' : 'PROGRAM OVERVIEW'}
                </h5>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {service.description}
                </p>
                {service.benefitAmount && (
                  <div className="mt-3 text-xs font-semibold text-amber-500 flex items-center gap-2">
                    <span>{isTagalog ? 'Tantyang Tulong:' : 'Est. Benefit Grant:'}</span>
                    <span className="bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                      {service.benefitAmount}
                    </span>
                  </div>
                )}
              </div>

              {/* Mandatory Checklist */}
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {isTagalog ? 'MGA KAILANGANG TSEKLIST NG DOKUMENTO' : 'MANDATORY REQUIREMENTS CHECKLIST'}
                </h5>
                <div className="space-y-2">
                  {service.requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className={`p-3 border rounded-xl flex items-center gap-3 text-xs ${
                        darkMode ? 'bg-slate-900/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>
                        {isTagalog
                          ? req === 'Certificate of Indigency from Barangay'
                            ? 'Barangay Certificate of Indigency'
                            : req === 'Valid Government Photo ID (PhilSys / Comelec)'
                            ? 'Valid na ID mula sa Pamahalaan (PhilSys / QC ID / Comelec)'
                            : req === 'Supporting Documents'
                            ? 'Mga Karagdagang Dokumento'
                            : req
                          : req}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    if (onProceedToForm) {
                      onClose();
                      onProceedToForm(service.title);
                    } else {
                      setTab('apply');
                    }
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md border border-blue-400/40 flex items-center gap-2"
                >
                  <span>{isTagalog ? 'Magpatuloy sa Porma ng Aplikasyon' : 'Proceed to Application Form'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-4">
              <div className={`p-3 border rounded-xl flex items-center gap-2 text-xs ${
                darkMode ? 'bg-blue-950/40 border-blue-800/40 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Verified Citizen details pulled automatically from PhilSys Data System.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Full Citizen Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Mobile Contact No.</label>
                  <input
                    type="text"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    required
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Barangay & District Address</label>
                <input
                  type="text"
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  required
                  className={`w-full px-3 py-2 border rounded-xl text-xs ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Upload Document Section */}
              <div className="space-y-2">
                <label className={`text-[11px] font-bold block ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Upload Scanned Requirements (IDs, Certificate of Indigency, Medical Abstract)
                </label>
                <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  darkMode 
                    ? 'border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900' 
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-slate-100'
                }`}>
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Click to select files to upload</span>
                  <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Supports JPG, PNG, PDF (Max 10MB)</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Attached Files:</span>
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className={`p-2 border rounded-lg text-xs flex items-center justify-between ${
                        darkMode ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-600'
                      }`}>
                        <span className="truncate">{file}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setTab('info')}
                  className={`px-4 py-2 font-semibold text-xs rounded-xl border ${
                    darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Back to Info
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 border border-blue-400/40 flex items-center gap-1.5"
                >
                  <span>Submit Digital Application</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
