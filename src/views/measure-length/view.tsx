import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RenderPayload } from '../../types/ml-engine.ts';
import { MeasurementStandardProblem } from '../../types/problems.ts';
import { getRulerTicks, formatMeasureAnswer } from './helpers.ts';
import '../../tailwind.css';

interface Props {
    payload: RenderPayload;
}

export function MeasureLength({ payload }: Props) {
    const { problem, config, isSolutionView } = payload;
    const data = problem.data as MeasurementStandardProblem;
    const color = '#4682B4'; // SteelBlue

    const isReverse = config.visualParams.reverse === true || config.visualParams.reverse === 'true';
    const isDecimal = config.visualParams.decimal === true || config.visualParams.decimal === 'true';

    const showRectangle = !isReverse || isSolutionView;
    const showAnswerInBox = isReverse || isSolutionView;
    const isTextSolution = !isReverse && isSolutionView;

    const rectColor = isReverse ? 'forestgreen' : color;
    const { answer, unit } = useMemo(() => {
        return formatMeasureAnswer(data.problemLength, isDecimal);
    }, [data.problemLength, isDecimal]);

    const margin = 20;
    const bandWidth = data.bandLength * 30 + margin * 2;
    const rectWidth = data.problemLength * 30 + margin;
    const displayLength = data.problemLength * 30;

    const ticks = useMemo(() => {
        return getRulerTicks(data.bandLength, margin);
    }, [data.bandLength]);

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit">
            <div className="flex flex-col items-start gap-5">
                <div className="flex flex-col items-start">
                    {/* Measured Rectangle */}
                    {showRectangle ? (
                        <svg className="h-5 mb-[2px] overflow-visible" width={rectWidth} height="20">
                            <rect x={margin} y="0" width={displayLength} height="20" fill={rectColor} />
                        </svg>
                    ) : (
                        <div style={{ height: '22px', width: `${displayLength}px` }} />
                    )}

                    {/* Measure Band (Ruler) */}
                    <svg className="h-[50px] overflow-visible" width={bandWidth} height="50">
                        <rect x={margin} y="0" width={data.bandLength * 30} height="20" fill="#f0f0f0" stroke="black" strokeWidth="1" />
                        {ticks.map((tick, i) => (
                            <React.Fragment key={i}>
                                <line 
                                    x1={tick.x} 
                                    y1="0" 
                                    x2={tick.x} 
                                    y2={tick.y2} 
                                    stroke="black" 
                                    strokeWidth={tick.strokeWidth} 
                                />
                                {tick.value !== undefined && (
                                    <text 
                                        x={tick.x} 
                                        y="40" 
                                        textAnchor="middle" 
                                        fontSize="12" 
                                        fill="black"
                                    >
                                        {tick.value}
                                    </text>
                                )}
                            </React.Fragment>
                        ))}
                    </svg>
                </div>

                {/* Solution Box */}
                <div className={`border-2 border-neutral-800 rounded py-2.5 px-[15px] min-w-[80px] min-h-[50px] text-center font-mono flex items-center justify-center text-[1.5rem] relative mt-2.5 ${
                    isReverse ? 'border-dashed' : ''
                } ${
                    isTextSolution ? 'text-emerald-700 border-emerald-600 bg-emerald-50 font-bold' : ''
                }`}>
                    {showAnswerInBox ? answer : ''}
                    <span className="absolute right-[-40px] text-[1.2rem] font-bold text-slate-500">
                        {unit}
                    </span>
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
        root.render(<MeasureLength payload={payload} />);
    }
};
