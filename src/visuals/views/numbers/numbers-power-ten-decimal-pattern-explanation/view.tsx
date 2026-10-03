import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalPowerTenScaleStep, DecimalPowerTenScalingProblem, PowerTenDecimalValue} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {assertPowerTenPower, placeName, PowerTenSymbol} from '../power-ten-presentation.tsx';
import {NumbersPowerTenDecimalPatternExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-power-ten-decimal-pattern-explanation';

function validDecimal(value: PowerTenDecimalValue): boolean {
    if (
        !Number.isSafeInteger(value?.unscaled) || value.unscaled < 0 ||
        !Number.isInteger(value.scale) || value.scale < 0 || value.scale > 12 ||
        typeof value.numeral !== 'string'
    ) return false;
    const match = /^(\d+)(?:\.(\d+))?$/.exec(value.numeral);
    if (!match) return false;
    const fractional = match[2] ?? '';
    return BigInt(match[1] + fractional) * 10n ** BigInt(value.scale) ===
        BigInt(value.unscaled) * 10n ** BigInt(fractional.length);
}

function exactScale(before: PowerTenDecimalValue, after: PowerTenDecimalValue, factor: number, operation: DecimalPowerTenScalingProblem['operation']): boolean {
    const left = BigInt(after.unscaled) * 10n ** BigInt(before.scale);
    const right = BigInt(before.unscaled) * 10n ** BigInt(after.scale);
    return operation === 'multiplication' ? left === right * BigInt(factor) : left * BigInt(factor) === right;
}

function exactDigitContribution(value: PowerTenDecimalValue, digit: number, exponent: number): boolean {
    const left = BigInt(value.unscaled) * 10n ** BigInt(Math.max(-exponent, 0));
    const right = BigInt(digit) * 10n ** BigInt(value.scale + Math.max(exponent, 0));
    return left === right;
}

function assertStep(step: DecimalPowerTenScaleStep, operation: DecimalPowerTenScalingProblem['operation']): void {
    assertPowerTenPower(VIEW_ID, step?.power);
    if (!validDecimal(step.before) || !validDecimal(step.after)) {
        throw new ViewValidationError(VIEW_ID, 'Exact decimal values and numerals are required.');
    }
    if (!exactScale(step.before, step.after, step.power.value, operation)) {
        throw new ViewValidationError(VIEW_ID, 'Decimal result must agree with the selected operation.');
    }
    if (!Array.isArray(step.placeShifts) || step.placeShifts.length === 0) {
        throw new ViewValidationError(VIEW_ID, 'Digit-place shifts are required.');
    }
    const signedShift = operation === 'multiplication' ? step.power.exponent : -step.power.exponent;
    for (const shift of step.placeShifts) {
        if (
            !Number.isInteger(shift.digit) || shift.digit < 1 || shift.digit > 9 ||
            shift.resultPlaceExponent !== shift.originalPlaceExponent + signedShift ||
            !validDecimal(shift.originalContribution) || !validDecimal(shift.resultContribution)
        ) {
            throw new ViewValidationError(VIEW_ID, 'Digit-place mapping does not agree with the operation.');
        }
        if (!exactDigitContribution(shift.originalContribution, shift.digit, shift.originalPlaceExponent) ||
            !exactDigitContribution(shift.resultContribution, shift.digit, shift.resultPlaceExponent)) {
            throw new ViewValidationError(VIEW_ID, 'Digit contributions must agree exactly with their places.');
        }
    }
    const crosses = step.placeShifts.some(shift => (shift.originalPlaceExponent < 0) !== (shift.resultPlaceExponent < 0));
    if (step.crossesUnitsPlace !== crosses) {
        throw new ViewValidationError(VIEW_ID, 'The units-place crossing must match the digit shifts.');
    }
}

function EquationRow({step, operation}: {
    step: DecimalPowerTenScaleStep;
    operation: DecimalPowerTenScalingProblem['operation'];
}) {
    const symbol = operation === 'multiplication' ? '×' : '÷';
    return <div className="grid grid-cols-[112px_1fr] items-center gap-3 border-b border-slate-200 py-3 last:border-b-0">
        <div className="text-center font-mono text-xl font-black text-violet-800"><PowerTenSymbol exponent={step.power.exponent} /></div>
        <div>
            <div className="font-mono text-xl font-bold text-slate-950">{step.before.numeral} {symbol} {step.power.value} = {step.after.numeral}</div>
            <div className="mt-1 text-sm font-medium text-slate-600"><PowerTenSymbol exponent={step.power.exponent} /> = {step.power.repeatedFactors.length > 1 && <>{step.power.repeatedFactors.join(' × ')} = </>}{step.power.value}</div>
        </div>
    </div>;
}

function ShiftChart({step}: {step: DecimalPowerTenScaleStep}) {
    return <div className="mt-4 overflow-hidden rounded-xl border border-violet-200">
        <div className="bg-violet-50 px-4 py-3 text-sm font-bold text-violet-950">Digit values in the <PowerTenSymbol exponent={step.power.exponent} /> row</div>
        <div className="grid grid-cols-[70px_1fr_32px_1fr] border-b border-violet-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            <div>Digit</div><div>Before</div><div></div><div>After</div>
        </div>
        {step.placeShifts.map((shift, index) => {
            const crossesBoundary = (shift.originalPlaceExponent < 0) !== (shift.resultPlaceExponent < 0);
            return <div key={index} className={`grid grid-cols-[70px_1fr_32px_1fr] items-center border-b border-slate-100 px-4 py-2 text-sm last:border-b-0 ${crossesBoundary ? 'bg-amber-50' : 'bg-white'}`}>
                <div className="font-mono text-lg font-bold">{shift.digit}</div>
                <div>{placeName(shift.originalPlaceExponent)} <strong className="font-mono">{shift.originalContribution.numeral}</strong></div>
                <div aria-hidden="true">→</div>
                <div>{placeName(shift.resultPlaceExponent)} <strong className="font-mono">{shift.resultContribution.numeral}</strong></div>
            </div>;
        })}
    </div>;
}

export const NumbersPowerTenDecimalPatternExplanationCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'operation', 'series']);
    if (
        data.kind !== 'decimal-power-ten-scaling' ||
        (data.operation !== 'multiplication' && data.operation !== 'division') ||
        data.series.length !== 3 ||
        data.series.some((step, n) => step.power?.exponent !== n)
    ) {
        throw new ViewValidationError(VIEW_ID, 'Expected one selected decimal operation across powers 0, 1, and 2.');
    }
    data.series.forEach(step => assertStep(step, data.operation));
    if (data.series.some(step => !exactScale(data.series[0].before, step.before, 1, 'multiplication')) || !data.series.some(step => step.crossesUnitsPlace)) {
        throw new ViewValidationError(VIEW_ID, 'The series needs one starting decimal and a units-place crossing.');
    }
    const operationWord = data.operation === 'multiplication' ? 'multiplication' : 'division';
    const direction = data.operation === 'multiplication' ? 'left' : 'right';
    const selectedStep = data.series.find(step => step.crossesUnitsPlace)!;
    const isSolution = payload.isSolutionView;

    return <main className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800 shadow-sm" style={{width: 850, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Decimals · powers of ten</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Explain the {operationWord} pattern</h1>
        <p className="mt-2 text-base leading-relaxed">The same decimal is {data.operation === 'multiplication' ? 'multiplied' : 'divided'} by three powers of ten. Why do its digit values and answers change as shown? Explain using place values.</p>
        <div className="mt-5 rounded-xl border border-slate-200 px-5">
            {data.series.map(step => <EquationRow key={step.power.exponent} step={step} operation={data.operation} />)}
        </div>
        <ShiftChart step={selectedStep} />
        {isSolution ? <>
            <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4 text-base leading-relaxed text-emerald-950">
                <PowerTenSymbol exponent={0} /> equals 1, so the first row is unchanged. {data.operation === 'multiplication' ? 'Multiplying' : 'Dividing'} by <PowerTenSymbol exponent={selectedStep.power.exponent} /> moves each nonzero digit {selectedStep.power.exponent} place{selectedStep.power.exponent === 1 ? '' : 's'} {direction} in the place-value system. The highlighted crossing from a fractional place to a whole place, or the reverse, follows the same rule.
            </div>
        </> : <div className="mt-4 min-h-24 rounded-xl border-2 border-dashed border-slate-300 px-5 py-4 text-slate-500">Write your place-value explanation here.</div>}
    </main>;
};

export const NumbersPowerTenDecimalPatternExplanation = withConfig(
    NumbersPowerTenDecimalPatternExplanationViewSchema,
    NumbersPowerTenDecimalPatternExplanationCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersPowerTenDecimalPatternExplanation payload={payload} />);
    }
};
