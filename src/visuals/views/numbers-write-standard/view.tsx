import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../types/ml-engine.ts';
import '../../../tailwind.css';

interface Props {
    payload: ViewRenderPayload<'numbers-write-standard'>;
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

export function NumbersWriteStandard({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const outline = payload.constraints.outline === true || payload.constraints.outline === 'true';
    const number = data.number;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex items-center gap-[30px] flex-wrap font-sans">
                <DoubleTenFrame number={number} />
                <div className="text-[3.5rem] font-extrabold text-slate-800 min-w-[80px] text-center">
                    {number}
                </div>
                <div className="flex gap-3">
                    {/* Box 1, 2 & 3: Standard Writing Response Boxes */}
                    {Array.from({ length: 3 }).map((_, idx) => {
                        let content = '';
                        let cls = 'border-2 border-slate-500 rounded-lg w-[70px] h-[70px] flex justify-center items-center text-[2.2rem] font-mono bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden';
                        
                        if (isSolutionView) {
                            cls += ' text-green-600 border-green-600 bg-green-50 font-bold';
                            content = String(number);
                        } else if (outline) {
                            cls += ' text-slate-300 font-normal';
                            content = String(number);
                        } else {
                            cls += ' text-slate-800';
                        }

                        return (
                            <div key={idx} className={cls}>
                                {content}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

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
