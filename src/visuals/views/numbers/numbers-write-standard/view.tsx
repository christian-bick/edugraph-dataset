import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { NumbersWriteStandardViewConfig, NumbersWriteStandardViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData } from '../../../helpers/validation.ts';
import {validateWritingNumber} from '../helpers.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersWriteStandardViewConfig;
    payload: ViewRenderPayload<'numbers-write-standard'>;
}

function BaseTenSketch({number}: {number: number}) {
    const hundreds = Math.floor(number / 100);
    const tens = Math.floor((number % 100) / 10);
    const ones = number % 10;
    return (
        <div className="flex min-h-[82px] items-end gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3" aria-label="Base-ten representation">
            {Array.from({length: hundreds}).map((_, index) => (
                <span key={`h-${index}`} className="h-14 w-14 border-2 border-sky-700 bg-sky-100" />
            ))}
            <div className="flex gap-1">
                {Array.from({length: tens}).map((_, index) => (
                    <span key={`t-${index}`} className="h-14 w-2.5 border-2 border-amber-700 bg-amber-100" />
                ))}
            </div>
            <div className="grid grid-cols-5 gap-1">
                {Array.from({length: ones}).map((_, index) => (
                    <span key={`o-${index}`} className="h-3 w-3 border-2 border-emerald-700 bg-emerald-100" />
                ))}
            </div>
        </div>
    );
}

function DoubleTenFrame({ number }: { number: number }) {
    const renderFrame = (startOffset: number) => {
        return (
            <div className="grid grid-cols-5 grid-rows-2 gap-[3px] border-2 border-slate-600 bg-white rounded-md overflow-hidden">
                {Array.from({ length: 10 }).map((_, i) => {
                    const isFilled = (i + startOffset) < number;
                    return (
                        <div key={i} className="w-8 h-8 border-[0.5px] border-slate-100 flex justify-center items-center">
                            {isFilled && (
                                <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-sky-400 to-sky-600 shadow-[0_2px_4px_rgba(2,132,199,0.3)]"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex gap-[15px] bg-slate-50 p-3 border-[1.5px] border-dashed border-slate-300 rounded-xl">
            {renderFrame(0)}
            {renderFrame(10)}
        </div>
    );
}

const NumbersWriteStandardCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('numbers-write-standard', data, ['number']);
    const number = data.number;
    validateWritingNumber('numbers-write-standard', number);

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex items-center gap-[30px] flex-wrap font-sans">
                {number <= 20 ? <DoubleTenFrame number={number} /> : <BaseTenSketch number={number} />}
                <div className="text-[3.5rem] font-extrabold text-slate-800 min-w-[80px] text-center">
                    {number}
                </div>
                <div className="flex gap-3">
                    {/* Box 1, 2 & 3: Standard Writing Response Boxes */}
                    {Array.from({ length: 3 }).map((_, idx) => {
                        const content = isSolutionView ? String(number) : '';
                        let cls = 'border-2 border-slate-500 rounded-lg w-[84px] h-[70px] flex justify-center items-center text-[2rem] font-mono bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden';
                        
                        if (isSolutionView) {
                            cls += ' text-emerald-700 border-emerald-700 bg-emerald-50 font-bold';
                        } else {
                            cls += ' text-slate-300 font-normal border-dashed';
                        }

                        return (
                            <div key={idx} className={`${cls} relative`}>
                                <span className="absolute left-2 right-2 top-1/2 border-t border-dashed border-slate-300" />
                                <span className="absolute bottom-2 left-2 right-2 border-t-2 border-slate-300" />
                                <span className="relative z-10">{content}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const NumbersWriteStandard = withConfig(NumbersWriteStandardViewSchema, NumbersWriteStandardCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-write-standard'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersWriteStandard payload={payload} />);
    }
};
