import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {
    DecimalAddSubtractModelStep,
    DecimalAddSubtractNumber,
    DecimalAddSubtractPlace,
    DecimalAddSubtractProblem,
    DecimalAddSubtractUnitCounts
} from '../../../../types/problems.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    assertDecimalAddSubtract,
    numberUnitCounts,
    operationSymbol
} from '../decimal-add-subtract-method-helpers.ts';
import {OperationsDecimalAdditionSubtractionMethodViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-decimal-addition-subtraction-method';
const CELL = 6;
type Tone = 'indigo' | 'sky' | 'emerald' | 'amber';
const PALETTE: Record<Tone, {fill: string; stroke: string}> = {
    indigo: {fill: '#c7d2fe', stroke: '#4f46e5'},
    sky: {fill: '#bae6fd', stroke: '#0284c7'},
    emerald: {fill: '#a7f3d0', stroke: '#059669'},
    amber: {fill: '#fde68a', stroke: '#d97706'}
};

function unitName(place: DecimalAddSubtractPlace, count: number): string {
    if (place === 'ones') return count === 1 ? 'whole' : 'ones';
    return count === 1 ? place.slice(0, -1) : place;
}

function Piece({place, tone}: {place: DecimalAddSubtractPlace; tone: Tone}) {
    const {fill, stroke} = PALETTE[tone];
    if (place === 'hundredths') {
        return <svg width={CELL} height={CELL} viewBox="0 0 6 6" aria-label="one hundredth piece">
            <rect x="0.5" y="0.5" width="5" height="5" fill={fill} stroke={stroke} />
        </svg>;
    }
    if (place === 'tenths') {
        return <svg width={CELL} height={CELL * 10} viewBox="0 0 6 60" aria-label="one tenth rod">
            <rect x="0.5" y="0.5" width="5" height="59" fill={fill} stroke={stroke} />
            {Array.from({length: 9}, (_, index) => <line key={index} x1="0" x2="6" y1={(index + 1) * CELL} y2={(index + 1) * CELL} stroke={stroke} strokeWidth="0.5" />)}
        </svg>;
    }
    return <svg width={CELL * 10} height={CELL * 10} viewBox="0 0 60 60" aria-label="one whole square">
        <rect x="0.5" y="0.5" width="59" height="59" fill={fill} stroke={stroke} />
        {Array.from({length: 9}, (_, index) => <g key={index} stroke={stroke} strokeWidth="0.5">
            <line x1={(index + 1) * CELL} x2={(index + 1) * CELL} y1="0" y2="60" />
            <line x1="0" x2="60" y1={(index + 1) * CELL} y2={(index + 1) * CELL} />
        </g>)}
    </svg>;
}

function Pieces({place, count, tone}: {place: DecimalAddSubtractPlace; count: number; tone: Tone}) {
    if (count === 0) return <span className="text-sm font-medium text-slate-400">0 pieces</span>;
    return <div className="flex flex-wrap content-start items-start gap-[3px]">
        {Array.from({length: count}, (_, index) => <Piece key={index} place={place} tone={tone} />)}
    </div>;
}

function UnitBoard({counts, title, tone}: {counts: DecimalAddSubtractUnitCounts; title: string; tone: Tone}) {
    const columns: readonly {place: DecimalAddSubtractPlace; count: number}[] = [
        {place: 'ones', count: counts.ones},
        {place: 'tenths', count: counts.tenths},
        {place: 'hundredths', count: counts.hundredths}
    ];
    return <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 text-center text-sm font-bold text-slate-800">{title}</div>
        <div className="grid grid-cols-[196px_80px_80px] justify-center gap-2">
            {columns.map(({place, count}) => <div key={place} className="min-w-0 rounded-lg bg-slate-50 px-1 py-2">
                <div className="mb-2 text-center text-xs font-bold text-slate-600">{count} {unitName(place, count)}</div>
                <Pieces place={place} count={count} tone={tone} />
            </div>)}
        </div>
    </div>;
}

function CountsText({counts}: {counts: DecimalAddSubtractUnitCounts}) {
    return <>{counts.ones} {unitName('ones', counts.ones)}, {counts.tenths} {unitName('tenths', counts.tenths)}, {counts.hundredths} {unitName('hundredths', counts.hundredths)}</>;
}

function ExchangeCard({step, index}: {
    step: Extract<DecimalAddSubtractModelStep, {kind: 'compose-ten' | 'decompose-one'}>;
    index: number;
}) {
    const lower = step.lowerPlace;
    const higher: DecimalAddSubtractPlace = lower === 'hundredths' ? 'tenths' : 'ones';
    const compose = step.kind === 'compose-ten';
    const leftPlace = compose ? lower : higher;
    const rightPlace = compose ? higher : lower;
    const leftCount = compose ? 10 : 1;
    const rightCount = compose ? 1 : 10;
    return <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-3">
        <div className="text-xs font-bold uppercase tracking-wide text-amber-800">Exchange {index + 1}</div>
        <div className="mt-1 text-xs font-semibold text-amber-950">Before: <CountsText counts={step.before} /></div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg bg-white p-2 text-center">
            <div>
                <div className="flex min-h-[64px] items-center justify-center"><Pieces place={leftPlace} count={leftCount} tone="amber" /></div>
                <div className="text-xs font-bold">{leftCount} {unitName(leftPlace, leftCount)}</div>
            </div>
            <div className="text-2xl font-bold text-amber-700">→</div>
            <div>
                <div className="flex min-h-[64px] items-center justify-center"><Pieces place={rightPlace} count={rightCount} tone="amber" /></div>
                <div className="text-xs font-bold">{rightCount} {unitName(rightPlace, rightCount)}</div>
            </div>
        </div>
        <div className="mt-2 text-xs font-semibold text-amber-950">After: <CountsText counts={step.after} /></div>
    </div>;
}

function WrittenCalculation({data, isSolution}: {data: DecimalAddSubtractProblem; isSolution: boolean}) {
    const columns = [...data.columns].reverse();
    const digitCells = (value: DecimalAddSubtractNumber, hidden: boolean) => {
        const [ones, tenths, hundredths] = value.alignedDigits;
        const cell = (digit: number, index: number) => <span key={index} className={hidden
            ? `mx-auto flex size-10 items-center justify-center rounded-lg border-2 ${isSolution ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-400 bg-white'}`
            : ''}>{hidden && !isSolution ? '' : digit}</span>;
        return <>{cell(ones, 0)}<span className="text-2xl font-black">.</span>{cell(tenths, 1)}{cell(hundredths, 2)}</>;
    };
    return <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="text-sm font-bold text-indigo-950">Aligned written calculation</div>
        <div className="mx-auto mt-2 grid w-fit grid-cols-[66px_54px_16px_54px_66px] items-center gap-y-1 text-center font-mono text-2xl font-bold text-slate-900">
            <span /><span className="font-sans text-xs font-bold text-slate-600">ones</span><span /><span className="font-sans text-xs font-bold text-slate-600">tenths</span><span className="font-sans text-xs font-bold text-slate-600">hundredths</span>
            <span className="font-sans text-xs text-slate-600">Trade</span>
            <span className="h-7 text-sm font-bold text-amber-800">{isSolution && columns[0].regroupIn ? data.operation === 'addition' ? '+1' : '−1' : ''}</span>
            <span />
            <span className="h-7 text-sm font-bold text-amber-800">{isSolution && columns[1].regroupIn ? data.operation === 'addition' ? '+1' : '−1' : ''}</span>
            <span className="h-7 text-sm font-bold text-amber-800">{isSolution && columns[2].regroupIn ? data.operation === 'addition' ? '+1' : '−1' : ''}</span>
            <span />{digitCells(data.first, false)}
            <span>{operationSymbol(data.operation)}</span>{digitCells(data.second, false)}
            <span className="col-span-5 border-t-2 border-slate-700" />
            <span>=</span>{digitCells(data.result, true)}
        </div>
        {isSolution && <div className="mt-2 text-center text-xs font-semibold text-indigo-800">
            {data.operation === 'addition' ? '+1 marks a carry into that place.' : '−1 marks a unit borrowed from that place.'}
        </div>}
    </div>;
}

function strategyText(data: DecimalAddSubtractProblem): string {
    const exchanges = data.model.steps.filter((step): step is Extract<DecimalAddSubtractModelStep, {kind: 'compose-ten' | 'decompose-one'}> =>
        step.kind === 'compose-ten' || step.kind === 'decompose-one');
    const first = data.operation === 'addition' ? 'Join the operand pieces.' : 'Start with the first operand pieces.';
    const trades = exchanges.map(step => {
        const lower = step.lowerPlace;
        const higher = lower === 'hundredths' ? 'tenth' : 'whole';
        return step.kind === 'compose-ten'
            ? `Exchange 10 ${lower} for 1 ${higher}.`
            : `Exchange 1 ${higher} for 10 ${lower}.`;
    }).join(' ');
    const ending = data.operation === 'addition' ? 'The combined pieces' : 'After removing the second operand, the pieces';
    const {ones, tenths, hundredths} = data.model.final;
    return `${first} ${trades || 'No exchange is needed.'} ${ending} show ${ones} ${unitName('ones', ones)}, ${tenths} ${unitName('tenths', tenths)}, and ${hundredths} ${unitName('hundredths', hundredths)}, matching ${data.result.canonicalNumeral}.`;
}

export const OperationsDecimalAdditionSubtractionMethodCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'base', 'scale', 'operation', 'first', 'second', 'result', 'columns', 'model']);
    assertDecimalAddSubtract(VIEW_ID, data);
    const isSolution = payload.isSolutionView;
    const exchangeSteps = data.model.steps.filter((step): step is Extract<DecimalAddSubtractModelStep, {kind: 'compose-ten' | 'decompose-one'}> =>
        step.kind === 'compose-ten' || step.kind === 'decompose-one');
    const actionStep = data.operation === 'addition' ? data.model.steps[0] : data.model.steps[data.model.steps.length - 1];

    return <main className="w-[916px] max-w-[96vw] rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Decimal {data.operation} with base-ten pieces</div>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Model, calculate, and explain</h1>
        <p className="mt-1 text-sm">Use the pieces to solve the decimal problem. Show any exchanges, complete the written calculation, and explain your place-value strategy.</p>
        <div className="mx-auto mt-4 flex w-fit items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 font-mono text-3xl font-black text-slate-950">
            <span>{data.first.canonicalNumeral}</span><span>{operationSymbol(data.operation)}</span><span>{data.second.canonicalNumeral}</span><span>=</span>
            <span className={`flex min-h-11 min-w-24 items-center justify-center rounded-lg border-2 px-2 ${isSolution ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-400 bg-white'}`}>
                {isSolution ? data.result.canonicalNumeral : ''}
            </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
            <UnitBoard counts={numberUnitCounts(data.first)} title={data.operation === 'addition' ? 'First addend' : 'Start with'} tone="indigo" />
            <UnitBoard counts={numberUnitCounts(data.second)} title={data.operation === 'addition' ? 'Second addend' : 'Remove'} tone="sky" />
        </div>
        <div className={`mt-4 rounded-xl border-2 p-4 ${isSolution ? 'border-amber-300 bg-amber-50/40' : 'border-dashed border-slate-300 bg-white'}`}>
            <div className="text-sm font-bold text-slate-800">Exchange and result model</div>
            {isSolution ? <>
                {data.operation === 'addition' && <div className="mt-3">
                    <div className="mb-2 text-center text-sm font-bold text-amber-900">First pieces + second pieces ↓</div>
                    <UnitBoard counts={actionStep.after} title="Joined pieces before exchanges" tone="amber" />
                </div>}
                {exchangeSteps.length > 0
                    ? <div className="mt-3 grid grid-cols-2 gap-3">{exchangeSteps.map((step, index) => <ExchangeCard key={index} step={step} index={index} />)}</div>
                    : <div className="mt-2 text-sm font-semibold text-slate-600">No exchange needed.</div>}
                {data.operation === 'subtraction' && <div className="mt-3">
                    <div className="grid grid-cols-2 gap-3">
                        <UnitBoard counts={actionStep.before} title="Pieces after exchanges" tone="amber" />
                        <UnitBoard counts={numberUnitCounts(data.second)} title="Remove these second-operand pieces" tone="sky" />
                    </div>
                    <div className="mt-2 text-center text-sm font-bold text-rose-700">Exchanged pieces − second-operand pieces ↓</div>
                </div>}
                <div className="mt-3"><UnitBoard counts={data.model.final} title={`Result model: ${data.result.canonicalNumeral}`} tone="emerald" /></div>
            </> : <div className="mt-3 flex min-h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">Draw any exchanges and the result pieces here.</div>}
        </div>
        <div className="mt-4 grid grid-cols-[330px_1fr] gap-3">
            <WrittenCalculation data={data} isSolution={isSolution} />
            <div className={`rounded-xl border-2 p-4 ${isSolution ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
                <div className="text-sm font-bold text-slate-800">Written strategy</div>
                {isSolution
                    ? <p className="mt-3 text-sm font-semibold leading-relaxed text-emerald-950">{strategyText(data)}</p>
                    : <><p className="mt-2 text-sm text-slate-500">Explain how your pieces and written calculation agree.</p><div className="mt-6 space-y-5"><div className="border-b border-slate-300" /><div className="border-b border-slate-300" /><div className="border-b border-slate-300" /></div></>}
            </div>
        </div>
    </main>;
};

export const OperationsDecimalAdditionSubtractionMethod = withConfig(
    OperationsDecimalAdditionSubtractionMethodViewSchema,
    OperationsDecimalAdditionSubtractionMethodCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsDecimalAdditionSubtractionMethod payload={payload} />);
    }
};
