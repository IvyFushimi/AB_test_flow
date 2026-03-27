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

  // History & Settings State
  const [history, setHistory] = useState<{id: string, input: string, result: string, date: string}[]>(() => {
    const saved = localStorage.getItem('ab_test_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Calculator State
  const [showCalc, setShowCalc] = useState(false);
  const [calcType, setCalcType] = useState<'absolute' | 'rate'>('rate');
  const [calcInputs, setCalcInputs] = useState({
    sigma: '',
    delta: '',
    pa: '',
    pb: '',
    confidence: '95',
    power: '80'
  });

  const getZAlpha = (confidence: number) => {
    // Mapping for common confidence levels (1 - alpha/2)
    if (confidence >= 99) return 2.576;
    if (confidence >= 95) return 1.96;
    if (confidence >= 90) return 1.645;
    if (confidence >= 85) return 1.44;
    return 1.96; // Default to 95%
  };

  const getZBeta = (power: number) => {
    // Mapping for common power levels (1 - beta)
    if (power >= 99) return 2.326;
    if (power >= 95) return 1.645;
    if (power >= 90) return 1.282;
    if (power >= 85) return 1.036;
    if (power >= 80) return 0.842;
    return 0.842; // Default to 80%
  };

  const calculateSampleSize = () => {
    const zAlpha = getZAlpha(parseFloat(calcInputs.confidence));
    const zBeta = getZBeta(parseFloat(calcInputs.power));
    const constant = Math.pow(zAlpha + zBeta, 2);

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
      
      if (design) {
        const newHistoryItem = {
          id: Date.now().toString(),
          input: input,
          result: design,
          date: new Date().toLocaleString()
        };
        const updatedHistory = [newHistoryItem, ...history].slice(0, 20); // Keep last 20
        setHistory(updatedHistory);
        localStorage.setItem('ab_test_history', JSON.stringify(updatedHistory));
      }
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
            <button 
              onClick={() => setShowHistory(true)}
              className="hover:text-black transition-colors flex items-center gap-1.5"
            >
              <History className="w-4 h-4" />
              历史记录
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="hover:text-black transition-colors flex items-center gap-1.5"
            >
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

                  {/* Advanced Stats Settings */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/[0.03]">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-black/40">置信水平 (%)</label>
                      <select 
                        value={calcInputs.confidence}
                        onChange={(e) => setCalcInputs({...calcInputs, confidence: e.target.value})}
                        className="w-full p-2 bg-white border border-black/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10 appearance-none"
                      >
                        <option value="99">99% (α=0.01)</option>
                        <option value="95">95% (α=0.05)</option>
                        <option value="90">90% (α=0.10)</option>
                        <option value="85">85% (α=0.15)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-black/40">统计功效 (%)</label>
                      <select 
                        value={calcInputs.power}
                        onChange={(e) => setCalcInputs({...calcInputs, power: e.target.value})}
                        className="w-full p-2 bg-white border border-black/5 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10 appearance-none"
                      >
                        <option value="95">95% (β=0.05)</option>
                        <option value="90">90% (β=0.10)</option>
                        <option value="85">85% (β=0.15)</option>
                        <option value="80">80% (β=0.20)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                    <span className="text-xs font-medium text-black/40">每组最少样本量:</span>
                    <span className="text-lg font-bold text-black">
                      {sampleSize ? sampleSize.toLocaleString() : '--'}
                    </span>
                  </div>
                  <p className="text-[10px] text-black/30 leading-tight">
                    * 自动引用 Z-score 映射。生成方案时将包含置信度与功效参数。
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

      {/* History Slide-over */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <h2 className="font-bold text-lg">实验历史</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <Settings2 className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-black/30 space-y-2">
                  <History className="w-12 h-12 opacity-20" />
                  <p>暂无历史记录</p>
                </div>
              ) : (
                history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setInput(item.input);
                      setResult(item.result);
                      setShowHistory(false);
                    }}
                    className="w-full text-left p-4 rounded-xl border border-black/5 hover:border-black/20 hover:bg-black/[0.02] transition-all group"
                  >
                    <div className="text-[10px] font-bold uppercase text-black/40 mb-1">{item.date}</div>
                    <div className="text-sm font-medium line-clamp-2 text-black/80 group-hover:text-black">{item.input}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="font-bold text-xl mb-6">应用设置</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black/40">数据管理</h3>
                <button 
                  onClick={() => {
                    if (confirm('确定要清除所有历史记录吗？')) {
                      setHistory([]);
                      localStorage.removeItem('ab_test_history');
                      setShowSettings(false);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  清除历史记录
                </button>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-black/40">关于</h3>
                <p className="text-xs text-black/60 leading-relaxed">
                  A/B Test Architect 是一款专业的实验设计辅助工具，旨在帮助产品经理和数据科学家快速构建严谨的实验方案。
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="mt-8 w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-all"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
