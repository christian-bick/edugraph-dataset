import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { generatePositions } from '../../../helpers/counting-helpers.ts';
import { CountingObjectsCardinalityViewConfig, CountingObjectsCardinalityViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { Scope } from 'edugraph-ts';
import { validateProblemData } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: CountingObjectsCardinalityViewConfig;
    payload: ViewRenderPayload<'counting-objects-cardinality'>;
}

const CountingObjectsCardinalityCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const seed = payload.seed ?? 42;

    validateProblemData('counting-objects-cardinality', problem.data, ['numObjects']);

    const { numObjects } = problem.data;

    let arrangement: 'line' | 'circle' | 'scattered' | 'array' = 'scattered';
    if (config.arrangement === Scope.LinearArrangement) arrangement = 'line';
    else if (config.arrangement === Scope.CircularArrangement) arrangement = 'circle';
    else if (config.arrangement === Scope.ScatteredArrangement) arrangement = 'scattered';

    const icon = useMemo(() => {
        return ICONS[seed % ICONS.length];
    }, [seed]);

    const positions = useMemo(() => {
        return generatePositions(numObjects, arrangement, seed);
    }, [numObjects, arrangement, seed]);

    const solClass = isSolutionView 
        ? 'text-green-600 border-green-600 bg-green-50' 
        : 'text-slate-500 border-slate-500 bg-white';

    return (
        <div className="flex justify-center items-center p-[25px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-2xl font-bold text-slate-700 mb-5 text-center font-sans">
                        Count the objects. What is the total number?
                    </div>
                )}
                
                <div className="relative w-[450px] h-[300px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    {positions.map((pos, i) => {
                        const isFinal = isSolutionView && i === numObjects - 1;
                        return (
                            <div 
                                key={i}
                                className="absolute w-8 h-8 flex justify-center items-center"
                                style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                            >
                                <img className="w-8 h-8 transition-all duration-300" src={`/icons/counting/${icon}`} alt="counting object" />
                                <div className={`absolute -top-2 bg-white/90 border rounded px-1 text-[0.75rem] font-bold text-slate-600 flex justify-center items-center ${
                                    isFinal 
                                        ? 'bg-yellow-100 border-yellow-600 text-yellow-800 text-[0.9rem] px-[6px] py-[2px] shadow-[0_0_8px_rgba(234,179,8,0.4)] z-10' 
                                        : 'border-slate-300'
                                }`}>
                                    {i + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center w-full mt-5">
                    <div className={`w-[150px] h-[55px] border-[2.5px] rounded-xl flex justify-center items-center text-[1.8rem] font-mono font-extrabold ${solClass}`}>
                        {isSolutionView ? numObjects : ''}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CountingObjectsCardinality = withConfig(CountingObjectsCardinalityViewSchema, CountingObjectsCardinalityCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-objects-cardinality'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<CountingObjectsCardinality payload={payload} />);
    }
};
