import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RenderPayload } from '../../types/ml-engine.ts';
import { CountingSimpleProblem } from '../../types/problems.ts';
import { generatePositions } from './helpers.ts';
import '../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface Props {
    payload: RenderPayload;
}

export function CountingObjects({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data as CountingSimpleProblem;
    
    const mode = data.mode || 'simple';
    const numObjects = data.numObjects;
    const totalCount = data.totalCount || numObjects;
    const arrangement = data.arrangement || data.layout || 'line';

    // Seed/Icon Selection - deterministic based on problem.id
    const icon = useMemo(() => {
        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        return ICONS[iconIndex];
    }, [problem.id]);

    // Prompt selection
    const promptText = useMemo(() => {
        if (mode === 'count-out') {
            return `Color exactly ${numObjects} objects.`;
        } else if (mode === 'one-to-one') {
            return 'Count the objects and write the numbers in order.';
        } else if (mode === 'cardinality') {
            return 'Count the objects. What is the total number?';
        }
        return 'How many objects are there?';
    }, [mode, numObjects]);

    const renderCount = mode === 'count-out' ? totalCount : numObjects;

    // Generate positions deterministically based on layout/seed
    const positions = useMemo(() => {
        return generatePositions(renderCount, arrangement, problem.id);
    }, [renderCount, arrangement, problem.id]);

    const answerContent = mode === 'count-out' ? `Colored: ${numObjects}` : numObjects;

    return (
        <div className="flex justify-center items-center p-[25px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="text-2xl font-bold text-slate-700 mb-5 text-center font-sans">
                    {promptText}
                </div>
                
                <div className="relative w-[450px] h-[300px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    {positions.map((pos, i) => {
                        let extraElement: React.ReactNode = null;
                        let imgClass = 'w-10 h-10 transition-all duration-300';

                        if (mode === 'one-to-one') {
                            const isSol = isSolutionView;
                            extraElement = (
                                <div className={`absolute -bottom-[15px] bg-white border-[1.5px] rounded-full w-5 h-5 text-[0.8rem] font-bold flex justify-center items-center shadow-[0_2px_4px_rgba(0,0,0,0.05)] ${
                                    isSol ? 'bg-green-100 border-green-600 text-green-700' : 'border-slate-400 text-slate-400'
                                }`}>
                                    {isSol ? `${i + 1}` : ''}
                                </div>
                            );
                        } else if (mode === 'cardinality') {
                            const isFinal = isSolutionView && i === renderCount - 1;
                            extraElement = (
                                <div className={`absolute -top-3 bg-white/90 border rounded px-1 text-[0.75rem] font-bold text-slate-600 flex justify-center items-center ${
                                    isFinal 
                                        ? 'bg-yellow-100 border-yellow-600 text-yellow-800 text-[0.9rem] px-[6px] py-[2px] shadow-[0_0_8px_rgba(234,179,8,0.4)] z-10' 
                                        : 'border-slate-300'
                                }`}>
                                    {i + 1}
                                </div>
                            );
                        } else if (mode === 'count-out') {
                            const isColored = i < numObjects;
                            if (isColored && isSolutionView) {
                                imgClass += ' drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]';
                            } else {
                                imgClass += ' grayscale opacity-30';
                            }
                        }

                        return (
                            <div 
                                key={i}
                                className="absolute w-10 h-10 flex justify-center items-center"
                                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                            >
                                <img className={imgClass} src={`/icons/counting/${icon}`} alt="counting object" />
                                {extraElement}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center w-full mt-5">
                    <div className={`w-[150px] h-[55px] border-[2.5px] rounded-xl flex justify-center items-center text-[1.8rem] font-mono font-extrabold ${
                        isSolutionView 
                            ? 'text-green-600 border-green-600 bg-green-50' 
                            : 'text-slate-500 border-slate-500 bg-white'
                    }`}>
                        {isSolutionView ? answerContent : ''}
                    </div>
                </div>
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
        root.render(<CountingObjects payload={payload} />);
    }
};
