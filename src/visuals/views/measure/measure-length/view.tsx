import React, {useMemo} from 'react';
import {formatMeasureAnswer, getRulerTicks} from './helpers.ts';
import {MeasureLengthViewConfig, MeasureLengthViewSchema} from './_spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureLengthViewConfig;
    payload: any;
}

export const MeasureLengthCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    validateProblemData('measure-length', data, ['bandLength', 'problemLength']);
    if (data.bandLength > 1000) {
        throw new ViewValidationError('measure-length', `bandLength ${data.bandLength} is too large to render.`);
    }
    if (data.problemLength > data.bandLength) {
        throw new ViewValidationError('measure-length', `problemLength ${data.problemLength} is greater than bandLength ${data.bandLength}.`);
    }

    const color = '#4682B4'; // SteelBlue

    const isReverse = config.isReverse;
    
    const bandLength = data.bandLength;
    const problemLength = data.problemLength;

    const isDecimal = data.useDecimals !== undefined 
        ? data.useDecimals 
        : (data.problemLength % 1 !== 0);

    const showRectangle = !isReverse || isSolutionView;
    const showAnswerInBox = isReverse || isSolutionView;
    const isTextSolution = !isReverse && isSolutionView;

    const rectColor = isReverse ? 'forestgreen' : color;
    const { answer, unit } = useMemo(() => {
        return formatMeasureAnswer(problemLength, isDecimal);
    }, [problemLength, isDecimal]);

    let pxPerUnit = 30;
    if (bandLength > 50) {
        pxPerUnit = 7;
    } else if (bandLength > 20) {
        pxPerUnit = 12;
    } else if (bandLength > 12) {
        pxPerUnit = 20;
    }

    const margin = 20;
    const bandWidth = bandLength * pxPerUnit + margin * 2;
    const rectWidth = problemLength * pxPerUnit + margin;
    const displayLength = problemLength * pxPerUnit;

    const ticks = useMemo(() => {
        return getRulerTicks(bandLength, margin, pxPerUnit);
    }, [bandLength, pxPerUnit]);

    return (
        <div className="flex justify-center items-center p-5 bg-white w-full">
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
                        <rect x={margin} y="0" width={data.bandLength * pxPerUnit} height="20" fill="#f0f0f0" stroke="black" strokeWidth="1" />
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
};

export const MeasureLength = withConfig(MeasureLengthViewSchema, MeasureLengthCore);
