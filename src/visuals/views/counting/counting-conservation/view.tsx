import {createRoot} from 'react-dom/client';
import {useMemo} from 'react';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingConservationViewConfig, CountingConservationViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData} from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: CountingConservationViewConfig;
    payload: ViewRenderPayload<'counting-conservation'>;
}

const CountingConservationCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const seed = payload.seed;
    const data = problem.data;

    validateProblemData('counting-conservation', data, ['numObjects']);

    const number = data.numObjects;

    const icon = useMemo(() => {
        return ICONS[seed % ICONS.length];
    }, [seed]);

    const btnAClass = "flex-1 py-3 px-2 border-2 border-slate-200 rounded-lg text-center font-semibold text-slate-600 text-[0.95rem] bg-white";
    const btnBClass = "flex-1 py-3 px-2 border-2 border-slate-200 rounded-lg text-center font-semibold text-slate-600 text-[0.95rem] bg-white";
    
    const sameBtnClass = `flex-1 py-3 px-2 border-2 rounded-lg text-center font-semibold text-[0.95rem] ${
        isSolutionView 
            ? 'border-green-600 bg-green-50 text-green-700 shadow-[0_0_10px_rgba(22,163,74,0.2)] font-bold' 
            : 'border-slate-200 bg-white text-slate-600'
    }`;

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[800px]">
                {!isSolutionView && (
                    <div className="text-[1.3rem] font-bold text-slate-700 mb-[25px] text-center leading-relaxed font-sans">
                        Are there more items in Group A, Group B, or are they the same?
                    </div>
                )}
                
                <div className="w-full flex flex-col gap-[25px] bg-slate-50 p-5 rounded-xl border-[1.5px] border-slate-200 mb-[25px] overflow-hidden">
                    <div className="flex items-center min-h-[50px]">
                        <span className="text-[1.1rem] font-bold text-slate-600 w-[90px] shrink-0">Group A:</span>
                        <div className="flex-grow flex flex-wrap justify-center gap-[4px] py-2">
                            {Array.from({ length: number }).map((_, i) => (
                                <img 
                                    key={i} 
                                    src={`/icons/counting/${icon}`} 
                                    className="w-[35px] h-[35px]" 
                                    alt="object A" 
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center min-h-[50px]">
                        <span className="text-[1.1rem] font-bold text-slate-600 w-[90px] shrink-0">Group B:</span>
                        <div className="flex-grow flex flex-wrap justify-center gap-[24px] py-2">
                            {Array.from({ length: number }).map((_, i) => (
                                <img 
                                    key={i} 
                                    src={`/icons/counting/${icon}`} 
                                    className="w-[35px] h-[35px]" 
                                    alt="object B" 
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 w-full">
                    <div className={btnAClass}>Group A has more</div>
                    <div className={btnBClass}>Group B has more</div>
                    <div className={sameBtnClass}>They are the same</div>
                </div>
            </div>
        </div>
    );
};

export const CountingConservation = withConfig(CountingConservationViewSchema, CountingConservationCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-conservation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<CountingConservation payload={payload} />);
    }
};
