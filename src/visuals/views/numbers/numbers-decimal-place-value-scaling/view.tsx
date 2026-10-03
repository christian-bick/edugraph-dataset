import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalAdjacentPlaceScalingProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    displayNumeral,
    formatThousandths,
    PLACE_NAMES,
    UNITS_IN_THOUSANDTHS,
    validDecimalPlaceScaling
} from './helpers.ts';
import type {NumbersDecimalPlaceValueScalingViewConfig} from './spec.ts';
import {NumbersDecimalPlaceValueScalingViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-place-value-scaling';

interface CoreProps {
    config: NumbersDecimalPlaceValueScalingViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

function PlaceChart({data}: {data: DecimalAdjacentPlaceScalingProblem}) {
    return <div className="mt-5 overflow-hidden rounded-2xl border-2 border-slate-300">
        <div className="grid grid-cols-6 bg-slate-100 text-center text-xs font-extrabold uppercase tracking-wide text-slate-600">
            {PLACE_NAMES.map((name, index) => <div key={name} className={`border-r border-slate-300 px-2 py-3 last:border-r-0 ${index === 3 ? 'border-l-4 border-l-slate-600' : ''}`}>
                {name}
            </div>)}
        </div>
        <div className="grid grid-cols-6 text-center">
            {data.digits.map((digit, index) => {
                const higher = index === data.higherPlace.digitIndex;
                const lower = index === data.lowerPlace.digitIndex;
                const tone = higher ? 'bg-indigo-100 text-indigo-950' : lower ? 'bg-amber-100 text-amber-950' : 'bg-white text-slate-800';
                return <div key={index} className={`border-r border-t border-slate-300 px-2 py-4 last:border-r-0 ${index === 3 ? 'border-l-4 border-l-slate-600' : ''} ${tone}`}>
                    <div className="font-mono text-3xl font-black">{digit}</div>
                    <div className="mt-2 text-xs font-semibold">Unit {formatThousandths(UNITS_IN_THOUSANDTHS[index]!)}</div>
                    {(higher || lower) && <div className="mt-2 font-mono text-sm font-extrabold">
                        Value {formatThousandths(digit * UNITS_IN_THOUSANDTHS[index]!)}
                    </div>}
                </div>;
            })}
        </div>
    </div>;
}

function ValueCard({name, value, tone}: {name: string; value: string; tone: 'indigo' | 'amber'}) {
    const colors = tone === 'indigo' ? 'border-indigo-300 bg-indigo-50 text-indigo-950' : 'border-amber-300 bg-amber-50 text-amber-950';
    return <div className={`rounded-xl border-2 px-4 py-3 text-center ${colors}`}>
        <div className="text-sm font-semibold">{name} digit value</div>
        <div className="mt-1 font-mono text-2xl font-black">{value}</div>
    </div>;
}

export const NumbersDecimalPlaceValueScalingCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'kind', 'digits', 'numberInThousandths', 'repeatedDigit', 'higherPlace', 'lowerPlace', 'scale'
    ]);
    if (!validDecimalPlaceScaling(data)) {
        throw new ViewValidationError(VIEW_ID, 'The adjacent decimal-place values and inverse ratios must be exact.');
    }

    const higher = formatThousandths(data.higherPlace.digitValueInThousandths);
    const lower = formatThousandths(data.lowerPlace.digitValueInThousandths);
    const higherName = data.higherPlace.name;
    const lowerName = data.lowerPlace.name;

    return <main className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800 shadow-sm" style={{width: 900, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Base-ten place values</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Compare the value of the same digit</h1>
        <p className="mt-3 text-lg leading-relaxed">The numeral is <strong className="font-mono">{displayNumeral(data)}</strong>. Use the highlighted {data.repeatedDigit}s in adjacent places to complete both scale relationships.</p>
        <PlaceChart data={data} />
        <div className="mt-5 grid grid-cols-2 gap-4">
            <ValueCard name={`Higher ${higherName}-place`} value={higher} tone="indigo" />
            <ValueCard name={`Lower ${lowerName}-place`} value={lower} tone="amber" />
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="text-sm font-bold text-slate-700">Complete the relationship in both directions</div>
            <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-lg font-bold">
                <div className={`rounded-lg border-2 px-3 py-4 text-center ${isSolutionView ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-900'}`}>
                    {higher} = {isSolutionView ? '10' : '___'} × {lower}
                </div>
                <div className={`rounded-lg border-2 px-3 py-4 text-center ${isSolutionView ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-900'}`}>
                    {lower} = {higher} ÷ {isSolutionView ? '10' : '___'} = {isSolutionView ? '(1/10)' : '( ___ )'} × {higher}
                </div>
            </div>
        </div>
        {isSolutionView && <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-base font-semibold text-emerald-950">
            One place to the left makes the digit value 10 times as large; one place to the right makes it one tenth as large.
        </div>}
    </main>;
};

export const NumbersDecimalPlaceValueScaling = withConfig(NumbersDecimalPlaceValueScalingViewSchema, NumbersDecimalPlaceValueScalingCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersDecimalPlaceValueScaling payload={payload} />);
};
