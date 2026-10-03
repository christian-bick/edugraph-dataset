import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {WholePowerTenScaleStep} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {assertPowerTenPower, placeName, PowerTenSymbol} from '../power-ten-presentation.tsx';
import {NumbersPowerTenZeroPatternExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-power-ten-zero-pattern-explanation';
const whole = new Intl.NumberFormat('en-US');

function assertStep(step: WholePowerTenScaleStep): void {
    assertPowerTenPower(VIEW_ID, step?.power);
    if (!Number.isSafeInteger(step.original) || step.original < 0 || step.product !== step.original * step.power.value) {
        throw new ViewValidationError(VIEW_ID, 'Whole-number product must match its power of ten.');
    }
    if (step.original === 0) {
        if (step.zeroPattern?.kind !== 'zero' || step.zeroPattern.originalTrailingZeros !== null || step.zeroPattern.productTrailingZeros !== null) {
            throw new ViewValidationError(VIEW_ID, 'Zero must use the special zero-pattern witness.');
        }
    } else if (step.zeroPattern?.kind !== 'positive' || step.zeroPattern.productTrailingZeros !== step.zeroPattern.originalTrailingZeros + step.power.exponent) {
        throw new ViewValidationError(VIEW_ID, 'Positive zero-pattern counts must preserve existing zeros.');
    }
    if (!Array.isArray(step.placeShifts) || step.placeShifts.length === 0) {
        throw new ViewValidationError(VIEW_ID, 'Digit-place evidence is missing.');
    }
    for (const shift of step.placeShifts) {
        if (
            !Number.isInteger(shift.digit) || shift.digit < 0 || shift.digit > 9 ||
            shift.productPlaceExponent !== shift.originalPlaceExponent + step.power.exponent ||
            shift.originalContribution !== shift.digit * 10 ** shift.originalPlaceExponent ||
            shift.productContribution !== shift.digit * 10 ** shift.productPlaceExponent
        ) {
            throw new ViewValidationError(VIEW_ID, 'Digit-place contributions must follow the power-of-ten shift.');
        }
    }
}

function EquationRow({step, showReason}: {step: WholePowerTenScaleStep; showReason: boolean}) {
    const pattern = step.zeroPattern;
    return <div className="grid grid-cols-[118px_1fr] items-center gap-3 border-b border-slate-200 py-3 last:border-b-0">
        <div className="text-center font-mono text-xl font-black text-indigo-800"><PowerTenSymbol exponent={step.power.exponent} /></div>
        <div>
            <div className="font-mono text-xl font-bold text-slate-900">{whole.format(step.original)} × {whole.format(step.power.value)} = {whole.format(step.product)}</div>
            <div className="mt-1 text-sm font-medium text-slate-600"><PowerTenSymbol exponent={step.power.exponent} /> = {step.power.repeatedFactors.length > 1 && <>{step.power.repeatedFactors.join(' × ')} = </>}{step.power.value}</div>
            {showReason && <div className="mt-1 text-sm font-medium text-slate-600">
                {pattern.kind === 'positive'
                    ? `${pattern.originalTrailingZeros} ending zero${pattern.originalTrailingZeros === 1 ? '' : 's'} already; ${pattern.introducedTrailingZeros} introduced; ${pattern.productTrailingZeros} total.`
                    : 'Zero stays zero; a trailing-zero count is not defined for 0.'}
            </div>}
        </div>
    </div>;
}

function PlaceShiftEvidence({step}: {step: WholePowerTenScaleStep}) {
    return <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="text-sm font-bold text-indigo-950">Digit place values in the <PowerTenSymbol exponent={step.power.exponent} /> row</div>
        <div className="mt-2 grid gap-1 text-sm text-indigo-950">
            {step.placeShifts.map((shift, index) => <div key={index} className="flex flex-wrap items-center gap-x-2">
                <strong>Digit {shift.digit}:</strong>
                <span>{placeName(shift.originalPlaceExponent)} ({whole.format(shift.originalContribution)})</span>
                <span aria-hidden="true">→</span>
                <span>{placeName(shift.productPlaceExponent)} ({whole.format(shift.productContribution)})</span>
            </div>)}
        </div>
    </div>;
}

export const NumbersPowerTenZeroPatternExplanationCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'primarySeries', 'existingZeroWitness', 'zeroWitness']);
    if (data.kind !== 'whole-number-power-ten-scaling' || data.primarySeries.length !== 3 || data.primarySeries.some((step, n) => step.power?.exponent !== n)) {
        throw new ViewValidationError(VIEW_ID, 'Expected one whole-number series for powers 0, 1, and 2.');
    }
    data.primarySeries.forEach(assertStep);
    assertStep(data.existingZeroWitness);
    assertStep(data.zeroWitness);
    if (data.primarySeries.some(step => step.original !== data.primarySeries[0].original) ||
        data.existingZeroWitness.zeroPattern.kind !== 'positive' ||
        data.existingZeroWitness.zeroPattern.originalTrailingZeros < 1 ||
        data.zeroWitness.zeroPattern.kind !== 'zero') {
        throw new ViewValidationError(VIEW_ID, 'The extra examples must show an existing ending zero and zero itself.');
    }
    const explanationStep = data.primarySeries[2];
    const isSolution = payload.isSolutionView;

    return <main className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800 shadow-sm" style={{width: 850, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Whole numbers · powers of ten</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Explain the ending-zero pattern</h1>
        <p className="mt-2 text-base leading-relaxed">Study the products. Why do their digits and ending zeros change? Explain what happens when the starting number already ends in zero and when it is 0.</p>
        <div className="mt-5 rounded-xl border border-slate-200 px-5">
            {data.primarySeries.map(step => <EquationRow key={step.power.exponent} step={step} showReason={isSolution} />)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-800">Already ends in zero</div>
                <EquationRow step={data.existingZeroWitness} showReason={isSolution} />
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2">
                <div className="text-xs font-bold uppercase tracking-wide text-sky-800">Starting at zero</div>
                <EquationRow step={data.zeroWitness} showReason={isSolution} />
            </div>
        </div>
        <PlaceShiftEvidence step={explanationStep} />
        {isSolution ? <>
            <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4 text-base leading-relaxed text-emerald-950">
                Multiplying by <PowerTenSymbol exponent={explanationStep.power.exponent} /> shifts each digit {explanationStep.power.exponent} places left, making its value {explanationStep.power.value} times as large. A positive whole number gains {explanationStep.power.exponent} ending zeros in addition to any it already had. Multiplying by <PowerTenSymbol exponent={0} /> changes nothing because its value is 1. Zero remains 0, so it has no finite ending-zero count.
            </div>
        </> : <div className="mt-4 min-h-24 rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 text-slate-500">Write your place-value explanation here.</div>}
    </main>;
};

export const NumbersPowerTenZeroPatternExplanation = withConfig(
    NumbersPowerTenZeroPatternExplanationViewSchema,
    NumbersPowerTenZeroPatternExplanationCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersPowerTenZeroPatternExplanation payload={payload} />);
    }
};
