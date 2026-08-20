import React, { useState } from 'react';
import { Sliders, Target, FileType, Cpu, Zap, Info, Check, Sparkles, SlidersHorizontal } from 'lucide-react';
import { OutputFormat, CompressionPriority, PresetSize } from '../types';
import { PRESET_SIZES } from '../utils/presets';

interface TargetSizeControlProps {
  targetSizeKB: number;
  setTargetSizeKB: (kb: number) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  priority: CompressionPriority;
  setPriority: (priority: CompressionPriority) => void;
  onApplyToAll?: () => void;
  hasItems: boolean;
}

export const TargetSizeControl: React.FC<TargetSizeControlProps> = ({
  targetSizeKB,
  setTargetSizeKB,
  outputFormat,
  setOutputFormat,
  priority,
  setPriority,
  onApplyToAll,
  hasItems,
}) => {
  const [unit, setUnit] = useState<'KB' | 'MB'>(targetSizeKB >= 1024 ? 'MB' : 'KB');
  const [inputValue, setInputValue] = useState<string>(
    targetSizeKB >= 1024 ? (targetSizeKB / 1024).toString() : targetSizeKB.toString()
  );

  const handleUnitChange = (newUnit: 'KB' | 'MB') => {
    setUnit(newUnit);
    if (newUnit === 'MB') {
      const mb = Math.round((targetSizeKB / 1024) * 100) / 100;
      setInputValue(mb.toString());
    } else {
      setInputValue(targetSizeKB.toString());
    }
  };

  const handleInputChange = (valStr: string) => {
    setInputValue(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num > 0) {
      const kb = unit === 'MB' ? Math.round(num * 1024) : Math.round(num);
      setTargetSizeKB(Math.max(5, Math.min(100000, kb)));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kb = parseInt(e.target.value, 10);
    setTargetSizeKB(kb);
    if (unit === 'MB') {
      setInputValue((Math.round((kb / 1024) * 100) / 100).toString());
    } else {
      setInputValue(kb.toString());
    }
  };

  const handlePresetClick = (preset: PresetSize) => {
    setTargetSizeKB(preset.sizeKB);
    if (preset.sizeKB >= 1024) {
      setUnit('MB');
      setInputValue((preset.sizeKB / 1024).toString());
    } else {
      setUnit('KB');
      setInputValue(preset.sizeKB.toString());
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              目標ファイルサイズ & 設定 (TARGET SPECIFICATIONS)
            </h2>
            <p className="text-[11px] text-slate-500">
              指定した容量上限を超えない最大品質と解像度を自動で探求・圧縮します
            </p>
          </div>
        </div>

        {hasItems && onApplyToAll && (
          <button
            onClick={onApplyToAll}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 rounded-md border border-indigo-200 transition-colors self-start sm:self-auto"
            id="btn-apply-all-settings"
          >
            <Check className="w-3 h-3" />
            全画像にこの設定を一括適用
          </button>
        )}
      </div>

      {/* Main Target Size Input & Slider */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Number & Unit Box */}
        <div className="md:col-span-5 bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col justify-between">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>目標上限容量 (TARGET SIZE)</span>
            <span className="text-indigo-600 font-mono font-bold text-xs bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {targetSizeKB >= 1024
                ? `${(targetSizeKB / 1024).toFixed(2)} MB (${targetSizeKB} KB)`
                : `${targetSizeKB} KB`}
            </span>
          </label>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="5"
                max="100000"
                step={unit === 'MB' ? '0.1' : '10'}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full pl-3 pr-2 py-1.5 text-lg font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                id="input-target-size"
              />
            </div>

            <div className="inline-flex rounded-md bg-slate-200 p-0.5 border border-slate-300">
              <button
                type="button"
                onClick={() => handleUnitChange('KB')}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded transition-all ${
                  unit === 'KB'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="btn-unit-kb"
              >
                KB
              </button>
              <button
                type="button"
                onClick={() => handleUnitChange('MB')}
                className={`px-2.5 py-1 text-xs font-bold font-mono rounded transition-all ${
                  unit === 'MB'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                id="btn-unit-mb"
              >
                MB
              </button>
            </div>
          </div>
        </div>

        {/* Range Slider */}
        <div className="md:col-span-7 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-slate-500 font-medium">
            <span>50 KB</span>
            <span>200 KB</span>
            <span>500 KB</span>
            <span>1 MB</span>
            <span>5 MB</span>
            <span>10 MB</span>
          </div>
          <input
            type="range"
            min="20"
            max="10240"
            step="10"
            value={targetSizeKB}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
            id="slider-target-size"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>スライダーで直感指定、または左枠でミリ単位で直接入力可能</span>
            <span className="font-mono text-slate-500">RANGE: 20KB - 10MB</span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            定番プリセット (QUICK PRESETS)
          </label>
          <span className="text-[10px] text-slate-400">用途に応じた推奨容量</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5">
          {PRESET_SIZES.map((preset) => {
            const isSelected = targetSizeKB === preset.sizeKB;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`px-2 py-1.5 rounded-md text-left border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
                title={preset.description}
                id={`preset-${preset.sizeKB}kb`}
              >
                <div className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {preset.label}
                </div>
                <div
                  className={`text-[9px] truncate ${
                    isSelected ? 'text-indigo-100' : 'text-slate-500'
                  }`}
                >
                  {preset.description.split('/')[0].trim()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Options: Output Format & Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        {/* Output Format */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <FileType className="w-3 h-3 text-slate-500" />
            出力フォーマット (OUTPUT FORMAT)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'auto', label: '自動最適化', desc: '画質と容量最善' },
              { id: 'original', label: '元形式維持', desc: 'PNG/JPEGそのまま' },
              { id: 'image/webp', label: 'WebP', desc: '高圧縮・透過対応' },
              { id: 'image/jpeg', label: 'JPEG', desc: '写真・高互換' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setOutputFormat(fmt.id as OutputFormat)}
                className={`p-2 rounded-md text-left border transition-all ${
                  outputFormat === fmt.id
                    ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 text-indigo-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                id={`btn-format-${fmt.id.replace('/', '-')}`}
              >
                <div className="text-xs font-bold text-slate-900">{fmt.label}</div>
                <div className="text-[10px] text-slate-500">{fmt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Compression Priority */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-500" />
            最適化優先方針 (STRATEGY)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {
                id: 'balanced',
                label: 'バランス',
                desc: '画質・解像度を総合最適化',
              },
              {
                id: 'quality',
                label: '画質重視',
                desc: 'ノイズ抑制・適度な縮小',
              },
              {
                id: 'resolution',
                label: '解像度重視',
                desc: 'ピクセル寸法を最大限維持',
              },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id as CompressionPriority)}
                className={`p-2 rounded-md text-left border transition-all ${
                  priority === p.id
                    ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 text-indigo-950'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                id={`btn-priority-${p.id}`}
              >
                <div className="text-xs font-bold text-slate-900">{p.label}</div>
                <div className="text-[10px] text-slate-500">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

