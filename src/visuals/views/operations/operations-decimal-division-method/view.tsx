import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalDivisionGroupingBar, DecimalDivisionProblem, DecimalDivisionStep} from '../../../../types/problems.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {assertDecimalDivision} from '../decimal-division-method-helpers.ts';
import {OperationsDecimalDivisionMethodViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-decimal-division-method';

function Cells({capacity, filled, tone}: {capacity: number; filled: number; tone: 'indigo' | 'sky' | 'emerald'}) {
    const filledColor = tone === 'indigo' ? 'border-indigo-600 bg-indigo-300'
        : tone === 'sky' ? 'border-sky-600 bg-sky-300'
            : 'border-emerald-600 bg-emerald-300';
    return <div className="flex flex-wrap gap-[3px]" aria-label={`${filled} filled of ${capacity} hundredth-unit cells`}>
        {Array.from({length: capacity}, (_, index) => <span key={index}
            className={`inline-block size-3 shrink-0 rounded-[2px] border ${index < filled ? filledColor : 'border-slate-300 bg-white'}`} />)}
    </div>;
}

function GroupBar({bar}: {bar: DecimalDivisionGroupingBar}) {
    return <div className="rounded-xl border border-emerald-200 bg-white px-3 py-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
            <div className="text-sm font-bold text-emerald-950">{bar.kind === 'full' ? `Full group ${bar.index + 1}` : 'Partial group'}</div>
            <div className="text-xs font-semibold text-emerald-800">{bar.filledCells} of {bar.capacityCells} cells</div>
        </div>
        <Cells capacity={bar.capacityCells} filled={bar.filledCells} tone="emerald" />
        <div className="mt-2 text-xs font-semibold text-emerald-900">
            {bar.kind === 'full' ? '1 whole group' : `${bar.filledCells}/${bar.capacityCells} of one group`}
        </div>
    </div>;
}

function TraceTable({data, isSolution}: {data: DecimalDivisionProblem; isSolution: boolean}) {
    const places = ['ones', 'tenths', 'hundredths', 'thousandths', 'ten-thousandths'] as const;
    const rows: readonly {place: string; step: DecimalDivisionStep | null}[] = isSolution
        ? data.divisionTrace.steps.map(step => ({place: step.place, step}))
        : places.map(place => ({place, step: null}));
    const Blank = () => <span className="mx-auto block h-7 w-14 rounded-md border-2 border-dashed border-slate-300 bg-white" />;
    return <div className="overflow-hidden rounded-xl border border-indigo-200 bg-white">
        <div className="grid grid-cols-[150px_1fr_1fr_1fr_1fr] bg-indigo-100 text-center text-xs font-bold uppercase tracking-wide text-indigo-900">
            <div className="px-2 py-3">Quotient place</div><div className="px-2 py-3">Amount to divide</div>
            <div className="px-2 py-3">Digit</div><div className="px-2 py-3">Subtract</div><div className="px-2 py-3">Left</div>
        </div>
        {rows.map(({place, step}) => <div key={place}
            className="grid grid-cols-[150px_1fr_1fr_1fr_1fr] items-center border-t border-indigo-100 text-center text-sm font-semibold text-slate-900">
            <div className="px-2 py-3 text-indigo-800">{place}</div>
            <div className="px-2 py-3 font-mono">{step ? step.partialDividend : <Blank />}</div>
            <div className={`px-2 py-3 font-mono text-lg font-black ${step && step.quotientDigit === 0 ? 'text-amber-700' : 'text-slate-950'}`}>
                {step ? step.quotientDigit : <Blank />}
            </div>
            <div className="px-2 py-3 font-mono">{step ? `${data.divisor.valueInHundredths} × ${step.quotientDigit} = ${step.subtrahend}` : <Blank />}</div>
            <div className="px-2 py-3 font-mono">{step ? step.remainder : <Blank />}</div>
        </div>)}
    </div>;
}

function strategyText(data: DecimalDivisionProblem): string {
    const {fullGroupCount, remainderCells, cellsPerGroup} = data.grouping;
    const groupText = `${fullGroupCount} full ${fullGroupCount === 1 ? 'group' : 'groups'}`;
    const partialText = remainderCells > 0
        ? ` and ${remainderCells} of ${cellsPerGroup} cells in a partial group`
        : ' and no partial group';
    const decimalStep = remainderCells > 0
        ? `The ${remainderCells}/${cellsPerGroup} partial group gives the fractional quotient. ` +
            `At each next decimal place, multiply the remainder by 10 and divide by ${cellsPerGroup} to find the next digit, including any zero digit.`
        : 'No cells remain after the full groups, so the quotient is a whole number.';
    return `${data.dividend.valueInHundredths} hundredth cells make ${groupText}${partialText}. ` +
        `Each full bar uses ${cellsPerGroup} cells, the divisor. ${decimalStep} The ordered trace gives ${data.quotient.canonicalNumeral} groups exactly. ` +
        `Multiplying ${data.divisor.canonicalNumeral} by ${data.quotient.canonicalNumeral} reconstructs ${data.dividend.canonicalNumeral}.`;
}

export const OperationsDecimalDivisionMethodCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'base', 'operandScale', 'quotientScale', 'dividend', 'divisor',
        'quotient', 'grouping', 'divisionTrace', 'inverse'
    ]);
    assertDecimalDivision(VIEW_ID, data);
    const isSolution = payload.isSolutionView;
    return <main className="w-[920px] max-w-[96vw] rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Divide decimals by grouping hundredths</div>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Group, calculate, and explain</h1>
        <p className="mt-1 text-sm">Use divisor-sized groups of 0.01 cells. Complete the quotient trace and explain how the groups give the answer.</p>
        <div className="mx-auto mt-4 flex w-fit items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 font-mono text-3xl font-black text-slate-950">
            <span>{data.dividend.canonicalNumeral}</span><span>÷</span><span>{data.divisor.canonicalNumeral}</span><span>=</span>
            <span className={`flex min-h-11 min-w-24 items-center justify-center rounded-lg border-2 px-2 ${isSolution ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-400 bg-white'}`}>
                {isSolution ? data.quotient.canonicalNumeral : ''}
            </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <div className="text-sm font-bold text-indigo-950">Dividend pool · {data.dividend.canonicalNumeral}</div>
                <div className="mt-1 text-xs font-semibold text-indigo-800">{data.dividend.valueInHundredths} cells, each worth 0.01</div>
                <div className="mt-3 grid w-fit grid-cols-10 gap-[3px]">
                    {Array.from({length: data.dividend.valueInHundredths}, (_, index) => <span key={index} className="size-3 rounded-[2px] border border-indigo-600 bg-indigo-300" />)}
                </div>
                {data.dividend.valueInHundredths === 0 && <div className="mt-3 text-sm text-indigo-800">No cells</div>}
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                <div className="text-sm font-bold text-sky-950">One divisor-sized group · {data.divisor.canonicalNumeral}</div>
                <div className="mt-1 text-xs font-semibold text-sky-800">{data.divisor.valueInHundredths} cells make one group</div>
                <div className="mt-3"><Cells capacity={data.divisor.valueInHundredths} filled={data.divisor.valueInHundredths} tone="sky" /></div>
            </div>
        </div>
        <div className={`mt-4 rounded-xl border-2 p-4 ${isSolution ? 'border-emerald-300 bg-emerald-50/50' : 'border-dashed border-slate-300 bg-white'}`}>
            <div className="text-sm font-bold text-slate-800">Group the dividend cells</div>
            {isSolution
                ? <div className="mt-3 grid grid-cols-2 gap-3">
                    {data.grouping.bars.map(bar => <GroupBar key={bar.index} bar={bar} />)}
                    {data.grouping.bars.length === 0 && <div className="text-sm text-slate-600">There are no cells to group.</div>}
                </div>
                : <div className="mt-3 flex min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">Draw full divisor-sized groups and any partial group here.</div>}
        </div>
        <div className="mt-4">
            <div className="mb-2 text-sm font-bold text-indigo-950">Ordered quotient trace</div>
            <TraceTable data={data} isSolution={isSolution} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
            <div className={`rounded-xl border-2 px-4 py-3 ${isSolution ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Multiply to check</div>
                {isSolution
                    ? <div className="mt-2 font-mono text-lg font-bold text-emerald-950">{data.divisor.canonicalNumeral} × {data.quotient.canonicalNumeral} = {data.dividend.canonicalNumeral}</div>
                    : <div className="mt-3 h-11 rounded-lg border border-dashed border-slate-300" />}
            </div>
            <div className={`rounded-xl border-2 px-4 py-3 ${isSolution ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Written strategy</div>
                {isSolution
                    ? <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">{strategyText(data)}</p>
                    : <><p className="mt-2 text-sm text-slate-500">Explain how the groups and quotient digits account for every dividend cell.</p><div className="mt-5 space-y-5"><div className="border-b border-slate-300" /><div className="border-b border-slate-300" /></div></>}
            </div>
        </div>
    </main>;
};

export const OperationsDecimalDivisionMethod = withConfig(
    OperationsDecimalDivisionMethodViewSchema,
    OperationsDecimalDivisionMethodCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsDecimalDivisionMethod payload={payload} />);
    }
};
