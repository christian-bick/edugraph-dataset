import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {PlaceValueScalingPlace, PlaceValueScalingProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {displayPlaceName, isValidPlaceValueScalingProblem, PLACE_NAMES} from './helpers.ts';
import {PlaceValueScalingViewConfig, PlaceValueScalingViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: PlaceValueScalingViewConfig;
    payload: ViewRenderPayload<'place-value-scaling'>;
}

const VIEW_ID = 'place-value-scaling';
const numberFormatter = new Intl.NumberFormat('en-US');

function PlaceCard({place, digit, tone, showValue}: {
    place: PlaceValueScalingPlace;
    digit: number;
    tone: 'indigo' | 'amber';
    showValue: boolean;
}) {
    const colors = tone === 'indigo'
        ? 'border-indigo-300 bg-indigo-50 text-indigo-950'
        : 'border-amber-300 bg-amber-50 text-amber-950';
    const labelColor = tone === 'indigo' ? 'text-indigo-700' : 'text-amber-700';
    return (
        <div className={`rounded-xl border-2 px-5 py-4 text-center ${colors}`}>
            <div className={`text-xs font-bold uppercase tracking-wide ${labelColor}`}>{displayPlaceName(place.name)} place</div>
            <div className="mt-1 font-mono text-3xl font-extrabold">{digit}</div>
            <div className="mt-2 text-sm font-semibold">has a value of</div>
            <div className="mt-1 font-mono text-2xl font-extrabold">{showValue ? numberFormatter.format(place.value) : '?'}</div>
        </div>
    );
}

function DigitStrip({data}: {data: PlaceValueScalingProblem}) {
    return (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">Six-digit numeral</div>
            <div className="mt-3 flex justify-center gap-2">
                {data.digits.map((digit, index) => {
                    const isLeft = index === data.leftPlace.digitIndex;
                    const isRight = index === data.rightPlace.digitIndex;
                    const colors = isLeft
                        ? 'border-indigo-500 bg-indigo-100 text-indigo-950'
                        : isRight
                            ? 'border-amber-500 bg-amber-100 text-amber-950'
                            : 'border-slate-200 bg-white text-slate-800';
                    return (
                        <div className="w-[104px] text-center" key={index}>
                            <div className={`flex h-16 items-center justify-center rounded-xl border-2 font-mono text-3xl font-extrabold ${colors}`}>{digit}</div>
                            <div className="mt-2 text-[11px] font-semibold leading-tight text-slate-500">{displayPlaceName(PLACE_NAMES[index])}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const PlaceValueScalingCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'task',
        'number',
        'digits',
        'repeatedDigit',
        'leftPlace',
        'rightPlace',
        'scaleFactor',
        'prompt',
        'questionMultiplicationEquation',
        'questionDivisionEquation',
        'multiplicationEquation',
        'divisionEquation',
        'comparisonStatement',
        'answer'
    ]);
    if (!isValidPlaceValueScalingProblem(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected one coherent factor-ten relationship between equal digits in adjacent places.');
    }

    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Adjacent place-value scaling</div>
            <div className="mt-2 text-center text-xl font-bold leading-relaxed text-slate-800">{data.prompt}</div>
            <div className="mt-2 text-center font-mono text-sm font-semibold text-slate-500">Number: {numberFormatter.format(data.number)}</div>

            <DigitStrip data={data} />

            <div className="mt-5 grid grid-cols-[1fr_96px_1fr] items-center gap-3">
                <PlaceCard place={data.leftPlace} digit={data.repeatedDigit} tone="indigo" showValue={isSolutionView} />
                <div className="text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Scale factor</div>
                    <div className={`mt-2 rounded-xl border-2 px-2 py-3 font-mono text-2xl font-extrabold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-dashed border-slate-300 bg-white text-slate-500'}`}>
                        {data.scaleFactor}
                    </div>
                </div>
                <PlaceCard place={data.rightPlace} digit={data.repeatedDigit} tone="amber" showValue={true} />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Multiplication and division equations</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-indigo-200 bg-white px-3 py-3 font-mono text-xl font-extrabold text-indigo-950">
                        {isSolutionView ? data.multiplicationEquation : data.questionMultiplicationEquation}
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-white px-3 py-3 font-mono text-xl font-extrabold text-amber-950">
                        {isSolutionView ? data.divisionEquation : data.questionDivisionEquation}
                    </div>
                </div>
            </div>

            {isSolutionView ? (
                <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-center text-lg font-bold text-emerald-950">{data.comparisonStatement}</div>
            ) : (
                <div className="mt-4 rounded-xl border-2 border-dashed border-emerald-300 bg-white px-5 py-4 text-center text-lg font-bold text-emerald-700">The higher-place value is __________.</div>
            )}
        </div>
    );
};

export const PlaceValueScaling = withConfig(PlaceValueScalingViewSchema, PlaceValueScalingCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'place-value-scaling'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<PlaceValueScaling payload={payload} />);
    }
};
