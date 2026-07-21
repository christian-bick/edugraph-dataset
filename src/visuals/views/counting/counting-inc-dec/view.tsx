import {createRoot} from 'react-dom/client';
import {useMemo} from 'react';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {CountingIncDecViewConfig, CountingIncDecViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';
import {validateProblemData} from '../../../helpers/validation.ts';
import '../../../tailwind.css';

const ICONS = ['circle.svg', 'square.svg', 'triangle.svg', 'star.svg', 'pentagon.svg', 'hexagon.svg', 'heart.svg', 'diamond.svg'];

interface CoreProps {
    config: CountingIncDecViewConfig;
    payload: ViewRenderPayload<'counting-inc-dec'>;
}

const CountingIncDecCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;

    validateProblemData('counting-inc-dec', data, ['numObjects', 'incDecType', 'incDecAnswer']);

    const icon = useMemo(() => {
        const iconIndex = Array.from(problem.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % ICONS.length;
        return ICONS[iconIndex];
    }, [problem.id]);

    const isInc = data.incDecType === 'inc';
    const isDec = data.incDecType === 'dec';
    const hasArrow = isInc || isDec;
    const arrowClass = isInc 
        ? 'w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[25px] border-b-neutral-800 absolute' 
        : 'w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-neutral-800 absolute';

    const answer = hasArrow ? data.incDecAnswer : data.simpleAnswer;

    return (
        <div className="flex justify-center items-center p-5 bg-white w-fit max-w-[600px]">
            <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap justify-start gap-2.5 mb-2.5">
                    {Array.from({ length: data.numObjects }).map((_, i) => (
                        <img 
                            key={i} 
                            src={`/icons/counting/${icon}`} 
                            alt="counting object" 
                            className="w-[50px] h-[50px]"
                        />
                    ))}
                </div>
                
                <div className="flex flex-row items-center ml-5 gap-[15px]">
                    {hasArrow && (
                        <div className="flex flex-col items-center relative w-[30px] h-[25px]">
                            <div className={arrowClass}></div>
                            <span className={`absolute text-white text-[14px] font-mono font-bold z-10 left-1/2 -translate-x-1/2 ${
                                isInc ? 'bottom-0' : 'top-0'
                            }`}>
                                1
                            </span>
                        </div>
                    )}
                    
                    <div className={`w-[3em] min-w-[3em] h-[2.5em] border-2 border-neutral-800 rounded flex justify-center items-center text-2xl font-mono ${
                        isSolutionView ? 'text-emerald-700 border-emerald-600 bg-emerald-50 font-bold' : ''
                    }`}>
                        {isSolutionView ? answer : ''}
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
