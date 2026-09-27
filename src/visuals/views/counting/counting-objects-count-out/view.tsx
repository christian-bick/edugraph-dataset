import { Scope } from 'edugraph-ts';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { generatePositions } from '../../../helpers/counting-helpers.ts';
import { CountingObjectsCountOutViewConfig, CountingObjectsCountOutViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData, ViewValidationError } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: CountingObjectsCountOutViewConfig;
    payload: ViewRenderPayload<'counting-objects-count-out'>;
}

export const CountingObjectsCountOutCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const seed = payload.seed;
    const data = problem.data;

    validateProblemData('counting-objects-count-out', data, ['numObjects', 'availableCount']);

    const { numObjects, availableCount } = data;

    if (!Number.isInteger(numObjects) || numObjects < 1) {
        throw new ViewValidationError('counting-objects-count-out', 'The requested count must be a positive integer.');
    }
    if (!Number.isInteger(availableCount) || availableCount < numObjects) {
        throw new ViewValidationError('counting-objects-count-out', 'The available count must be an integer at least as large as the requested count.');
    }

    let arrangement: 'line' | 'circle' | 'scattered';
    if (config.arrangement === Scope.LinearArrangement) arrangement = 'line';
    else if (config.arrangement === Scope.CircularArrangement) arrangement = 'circle';
    else if (config.arrangement === Scope.ScatteredArrangement) arrangement = 'scattered';
    else throw new ViewValidationError('counting-objects-count-out', 'Unsupported object arrangement.');

    const icon = useMemo(() => {
        return ICONS[seed % ICONS.length];
    }, [seed]);

    const positions = useMemo(() => {
        return generatePositions(availableCount, arrangement, seed);
    }, [availableCount, arrangement, seed]);

    const solClass = isSolutionView 
        ? 'text-green-600 border-green-600 bg-green-50' 
        : 'text-slate-500 border-slate-500 bg-white';

    const answerContent = `Colored: ${numObjects}`;

    return (
        <div className="flex justify-center items-center p-[25px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                <div className="min-h-8 text-2xl font-bold text-slate-700 mb-5 text-center font-sans">
                    {!isSolutionView && <>Color exactly {numObjects} {numObjects === 1 ? 'object' : 'objects'}.</>}
                </div>
                
                <div className="relative w-[450px] h-[300px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    {positions.map((pos, i) => {
                        const isColored = i < numObjects;
                        let imgClass = 'w-8 h-8 transition-all duration-300';
                        if (isColored && isSolutionView) {
                            imgClass += ' drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]';
                        } else {
                            imgClass += ' grayscale opacity-30';
                        }

                        return (
                            <div 
                                key={i}
                                className="absolute w-8 h-8 flex justify-center items-center"
                                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                            >
                                <img className={imgClass} src={`/icons/counting/${icon}`} alt="counting object" />
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center w-full mt-5">
                    <div className={`w-[200px] h-[55px] border-[2.5px] rounded-xl flex justify-center items-center text-[1.5rem] font-mono font-extrabold ${solClass}`}>
                        {isSolutionView ? answerContent : ''}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const CountingObjectsCountOut = withConfig(CountingObjectsCountOutViewSchema, CountingObjectsCountOutCore);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'counting-objects-count-out'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) {
                root = createRoot(container);
            }
            root.render(<CountingObjectsCountOut payload={payload} />);
        }
    };
}
