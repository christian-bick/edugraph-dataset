import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RenderPayload } from '../../types/ml-engine.ts';
import { ArithmeticTeenProblem } from '../../types/problems.ts';
import '../../tailwind.css';

interface Props {
    payload: RenderPayload;
}

function TenFrame({ filledCount, colorClass }: { filledCount: number; colorClass: 'color-a' | 'color-b' }) {
    const dotClass = colorClass === 'color-a'
        ? 'w-[22px] h-[22px] rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_2px_4px_rgba(190,18,60,0.3)]'
        : 'w-[22px] h-[22px] rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_2px_4px_rgba(217,119,6,0.3)]';

    return (
        <div className="grid grid-cols-5 grid-rows-2 gap-[3px] border-2 border-slate-600 bg-white rounded-md overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => {
                const isFilled = i < filledCount;
                return (
                    <div key={i} className="w-8 h-8 border-[0.5px] border-slate-100 flex justify-center items-center">
                        {isFilled && <div className={dotClass} />}
                    </div>
                );
            })}
        </div>
    );
}

export function PlaceValueBlocks({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data as ArithmeticTeenProblem;

    const mode = data.mode || 'compose-teen';
    const isMakeTen = mode === 'make-ten';
    const isCompose = mode === 'compose-teen';

    let target = data.target !== undefined ? data.target : 14;
    let ones = data.ones !== undefined ? data.ones : 4;

    // Ensure within teen range for teen modes
    if (!isMakeTen && (target < 10 || target > 20)) {
        target = 14;
        ones = 4;
    }

    const givenNumber = (data as any).givenNumber !== undefined ? (data as any).givenNumber : 7;
    const missingNumber = (data as any).missingNumber !== undefined ? (data as any).missingNumber : 3;

    const frameACount = isMakeTen ? givenNumber : 10;
    const frameBCount = isMakeTen ? missingNumber : ones;
    const labelA = isMakeTen ? `${givenNumber} ones` : '10 ones';
    const labelB = isMakeTen ? `${missingNumber} ones` : `${ones} ones`;

    const solClass = isSolutionView ? 'text-green-600 border-green-600 bg-green-50 font-bold' : 'text-slate-800 bg-white';

    const renderEquation = () => {
        if (isMakeTen) {
            const missingVal = isSolutionView ? missingNumber : '';
            return (
                <div className="flex items-center gap-3">
                    <span className="text-[2.2rem] font-extrabold text-slate-700">{givenNumber}</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">+</span>
                    <div className={`w-[60px] h-[60px] border-2 border-slate-600 rounded-lg flex justify-center items-center text-[2.2rem] font-mono ${solClass}`}>
                        {missingVal}
                    </div>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">=</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-700">10</span>
                </div>
            );
        } else if (isCompose) {
            const targetVal = isSolutionView ? target : '';
            return (
                <div className="flex items-center gap-3">
                    <span className="text-[2.2rem] font-extrabold text-slate-700">10</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">+</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-700">{ones}</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">=</span>
                    <div className={`w-[60px] h-[60px] border-2 border-slate-600 rounded-lg flex justify-center items-center text-[2.2rem] font-mono ${solClass}`}>
                        {targetVal}
                    </div>
                </div>
            );
        } else {
            const onesVal = isSolutionView ? ones : '';
            return (
                <div className="flex items-center gap-3">
                    <span className="text-[2.2rem] font-extrabold text-slate-700">{target}</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">=</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-700">10</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">+</span>
                    <div className={`w-[60px] h-[60px] border-2 border-slate-600 rounded-lg flex justify-center items-center text-[2.2rem] font-mono ${solClass}`}>
                        {onesVal}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-[1.35rem] font-bold text-slate-700 mb-5 text-center font-sans">
                    {isMakeTen 
                        ? 'How many more dots to make 10?' 
                        : isCompose 
                            ? 'How many dots are there in total?' 
                            : 'Decompose the teen number.'
                    }
                </div>
                
                <div className="flex gap-[20px] bg-slate-50 p-[15px] border-[1.5px] border-dashed border-slate-300 rounded-xl mb-[25px]">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="text-[0.85rem] font-bold text-slate-400 uppercase">{labelA}</div>
                        <TenFrame filledCount={frameACount} colorClass="color-a" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="text-[0.85rem] font-bold text-slate-400 uppercase">{labelB}</div>
                        <TenFrame filledCount={frameBCount} colorClass="color-b" />
                    </div>
                </div>

                {renderEquation()}
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: RenderPayload) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<PlaceValueBlocks payload={payload} />);
    }
};
