import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, X, ShieldAlert } from 'lucide-react';

interface PasswordAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Password strictly validated against 2027 without exposing hints in UI
    if (password === '2027') {
      setPassword('');
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setIsShaking(true);
      setPassword('');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Acceso Restringido</h3>
            <p className="text-xs text-slate-400 mt-1">
              Introduce la clave de seguridad para desbloquear el panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 pt-1">
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="••••"
                className={`w-full bg-slate-950 text-white placeholder-slate-600 px-4 py-3.5 rounded-2xl text-center text-2xl tracking-[0.4em] font-mono border focus:outline-none focus:ring-2 ${
                  error
                    ? 'border-rose-500 focus:ring-rose-500/30'
                    : 'border-slate-700 focus:ring-cyan-500/30 focus:border-cyan-500'
                }`}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-mono">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Contraseña incorrecta</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Desbloquear</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
