import React from 'react';
import { ShieldCheck, Image as ImageIcon, Trash2, HelpCircle, Activity, Cpu } from 'lucide-react';

interface HeaderProps {
  itemCount: number;
  onClearAll: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({ itemCount, onClearAll, onOpenHelp }) => {
  return (
    <header className="border-b border-slate-200/90 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Image Size Target Optimizer
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                LOCAL ENGINE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block leading-none mt-0.5">
              指定ファイルサイズ（KB / MB）に合わせて高画質・解像度を自動探索圧縮
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
            <Activity className="w-3 h-3 text-indigo-600" />
            <span>ALGO: BINARY-SEARCH</span>
          </div>

          <button
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            title="使い方と仕様"
            id="btn-open-help"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">ヘルプ</span>
          </button>

          {itemCount > 0 && (
            <button
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
              id="btn-clear-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>クリア ({itemCount})</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

