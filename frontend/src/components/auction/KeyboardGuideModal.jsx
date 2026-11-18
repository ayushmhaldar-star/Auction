import React from 'react';
import Modal from '../common/Modal';
import { useSettings } from '../../context/SettingsContext';
import { Keyboard, AlertCircle } from 'lucide-react';

const KeyboardGuideModal = ({ isOpen, onClose, teams = [] }) => {
  const { formatCurrency } = useSettings();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Team Keyboard Shortcuts & Bidding Hotkeys" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">Fast Bidding Mode: </span>
            Pressing any assigned letter key while on the Auction Control screen instantly submits a valid increment bid for that team.
            Shortcuts are automatically suppressed whenever you are typing in text inputs or search bars.
          </div>
        </div>

        <div className="divide-y divide-slate-800 bg-slate-950/50 rounded-xl border border-slate-800 overflow-hidden">
          {teams.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-500">No teams registered yet.</p>
          ) : (
            teams.map((t) => (
              <div key={t._id} className="p-3 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {t.logo ? (
                      <img src={t.logo} alt={t.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-base font-bold text-slate-400">{t.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">{t.name}</h5>
                    <p className="text-xs text-slate-400">
                      Balance: <span className="text-emerald-400 font-mono font-medium">{formatCurrency(t.remainingBalance)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 uppercase font-medium">Hotkey:</span>
                  <kbd className="px-3 py-1.5 rounded-lg bg-slate-800 border-2 border-amber-500/50 text-amber-300 font-mono font-extrabold text-base shadow-md shadow-amber-500/10">
                    {t.shortcutKey}
                  </kbd>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 text-center text-xs text-slate-500">
          Keys can be changed anytime from the <span className="text-slate-300 font-medium">Team Management</span> or <span className="text-slate-300 font-medium">Settings</span> menu.
        </div>
      </div>
    </Modal>
  );
};

export default KeyboardGuideModal;
