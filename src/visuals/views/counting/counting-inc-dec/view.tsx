import {createRoot} from 'react-dom/client';
import {useMemo} from 'react';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingIncDecViewConfig, CountingIncDecViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {Scope} from 'edugraph-ts';
import '../../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: CountingIncDecViewConfig;
    payload: ViewRenderPayload<'counting-inc-dec'>;
}

const CountingIncDecCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const seed = payload.seed;
    const data = problem.data;

    validateProblemData('counting-inc-dec', data, ['numObjects', 'incDecType', 'stepSize', 'incDecAnswer']);

    if (data.stepSize !== 1 && data.stepSize !== 10) {
        throw new ViewValidationError('counting-inc-dec', 'Step size must be 1 or 10.');
    }
    if (data.incDecType !== 'inc' && data.incDecType !== 'dec') {
        throw new ViewValidationError('counting-inc-dec', 'Direction must be increment or decrement.');
    }
    if (!Number.isInteger(data.numObjects) || data.numObjects < 1 || !Number.isInteger(data.incDecAnswer)) {
        throw new ViewValidationError('counting-inc-dec', 'Starting value and answer must be positive integers.');
    }
    const expectedAnswer = data.incDecType === 'inc'
        ? data.numObjects + data.stepSize
        : data.numObjects - data.stepSize;
    if (data.incDecAnswer !== expectedAnswer || data.incDecAnswer < 1) {
        throw new ViewValidationError('counting-inc-dec', 'Answer does not match the declared direction and step.');
    }
    if (config.representation !== Scope.PhysicalNumbers && config.representation !== Scope.ArabicNumerals) {
        throw new ViewValidationError('counting-inc-dec', 'Unsupported number representation.');
    }

    const icon = useMemo(() => {
        return ICONS[seed % ICONS.length];
    }, [seed]);

    const isInc = data.incDecType === 'inc';
    const arrowClass = isInc 
        ? 'w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[25px] border-b-neutral-800 absolute' 
        : 'w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-neutral-800 absolute';

    const usesObjects = config.representation === Scope.PhysicalNumbers && data.stepSize === 1;
    if (usesObjects && data.numObjects > 20) {
        throw new ViewValidationError('counting-inc-dec', 'Physical object collections support values through 20.');
    }

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit max-w-[600px]">
            <div className="flex justify-between items-center w-full">
                {usesObjects ? (
                    <div className="flex flex-wrap justify-start gap-2.5 mb-2.5 max-w-[420px]">
                        {Array.from({ length: data.numObjects }).map((_, i) => (
                            <img
                                key={i}
                                src={`/icons/counting/${icon}`}
                                alt="counting object"
                                className="w-[50px] h-[50px]"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="min-w-[100px] h-[70px] px-4 border-2 border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center text-3xl font-mono font-bold text-slate-800">
                        {data.numObjects}
                    </div>
                )}
                
                <div className="flex flex-row items-center ml-5 gap-[15px]">
                    <div className="flex flex-col items-center relative w-[36px] h-[30px]">
                        <div className={arrowClass}></div>
                        <span className={`absolute text-white text-[12px] font-mono font-bold z-10 left-1/2 -translate-x-1/2 ${
                            isInc ? 'bottom-0' : 'top-0'
                        }`}>
                            {data.stepSize}
                        </span>
                    </div>
                    
                    <div className={`w-[3em] min-w-[3em] h-[2.5em] border-2 border-neutral-800 rounded flex justify-center items-center text-2xl font-mono ${
                        isSolutionView ? 'text-emerald-700 border-emerald-600 bg-emerald-50 font-bold' : ''
                    }`}>
                        {isSolutionView ? data.incDecAnswer : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CountingIncDec = withConfig(CountingIncDecViewSchema, CountingIncDecCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-inc-dec'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<CountingIncDec payload={payload} />);
    }
};
