import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import { NumbersWriteCountViewConfig, NumbersWriteCountViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersWriteCountViewConfig;
    payload: ViewRenderPayload<'numbers-write-count'>;
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

function BaseTenBlocks({number}: {number: number}) {
    const hundreds = Math.floor(number / 100);
    const tens = Math.floor((number % 100) / 10);
    const ones = number % 10;
    return (
        <div className="flex items-end gap-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                    {Array.from({length: hundreds}).map((_, index) => (
                        <div key={index} className="grid h-[112px] w-[112px] grid-cols-10 grid-rows-10 border-2 border-sky-700 bg-sky-100">
                            {Array.from({length: 100}).map((__, cell) => <span key={cell} className="border-[0.5px] border-sky-300" />)}
                        </div>
                    ))}
                </div>
                <span className="font-bold text-slate-600">{hundreds} hundred</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1.5">
                    {Array.from({length: tens}).map((_, index) => (
                        <div key={index} className="grid h-[112px] w-[14px] grid-rows-10 border-2 border-amber-700 bg-amber-100">
                            {Array.from({length: 10}).map((__, cell) => <span key={cell} className="border-[0.5px] border-amber-300" />)}
                        </div>
                    ))}
                </div>
                <span className="font-bold text-slate-600">{tens} tens</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({length: ones}).map((_, index) => <span key={index} className="h-[14px] w-[14px] border-2 border-emerald-700 bg-emerald-100" />)}
                </div>
                <span className="font-bold text-slate-600">{ones} ones</span>
            </div>
        </div>
    );
}

export const NumbersWriteCountCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('numbers-write-count', data, ['number']);

    const number = data.number;
    const answerContent = isSolutionView ? number : '';

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex items-center gap-[30px] flex-wrap">
                {number <= 20 ? <DoubleTenFrame number={number} /> : <BaseTenBlocks number={number} />}
                <div className="flex items-center gap-[15px]">
                    {!isSolutionView && <div className="text-[2rem] font-bold text-slate-700">Count:</div>}
                    <div className={`border-[2.5px] rounded-xl w-[75px] h-[75px] flex justify-center items-center text-[2.5rem] font-mono ${
                        isSolutionView 
                            ? 'text-green-600 border-green-600 bg-green-50 font-bold' 
                            : 'border-slate-500 text-slate-800'
                    }`}>
                        {answerContent}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NumbersWriteCount = withConfig(NumbersWriteCountViewSchema, NumbersWriteCountCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-write-count'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersWriteCount payload={payload} />);
    }
};
