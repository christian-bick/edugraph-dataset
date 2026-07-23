import { Scope } from 'edugraph-ts';
import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { generatePositions } from '../../../helpers/counting-helpers.ts';
import { CountingObjectsSimpleViewConfig, CountingObjectsSimpleViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: CountingObjectsSimpleViewConfig;
    payload: ViewRenderPayload<'counting-objects-simple'>;
}

const CountingObjectsSimpleCore = ({ config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const seed = payload.seed ?? 42;
    const data = problem.data;

    validateProblemData('counting-objects-simple', data, ['numObjects']);

    const { numObjects } = data;
    
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
        <div className="flex justify-center items-center p-[25px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit mx-auto font-sans">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-2xl font-bold text-slate-700 mb-5 text-center font-sans">
                        How many objects are there?
                    </div>
                )}
                
                <div className="relative w-[450px] h-[300px] bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    {positions.map((pos, i) => (
                        <div 
                            key={i}
                            className="absolute w-10 h-10 flex justify-center items-center"
                            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                        >
                            <img className="w-10 h-10 transition-all duration-300" src={`/icons/counting/${icon}`} alt="counting object" />
                        </div>
                    ))}
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

export const CountingObjectsSimple = withConfig(CountingObjectsSimpleViewSchema, CountingObjectsSimpleCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-objects-simple'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<CountingObjectsSimple payload={payload} />);
    }
};
