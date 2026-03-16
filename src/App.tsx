/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { generateABTestDesign } from './services/aiService';
import ReactMarkdown from 'react-markdown';
import { 
  Beaker, 
  Send, 
  Loader2, 
  ClipboardCheck, 
  AlertCircle,
  BarChart3,
  Users,
  Settings2,
  History
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculator State
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<'absolute' | 'rate'>('rate');
  const [calcInputs, setCalcInputs] = useState({
    sigma: '',
    delta: '',
    pa: '',
    pb: ''
  });

  const calculateSampleSize = () => {
    const constant = Math.pow(1.96 + 0.84, 2); // 7.84
    if (calcType === 'absolute') {
      const sigma = parseFloat(calcInputs.sigma);
      const delta = parseFloat(calcInputs.delta);
      if (isNaN(sigma) || isNaN(delta) || delta === 0) return null;
      return Math.ceil((Math.pow(sigma, 2) / Math.pow(delta, 2)) * constant);
    } else {
      const pa = parseFloat(calcInputs.pa) / 100;
      const pb = parseFloat(calcInputs.pb) / 100;
      if (isNaN(pa) || isNaN(pb) || pa === pb) return null;
      const numerator = pa * (1 - pa) + pb * (1 - pb);
      const denominator = Math.pow(pb - pa, 2);
      return Math.ceil((numerator / denominator) * constant);
    }
  };

  const sampleSize = calculateSampleSize();

  const handleGenerate = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError('');
    try {
      let finalPrompt = input;
      if (showCalc && sampleSize) {
        finalPrompt += `\n\n[补充数据] 业务方已通过计算得出每组所需的最小样本量为：${sampleSize}。请在方案中引用此数据并进行合理性评估。`;
      }
      const design = await generateABTestDesign(finalPrompt);
      setResult(design || '未能生成设计方案，请重试。');
    } catch (err) {
      console.error(err);
      setError('生成过程中发生错误，请检查网络或 API 配置。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Beaker className="text-white w-5 h-5" />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">A/B Test Architect</h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-black/60">
            <button className="hover:text-black transition-colors flex items-center gap-1.5">
              <History className="w-4 h-4" />
              历史记录
            </button>
            <button className="hover:text-black transition-colors flex items-center gap-1.5">
              <Settings2 className="w-4 h-4" />
              设置
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-black/40">
                  <AlertCircle className="w-4 h-4" />
                  业务场景与需求
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如：我们想在 App 首页增加一个‘限时秒杀’入口，目标是提升整体订单转化率，但担心会影响到原有的‘每日特价’频道流量..."
                className="w-full h-48 p-4 bg-[#F9F9F9] border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 resize-none transition-all placeholder:text-black/20"
              />
            </div>

            {/* Calculator Toggle */}
            <div className="pt-4 border-t border-black/5">
              <button 
                onClick={() => setShowCalc(!showCalc)}
                className="flex items-center justify-between w-full text-sm font-semibold text-black/60 hover:text-black transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  样本量计算器 (可选)
                </div>
                <span className="text-xs">{showCalc ? '收起' : '展开'}</span>
              </button>

              {showCalc && (
                <div className="mt-4 p-4 bg-[#F9F9F9] rounded-xl border border-black/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex p-1 bg-black/5 rounded-lg">
                    <button 
                      onClick={() => setCalcType('rate')}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                        calcType === 'rate' ? "bg-white shadow-sm text-black" : "text-black/40 hover:text-black/60"
                      )}
                    >
                      比率类指标
                    </button>
                    <button 
                      onClick={() => setCalcType('absolute')}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                        calcType === 'absolute' ? "bg-white shadow-sm text-black" : "text-black/40 hover:text-black/60"
                      )}
                    >
                      绝对值指标
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {calcType === 'rate' ? (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-black/40">基准转化率 (PA %)</label>
                          <input 
                            type="number" 
                            value={calcInputs.pa}
                            onChange={(e) => setCalcInputs({...calcInputs, pa: e.target.value})}
                            placeholder="20"
                            className="w-full p-2 bg-white border border-black/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-black/40">预期转化率 (PB %)</label>
                          <input 
                            type="number" 
                            value={calcInputs.pb}
                            onChange={(e) => setCalcInputs({...calcInputs, pb: e.target.value})}
                            placeholder="25"
                            className="w-full p-2 bg-white border border-black/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-black/40">标准差 (σ)</label>
                          <input 
                            type="number" 
                            value={calcInputs.sigma}
                            onChange={(e) => setCalcInputs({...calcInputs, sigma: e.target.value})}
                            placeholder="20"
                            className="w-full p-2 bg-white border border-black/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-black/40">绝对提升 (δ)</label>
                          <input 
                            type="number" 
                            value={calcInputs.delta}
                            onChange={(e) => setCalcInputs({...calcInputs, delta: e.target.value})}
                            placeholder="5"
                            className="w-full p-2 bg-white border border-black/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                    <span className="text-xs font-medium text-black/40">每组最少样本量:</span>
                    <span className="text-lg font-bold text-black">
                      {sampleSize ? sampleSize.toLocaleString() : '--'}
                    </span>
                  </div>
                  <p className="text-[10px] text-black/30 leading-tight">
                    * 基于 α=0.05, β=0.2 (Power=0.8) 计算。生成方案时将自动包含此数据。
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !input.trim()}
              className={cn(
                "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
                isLoading || !input.trim() 
                  ? "bg-black/10 text-black/30 cursor-not-allowed" 
                  : "bg-black text-white hover:bg-black/90 active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在架构实验方案...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  生成实验设计
                </>
              )}
            </button>
          </div>

          <div className="bg-black/5 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-black/40">设计准则</h3>
            <ul className="space-y-3">
              {[
                { icon: BarChart3, text: "严谨的统计学指标体系" },
                { icon: Users, text: "精准的人群分流策略" },
                { icon: ClipboardCheck, text: "可落地的成本与预算评估" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium">
                  <item.icon className="w-4 h-4 text-black/60" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 min-h-[600px] flex flex-col">
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-black/40">
                <ClipboardCheck className="w-4 h-4" />
                实验设计方案
              </div>
              {result && (
                <button 
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 transition-colors"
                >
                  复制方案
                </button>
              )}
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-black/20 space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin" />
                  <p className="font-medium animate-pulse">正在进行统计学建模与方案推演...</p>
                </div>
              ) : result ? (
                <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-black/80 prose-li:text-black/80">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-red-500/60 space-y-2">
                  <AlertCircle className="w-12 h-12" />
                  <p className="font-medium">{error}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-black/20 space-y-4">
                  <Beaker className="w-16 h-16 opacity-10" />
                  <p className="text-center max-w-xs">
                    在左侧输入您的业务场景，<br />
                    系统将为您生成专业的 A/B 实验设计。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
