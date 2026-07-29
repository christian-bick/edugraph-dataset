import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { getIconIndexes, getCorrectChoice } from './helpers.ts';
import {validatePictorialComparisonCounts} from '../helpers.ts';
import { NumbersCompareCountingViewConfig, NumbersCompareCountingViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: NumbersCompareCountingViewConfig;
    payload: ViewRenderPayload<'numbers-compare-counting'>;
}

const NumbersCompareCountingCore = ({ payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('numbers-compare-counting', data, ['num1', 'num2', 'relation']);

    const num1 = data.num1;
    const num2 = data.num2;
    const relation = data.relation;
    validatePictorialComparisonCounts('numbers-compare-counting', num1, num2);

    const isFewerQuestion = relation === 'less';
    const promptText = isFewerQuestion ? "Which group has fewer items?" : "Which group has more items?";

    const { iconA, iconB } = useMemo(() => {
        const { iconAIndex, iconBIndex } = getIconIndexes(payload.seed, ICONS.length);
        return { iconA: ICONS[iconAIndex], iconB: ICONS[iconBIndex] };
    }, [payload.seed]);


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
                {!isSolutionView && (
                    <div className="text-[1.4rem] font-bold text-slate-700 mb-[25px] text-center leading-relaxed font-sans">
                        {promptText}
                    </div>
                )}
                
                <div 
                    className="relative w-[500px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px] p-5 flex flex-row gap-4"
                >
                    {/* Group A */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="text-[0.95rem] font-extrabold text-slate-400 uppercase tracking-[0.5px] mb-4">Group A</div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {Array.from({ length: num1 }).map((_, i) => (
                                <img key={`a-${i}`} src={`/icons/counting/${iconA}`} alt="Group A object" className="w-[30px] h-[30px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]" />
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-[2px] bg-slate-200 rounded-full"></div>

                    {/* Group B */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="text-[0.95rem] font-extrabold text-slate-400 uppercase tracking-[0.5px] mb-4">Group B</div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {Array.from({ length: num2 }).map((_, i) => (
                                <img key={`b-${i}`} src={`/icons/counting/${iconB}`} alt="Group B object" className="w-[30px] h-[30px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]" />
                            ))}
                        </div>
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

export const NumbersCompareCounting = withConfig(NumbersCompareCountingViewSchema, NumbersCompareCountingCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-compare-counting'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersCompareCounting payload={payload} />);
    }
};
