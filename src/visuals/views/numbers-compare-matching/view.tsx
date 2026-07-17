import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import { getIconIndexes, getCorrectChoice } from './helpers.ts';
import { NumbersCompareMatchingViewConfig, NumbersCompareMatchingViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import '../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: NumbersCompareMatchingViewConfig;
    payload: ViewRenderPayload<'numbers-compare-matching'>;
}

const NumbersCompareMatchingCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const num1 = data.num1;
    const num2 = data.num2;
    const comparisonType = data.comparisonType || 'greater';

    const isFewerQuestion = comparisonType === 'less';
    const promptText = isFewerQuestion ? "Which group has fewer items?" : "Which group has more items?";

    const { iconA, iconB } = useMemo(() => {
        const { iconAIndex, iconBIndex } = getIconIndexes(problem.id, ICONS.length);
        return { iconA: ICONS[iconAIndex], iconB: ICONS[iconBIndex] };
    }, [problem.id]);

    const maxCount = Math.max(num1, num2);
    const spacing = 42;
    const startY = 20;

    const correctChoice = useMemo(() => {
        return getCorrectChoice(num1, num2, isFewerQuestion);
    }, [num1, num2, isFewerQuestion]);

    const getBtnClass = (choice: 'A' | 'B' | 'equal') => {
        let cls = "flex-1 py-3 px-2 border-2 rounded-lg text-center font-semibold text-[0.95rem] transition-all duration-200 cursor-pointer ";
        if (correctChoice === choice && isSolutionView) {
            cls += "border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold";
        } else {
            cls += "border-slate-200 bg-white text-slate-600";
        }
        return cls;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.4rem] font-bold text-slate-700 mb-[25px] text-center leading-relaxed font-sans">
                    {promptText}
                </div>
                
                <div 
                    className="relative w-[360px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-5"
                    style={{ height: `${Math.max(220, (maxCount * spacing) + 80)}px` }}
                >
                    <div className="absolute top-2 text-[0.95rem] font-extrabold text-slate-400 uppercase tracking-[0.5px] left-[45px]">Group A</div>
                    <div className="absolute top-2 text-[0.95rem] font-extrabold text-slate-400 uppercase tracking-[0.5px] left-[225px]">Group B</div>
                    
                    <div className="relative w-full h-full mt-[25px]">
                        {/* Group A Items */}
                        {Array.from({ length: num1 }).map((_, i) => {
                            const y = startY + i * spacing;
                            const isUnmatched = i >= num2 && num1 > num2;
                            const highlight = isUnmatched && isSolutionView;
                            return (
                                <div 
                                    key={`a-${i}`}
                                    className={`absolute w-[35px] h-[35px] flex justify-center items-center z-10 ${
                                        highlight ? 'border-2 border-dashed border-red-500 rounded-md p-0.5 bg-red-500/5 -translate-x-1 -translate-y-1 content-box' : ''
                                    }`}
                                    style={{ top: `${y}px`, left: '60px' }}
                                >
                                    <img src={`/icons/counting/${iconA}`} alt="Group A object" className="w-[35px] h-[35px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]" />
                                </div>
                            );
                        })}

                        {/* Group B Items */}
                        {Array.from({ length: num2 }).map((_, i) => {
                            const y = startY + i * spacing;
                            const isUnmatched = i >= num1 && num2 > num1;
                            const highlight = isUnmatched && isSolutionView;
                            return (
                                <div 
                                    key={`b-${i}`}
                                    className={`absolute w-[35px] h-[35px] flex justify-center items-center z-10 ${
                                        highlight ? 'border-2 border-dashed border-red-500 rounded-md p-0.5 bg-red-500/5 -translate-x-1 -translate-y-1 content-box' : ''
                                    }`}
                                    style={{ top: `${y}px`, left: '240px' }}
                                >
                                    <img src={`/icons/counting/${iconB}`} alt="Group B object" className="w-[35px] h-[35px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]" />
                                </div>
                            );
                        })}

                        {/* Matching Lines */}
                        <svg 
                            className="absolute top-0 left-0 w-[340px] pointer-events-none z-0"
                            style={{ height: `${(maxCount * spacing) + startY}px` }}
                        >
                            {Array.from({ length: Math.min(num1, num2) }).map((_, i) => {
                                const y = startY + i * spacing + 18;
                                return (
                                    <line 
                                        key={i}
                                        x1="100" 
                                        y1={y} 
                                        x2="240" 
                                        y2={y} 
                                        stroke="#94a3b8" 
                                        strokeWidth="2" 
                                        strokeDasharray="4 4" 
                                    />
                                );
                            })}
                        </svg>
                    </div>
                </div>

                <div className="flex gap-3 w-full animate-fade-in">
                    <div className={getBtnClass('A')}>Group A</div>
                    <div className={getBtnClass('B')}>Group B</div>
                    <div className={getBtnClass('equal')}>They are equal</div>
                </div>
            </div>
        </div>
    );
};

export const NumbersCompareMatching = withConfig(NumbersCompareMatchingViewSchema, NumbersCompareMatchingCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-compare-matching'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersCompareMatching payload={payload} />);
    }
};
