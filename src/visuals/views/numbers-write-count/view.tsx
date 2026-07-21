import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import { NumbersWriteCountViewConfig, NumbersWriteCountViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import { validateProblemData } from '../../helpers/validation.ts';
import '../../../tailwind.css';

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

export const NumbersWriteCountCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('numbers-write-count', data, ['number']);

    const number = data.number;
    const answerContent = isSolutionView ? number : '';

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex items-center gap-[30px] flex-wrap">
                <DoubleTenFrame number={number} />
                <div className="flex items-center gap-[15px]">
                    <div className="text-[2rem] font-bold text-slate-700">Count:</div>
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
