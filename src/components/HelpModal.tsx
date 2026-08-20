import React, { useEffect } from 'react';
import { X, CheckCircle, Target, Sparkles, Shield, Cpu, Image as ImageIcon, Binary } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className="bg-white border border-slate-200 w-full max-w-2xl max-h-[85vh] rounded-xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="modal-help"
      >
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold font-mono text-slate-900 uppercase tracking-wide">
              OPTIMIZATION ENGINE SPECIFICATION & GUIDE
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            id="btn-close-help"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600">
          {/* Section 1 */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Binary className="w-3.5 h-3.5 text-indigo-600" />
              二分探索（バイナリサーチ）アルゴリズム
            </h4>
            <p className="leading-relaxed text-[11px] text-slate-600">
              設定された目標上限ファイルサイズ（例: 200KB）を厳密に超えないよう、品質係数（0.05〜0.98）と解像度スケール係数を動的に反復探索（Binary Search Convergence）し、最適な画質バランスを即座に算出します。
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">フォーマット特性と使い分け</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <strong className="text-indigo-600 font-bold block mb-0.5">WebP (推奨)</strong>
                <span className="text-slate-500 leading-tight block">アルファ透過を保持したままJPEG同等以上の圧縮率。Web用最適。</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <strong className="text-slate-800 font-bold block mb-0.5">PNG</strong>
                <span className="text-slate-500 leading-tight block">可逆圧縮のため品質低下はありませんが、容量削減には寸法縮小が必要です。</span>
              </div>
              <div className="bg-white p-2.5 rounded border border-slate-200">
                <strong className="text-slate-800 font-bold block mb-0.5">JPEG</strong>
                <span className="text-slate-500 leading-tight block">写真やバナーに高い圧縮効果と最高互換性を提供します。</span>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              100% クライアントサイド安全実行
            </h4>
            <p className="leading-relaxed text-[11px] text-slate-600">
              すべての画像処理はHTML5 Canvas APIを通じてブラウザ内だけで完結します。画像データがインターネット上の外部サーバーへ送信されることは一切ありません。
            </p>
          </div>
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

