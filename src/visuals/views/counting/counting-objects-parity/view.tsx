import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {CountingObjectsParityViewConfig, CountingObjectsParityViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: CountingObjectsParityViewConfig;
    payload: ViewRenderPayload<'counting-objects-parity'>;
}

function ObjectDot({color}: {color: string}) {
    return <div className={`size-10 rounded-full border-2 border-white shadow-sm ${color}`} />;
}

const colors = ['bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-amber-500'];

const CountingObjectsParityCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView, seed} = payload;
    const data = problem.data;
    validateProblemData('counting-objects-parity', data, ['numObjects', 'parity']);

    if (!Number.isInteger(data.numObjects) || data.numObjects < 1 || data.numObjects > 20) {
        throw new ViewValidationError('counting-objects-parity', 'Parity groups require 1 through 20 objects.');
    }
    if (data.parity !== 'even' && data.parity !== 'odd') {
        throw new ViewValidationError('counting-objects-parity', 'A parity classification is required.');
    }
    const actualParity = data.numObjects % 2 === 0 ? 'even' : 'odd';
    if (data.parity !== actualParity) {
        throw new ViewValidationError('counting-objects-parity', 'The parity label does not match the object count.');
    }

    const pairCount = Math.floor(data.numObjects / 2);
    const hasRemainder = data.numObjects % 2 === 1;
    const color = colors[seed % colors.length];

    return (
        <div className="w-[640px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Odd or even?</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">
                    Pair every object. Does one remain without a partner?
                </div>
            </div>

            <div className="mt-6 flex min-h-[230px] flex-wrap content-center justify-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
                {Array.from({length: pairCount}, (_, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 rounded-full border-2 border-slate-300 bg-white p-2"
                        aria-label={`pair ${index + 1}`}
                    >
                        <ObjectDot color={color} />
                        <ObjectDot color={color} />
                    </div>
                ))}
                {hasRemainder && (
                    <div className="flex items-center rounded-full border-2 border-dashed border-amber-500 bg-amber-50 p-2" aria-label="unpaired object">
                        <ObjectDot color={color} />
                    </div>
                )}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-5 py-4">
                <div className="text-base font-semibold text-slate-600">
                    {pairCount} complete {pairCount === 1 ? 'pair' : 'pairs'}
                    {hasRemainder ? ' and 1 unpaired object' : ' and no unpaired objects'}
                </div>
                <div className={`flex h-12 w-28 items-center justify-center rounded-lg border-2 text-lg font-extrabold uppercase tracking-wide ${
                    isSolutionView
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-dashed border-slate-400 bg-white text-slate-400'
                }`}>
                    {isSolutionView ? data.parity : '?'}
                </div>
            </div>
        </div>
    );
};

export const CountingObjectsParity = withConfig(CountingObjectsParityViewSchema, CountingObjectsParityCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'counting-objects-parity'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<CountingObjectsParity payload={payload} />);
    }
};
