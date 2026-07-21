import { createRoot } from 'react-dom/client';
import { ViewRenderPayload } from '../../../../types/ml-engine.ts';
import { TenFrame } from '../../../components/TenFrame.tsx';
import { PlaceValueDecomposeTeenViewConfig, PlaceValueDecomposeTeenViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueDecomposeTeenViewConfig;
    payload: ViewRenderPayload<'place-value-decompose-teen'>;
}

const PlaceValueDecomposeTeenCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('place-value-decompose-teen', data, ['ones', 'target']);
    const { ones, target } = data;

    const solClass = isSolutionView ? 'text-green-600 border-green-600 bg-green-50 font-bold' : 'text-slate-800 bg-white';
    const onesVal = isSolutionView ? ones : '';

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-[1.35rem] font-bold text-slate-700 mb-5 text-center font-sans">
                        Decompose the teen number.
                    </div>
                )}
                
                <div className="flex gap-[20px] bg-slate-50 p-[15px] border-[1.5px] border-dashed border-slate-300 rounded-xl mb-[25px]">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="text-[0.85rem] font-bold text-slate-400 uppercase">10 ones</div>
                        <TenFrame filledCount={10} colorClass="color-a" />
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="text-[0.85rem] font-bold text-slate-400 uppercase">{ones} ones</div>
                        <TenFrame filledCount={ones} colorClass="color-b" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[2.2rem] font-extrabold text-slate-700">{target}</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">=</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-700">10</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">+</span>
                    <div className={`w-[60px] h-[60px] border-2 border-slate-600 rounded-lg flex justify-center items-center text-[2.2rem] font-mono ${solClass}`}>
                        {onesVal}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PlaceValueDecomposeTeen = withConfig(PlaceValueDecomposeTeenViewSchema, PlaceValueDecomposeTeenCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'place-value-decompose-teen'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<PlaceValueDecomposeTeen payload={payload} />);
    }
};
