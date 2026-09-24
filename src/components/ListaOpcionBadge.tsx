import React from 'react';

interface ListaOpcionBadgeProps {
  listNumber?: string;
  optionNumber?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ListaOpcionBadge: React.FC<ListaOpcionBadgeProps> = ({
  listNumber = '1',
  optionNumber = '7',
  size = 'md',
  className = '',
}) => {
  // Size variations for 2 distinct square cards
  const sizeClasses = {
    sm: {
      gap: 'gap-1.5',
      box: 'w-12 sm:w-14 h-12 sm:h-14 rounded-xl p-1',
      label: 'text-[8px] sm:text-[9px] tracking-wider font-extrabold',
      number: 'text-xl sm:text-2xl font-black leading-none',
    },
    md: {
      gap: 'gap-1.5 sm:gap-2',
      box: 'w-16 sm:w-18 h-16 sm:h-18 rounded-xl p-1.5 sm:p-2',
      label: 'text-[9px] sm:text-[10px] tracking-wider font-black',
      number: 'text-2xl sm:text-3xl font-black leading-none',
    },
    lg: {
      gap: 'gap-2 sm:gap-3',
      box: 'w-24 sm:w-28 h-24 sm:h-28 rounded-2xl p-2.5 sm:p-3',
      label: 'text-xs sm:text-sm tracking-widest font-black',
      number: 'text-4xl sm:text-5xl font-black leading-none',
    },
  }[size];

  return (
    <div
      className={`inline-flex items-center select-none font-sans drop-shadow-2xl ${sizeClasses.gap} ${className}`}
    >
      {/* LEFT SQUARE CARD: LISTA (WHITE CARD WITH RED NUMBER) */}
      <div
        className={`bg-gradient-to-b from-white via-slate-50 to-slate-200 text-slate-900 border-2 border-slate-300/90 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group transition-transform hover:scale-105 ${sizeClasses.box}`}
      >
        <span className={`text-amber-500 uppercase font-bold text-center w-full drop-shadow-sm ${sizeClasses.label}`}>
          LISTA
        </span>
        <span className={`text-red-600 font-black tracking-tighter my-auto drop-shadow-md ${sizeClasses.number}`}>
          {listNumber}
        </span>
      </div>

      {/* RIGHT SQUARE CARD: OPCIÓN (GREEN CARD WITH WHITE NUMBER) */}
      {optionNumber ? (
        <div
          className={`bg-gradient-to-b from-emerald-600 to-emerald-700 border-2 border-emerald-400 text-white flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group transition-transform hover:scale-105 ${sizeClasses.box}`}
        >
          <span className={`text-amber-300 uppercase font-bold text-center w-full drop-shadow-sm ${sizeClasses.label}`}>
            OPCIÓN
          </span>
          <span className={`text-white font-black tracking-tighter my-auto drop-shadow-md ${sizeClasses.number}`}>
            {optionNumber}
          </span>
        </div>
      ) : null}
    </div>
  );
};
