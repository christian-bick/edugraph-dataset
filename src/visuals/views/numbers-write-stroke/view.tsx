import {useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {getTracingPaths} from './helpers.ts';
import { NumbersWriteStrokeViewConfig, NumbersWriteStrokeViewSchema } from './spec.ts';
import { withConfig } from '../withConfig.tsx';
import '../../../tailwind.css';

interface CoreProps {
    config: NumbersWriteStrokeViewConfig;
    payload: ViewRenderPayload<'numbers-write-stroke'>;
}

function DigitSVG({ digit, isSingle }: { digit: string; isSingle: boolean }) {
    const width = isSingle ? 60 : 30;
    const height = 60;
    const fontSize = isSingle ? 50 : 35;
    const yPos = isSingle ? 48 : 42;
    const xPos = width / 2;

    const paths = useMemo(() => {
        return getTracingPaths(digit, xPos, yPos);
    }, [digit, xPos, yPos]);

    return (
        <svg className="overflow-visible" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <text 
                x={xPos} 
                y={yPos} 
                textAnchor="middle" 
                fontSize={fontSize} 
                fontFamily="'Roboto Mono', monospace" 
                fontWeight="bold" 
                fill="none" 
                stroke="#cbd5e1" 
                strokeWidth="2" 
                strokeDasharray="3 3"
            >
                {digit}
            </text>
            {paths.map((p, index) => (
                <path key={index} d={p} stroke="#4f46e5" strokeWidth="1.5" fill="none" />
            ))}
        </svg>
    );
}

function TracingHelper({ number }: { number: number }) {
    const digits = String(number).split('');

    if (digits.length === 1) {
        return <DigitSVG digit={digits[0]} isSingle={true} />;
    }

    return (
        <div className="flex justify-center items-center w-full h-full">
            <DigitSVG digit={digits[0]} isSingle={false} />
            <DigitSVG digit={digits[1]} isSingle={false} />
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

const NumbersWriteStrokeCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    const number = data.number;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex items-center gap-[30px] flex-wrap font-sans">
                <DoubleTenFrame number={number} />
                <div className="text-[3.5rem] font-extrabold text-slate-800 min-w-[80px] text-center">
                    {number}
                </div>
                <div className="flex gap-3">
                    {/* Box 1: Tracing Guide */}
                    <div className="border-2 border-slate-200 rounded-lg w-[70px] h-[70px] flex justify-center items-center bg-slate-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
                        <TracingHelper number={number} />
                    </div>
                    {/* Box 2 & 3: Interactive/Response Boxes */}
                    {Array.from({ length: 2 }).map((_, idx) => {
                        let content = String(number);
                        let cls = 'border-2 border-slate-500 rounded-lg w-[70px] h-[70px] flex justify-center items-center text-[2.2rem] font-mono bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden';
                        
                        if (isSolutionView) {
                            cls += ' text-green-600 border-green-600 bg-green-50 font-bold';
                        } else {
                            cls += ' text-slate-300 font-normal border-dashed';
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
};

export const NumbersWriteStroke = withConfig(NumbersWriteStrokeViewSchema, NumbersWriteStrokeCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-write-stroke'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<NumbersWriteStroke payload={payload} />);
    }
};
