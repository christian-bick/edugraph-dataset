import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../types/ml-engine.ts';
import { getAdditionLayout, getSubtractionLayout } from './helpers.ts';
import '../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface Props {
    payload: ViewRenderPayload<'operations-representation'>;
}

export function OperationsRepresentation({ payload }: Props) {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    const mode = data.mode || 'representation';
    let operation = data.operation || 'addition';
    
    // Fallback if operation is not present but operator is
    if (!data.operation && (data as any).operator) {
        operation = (data as any).operator === 'subtract' ? 'subtraction' : 'addition';
    }

    const num1 = data.num1 !== undefined ? data.num1 : 5;
    const num2 = data.num2 !== undefined ? data.num2 : 3;
    const answer = data.answer !== undefined ? data.answer : (operation === 'addition' ? num1 + num2 : num1 - num2);
    const textScenario = data.textScenario || '';

    const icon = useMemo(() => {
        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        return ICONS[iconIndex];
    }, [problem.id]);

    const isAddition = operation === 'addition';
    const sign = isAddition ? '+' : '−';

    const renderObjects = () => {
        const spacing = 45;
        if (isAddition) {
            const { startX } = getAdditionLayout(num1, num2, spacing);
            const list: React.ReactNode[] = [];

            // num1 objects (color A)
            for (let i = 0; i < num1; i++) {
                const x = startX + i * spacing - 17.5;
                list.push(
                    <div 
                        key={`a-${i}`} 
                        className="absolute w-[35px] h-[35px] flex justify-center items-center"
                        style={{ left: `${x}px`, top: '35px' }}
                    >
                        <img 
                            src={`/icons/counting/${icon}`} 
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(244,63,94,0.2)) drop-shadow(0 1px 2px rgba(244,63,94,0.1))' }} 
                            alt="addend 1" 
                            className="w-[35px] h-[35px]"
                        />
                    </div>
                );
            }

            // num2 objects (color B)
            for (let i = 0; i < num2; i++) {
                const x = startX + (num1 + i) * spacing - 17.5;
                list.push(
                    <div 
                        key={`b-${i}`} 
                        className="absolute w-[35px] h-[35px] flex justify-center items-center"
                        style={{ left: `${x}px`, top: '35px' }}
                    >
                        <img 
                            src={`/icons/counting/${icon}`} 
                            style={{ filter: 'sepia(1) saturate(5) hue-rotate(10deg) drop-shadow(0 2px 4px rgba(234,179,8,0.3))' }} 
                            alt="addend 2" 
                            className="w-[35px] h-[35px]"
                        />
                    </div>
                );
            }

            return list;
        } else {
            // subtraction
            const { startX } = getSubtractionLayout(num1, spacing);
            const list: React.ReactNode[] = [];

            for (let i = 0; i < num1; i++) {
                const x = startX + i * spacing - 17.5;
                const isSubtracted = i >= (num1 - num2);
                list.push(
                    <div 
                        key={`sub-${i}`} 
                        className="absolute w-[35px] h-[35px] flex justify-center items-center"
                        style={{ left: `${x}px`, top: '35px' }}
                    >
                        <img 
                            src={`/icons/counting/${icon}`} 
                            style={{ 
                                filter: isSubtracted 
                                    ? 'grayscale(100%) opacity(30%)' 
                                    : 'drop-shadow(0 2px 4px rgba(244,63,94,0.2)) drop-shadow(0 1px 2px rgba(244,63,94,0.1))' 
                            }} 
                            alt="minuend item" 
                            className="w-[35px] h-[35px]"
                        />
                        {isSubtracted && (
                            <svg className="absolute w-[35px] h-[35px] top-0 left-0 z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" viewBox="0 0 40 40">
                                <line x1="6" y1="6" x2="34" y2="34" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"/>
                                <line x1="34" y1="6" x2="6" y2="34" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"/>
                            </svg>
                        )}
                    </div>
                );
            }

            return list;
        }
    };

    const boxContent1 = isSolutionView ? num1 : '';
    const boxContent2 = isSolutionView ? num2 : '';
    const boxContentAnswer = isSolutionView ? answer : '';

    const getInputClass = (isFinal = false) => {
        let cls = "w-[60px] h-[60px] border-2 border-slate-500 rounded-lg flex justify-center items-center text-[2rem] font-mono bg-white ";
        if (isSolutionView) {
            cls += "text-green-600 border-green-600 bg-green-50 font-bold ";
        } else {
            cls += "text-slate-800 ";
        }
        if (isFinal) {
            cls += "border-[3px]";
        }
        return cls;
    };

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                {mode === 'word-problem' && (
                    <div className="text-xl font-bold text-slate-700 mb-5 text-center leading-relaxed bg-slate-50 p-[15px] rounded-lg border-l-4 border-sky-500 w-full box-border font-sans">
                        {textScenario}
                    </div>
                )}
                
                <div className="relative w-[450px] h-[110px] bg-slate-50 border-2 border-slate-200 rounded-xl mb-[25px]">
                    {renderObjects()}
                </div>

                <div className="flex items-center gap-3">
                    <div className={getInputClass()}>{boxContent1}</div>
                    <div className="text-[2rem] font-extrabold text-slate-500">{sign}</div>
                    <div className={getInputClass()}>{boxContent2}</div>
                    <div className="text-[2rem] font-extrabold text-slate-500">=</div>
                    <div className={getInputClass(true)}>{boxContentAnswer}</div>
                </div>
            </div>
        </div>
    );
}

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-representation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<OperationsRepresentation payload={payload} />);
    }
};
