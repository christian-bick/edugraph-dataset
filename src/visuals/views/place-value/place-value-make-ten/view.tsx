import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import { PlaceValueMakeTenViewConfig, PlaceValueMakeTenViewSchema } from './spec.ts';
import { withConfig } from '../../withConfig.tsx';
import { validateProblemData } from '../../../helpers/validation.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueMakeTenViewConfig;
    payload: ViewRenderPayload<'place-value-make-ten'>;
}

function MakeTenFrame({givenNumber, revealMissing}: {givenNumber: number; revealMissing: boolean}) {
    return (
        <div className="grid grid-cols-5 grid-rows-2 gap-[3px] overflow-hidden rounded-md border-2 border-slate-600 bg-white">
            {Array.from({length: 10}).map((_, index) => {
                const isGiven = index < givenNumber;
                const isMissing = !isGiven && revealMissing;
                return (
                    <div key={index} className="flex h-8 w-8 items-center justify-center border-[0.5px] border-slate-100">
                        {isGiven && <div className="h-[22px] w-[22px] rounded-full bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_2px_4px_rgba(190,18,60,0.3)]" />}
                        {isMissing && <div className="h-[22px] w-[22px] rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_2px_4px_rgba(217,119,6,0.3)]" />}
                    </div>
                );
            })}
        </div>
    );
}

const PlaceValueMakeTenCore = ({ config: _config, payload }: CoreProps) => {
    const { problem, isSolutionView } = payload;
    const data = problem.data;
    validateProblemData('place-value-make-ten', data, ['givenNumber', 'missingNumber', 'target']);
    const { givenNumber, missingNumber } = data;

    const solClass = isSolutionView ? 'text-green-600 border-green-600 bg-green-50 font-bold' : 'text-slate-800 bg-white';
    const missingVal = isSolutionView ? missingNumber : '';

    return (
        <div className="flex justify-center items-center p-[30px] bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit">
            <div className="flex flex-col items-center w-[480px]">
                {!isSolutionView && (
                    <div className="text-[1.35rem] font-bold text-slate-700 mb-5 text-center font-sans">
                        How many more dots to make 10?
                    </div>
                )}
                
                <div className="mb-[25px] flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-slate-300 bg-slate-50 p-[15px]">
                    <MakeTenFrame givenNumber={givenNumber} revealMissing={isSolutionView} />
                    <div className="flex gap-4 text-[0.82rem] font-bold uppercase tracking-wide text-slate-500">
                        <span className="text-rose-600">Given</span>
                        {isSolutionView && <span className="text-amber-600">Added</span>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[2.2rem] font-extrabold text-slate-700">{givenNumber}</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">+</span>
                    <div className={`w-[60px] h-[60px] border-2 border-slate-600 rounded-lg flex justify-center items-center text-[2.2rem] font-mono ${solClass}`}>
                        {missingVal}
                    </div>
                    <span className="text-[2.2rem] font-extrabold text-slate-400">=</span>
                    <span className="text-[2.2rem] font-extrabold text-slate-700">10</span>
                </div>
            </div>
        </div>
    );
};

export const PlaceValueMakeTen = withConfig(PlaceValueMakeTenViewSchema, PlaceValueMakeTenCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'place-value-make-ten'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<PlaceValueMakeTen payload={payload} />);
    }
};
