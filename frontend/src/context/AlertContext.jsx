import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X, Check } from 'lucide-react';

const AlertContext = createContext(null);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Function for non-React files to trigger alerts
export const globalAlert = (message, title = 'Notifikasi', type = 'info') => {
  window.dispatchEvent(new CustomEvent('global-alert', { 
    detail: { message, title, type } 
  }));
};

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    title: '',
    type: 'info', // 'info', 'success', 'error'
  });

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    title: '',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = useCallback((message, title = 'Notifikasi', type = 'info') => {
    // Basic heuristic to determine type if not provided
    let alertType = type;
    if (type === 'info') {
      const lowerMsg = message?.toLowerCase() || '';
      if (lowerMsg.includes('gagal') || lowerMsg.includes('wajib') || lowerMsg.includes('tidak valid')) {
        alertType = 'error';
      } else if (lowerMsg.includes('berhasil')) {
        alertType = 'success';
      }
    }
    
    setAlertState({ isOpen: true, message, title, type: alertType });
  }, []);

  const showConfirm = useCallback((message, title = 'Konfirmasi', onConfirm, onCancel = null) => {
    setConfirmState({ isOpen: true, message, title, onConfirm, onCancel });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirmAction = useCallback((action) => {
    if (action === 'confirm' && confirmState.onConfirm) confirmState.onConfirm();
    if (action === 'cancel' && confirmState.onCancel) confirmState.onCancel();
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, [confirmState]);

  // Listen to global events
  useEffect(() => {
    const handleGlobalAlert = (e) => {
      showAlert(e.detail.message, e.detail.title, e.detail.type);
    };
    window.addEventListener('global-alert', handleGlobalAlert);
    return () => window.removeEventListener('global-alert', handleGlobalAlert);
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Alert Modal */}
      {alertState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100 p-5 md:p-6" style={{ border: '1px solid #EDE0CC' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                alertState.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
                alertState.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' :
                'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {alertState.type === 'error' ? <AlertCircle size={20} /> :
                 alertState.type === 'success' ? <CheckCircle size={20} /> :
                 <Info size={20} />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-black text-lg truncate ${
                  alertState.type === 'error' ? 'text-red-600' :
                  alertState.type === 'success' ? 'text-green-600' :
                  'bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b]'
                }`}>
                  {alertState.title}
                </h3>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl border shadow-inner max-h-[40vh] overflow-y-auto ${
              alertState.type === 'error' ? 'bg-red-50 border-red-100' :
              alertState.type === 'success' ? 'bg-green-50 border-green-100' :
              'bg-[#FFFBEB] border-[#FFE4A0]'
            }`}>
              <p className={`text-sm whitespace-pre-wrap leading-relaxed font-medium ${
                alertState.type === 'error' ? 'text-red-800' :
                alertState.type === 'success' ? 'text-green-800' :
                'text-[#634930]'
              }`}>
                {alertState.message}
              </p>
            </div>
            
            <button 
              onClick={closeAlert}
              className={`mt-5 w-full py-2.5 rounded-xl text-white text-sm font-black transition-all hover:opacity-90 active:scale-95 shadow-lg ${
                alertState.type === 'error' ? 'bg-red-600 shadow-red-600/30' :
                alertState.type === 'success' ? 'bg-green-600 shadow-green-600/30' :
                'bg-[#634930] shadow-[#634930]/30'
              }`}
            >
              TUTUP
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all scale-100 p-5 md:p-6" style={{ border: '1px solid #EDE0CC' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-[#634930] to-[#b8860b] truncate">
                  {confirmState.title}
                </h3>
              </div>
            </div>
            
            <div className="p-2 mb-2">
              <p className="text-[#634930] text-sm font-medium">
                {confirmState.message}
              </p>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => handleConfirmAction('cancel')}
                className="flex-1 py-2.5 rounded-xl text-gray-600 text-sm font-bold transition-all hover:bg-gray-100 active:scale-95 border border-gray-200"
              >
                BATAL
              </button>
              <button 
                onClick={() => handleConfirmAction('confirm')}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-black transition-all hover:opacity-90 active:scale-95 shadow-lg flex items-center justify-center gap-1.5 bg-[#634930]"
              >
                <Check size={16} /> YA, LANJUTKAN
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
