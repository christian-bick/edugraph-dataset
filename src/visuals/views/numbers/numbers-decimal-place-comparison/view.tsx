import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalPlaceComparisonOperand} from '../../../../types/problems.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    alignedComparisonDigits,
    assertDecimalPlaceComparison,
    COMPARISON_PLACES,
    comparisonSymbol
} from '../decimal-place-comparison-helpers.ts';
import {NumbersDecimalPlaceComparisonViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-place-comparison';

function AlignedRow({operand, label, decidingPlace, equal, isSolution}: {
    operand: DecimalPlaceComparisonOperand;
    label: string;
    decidingPlace: string | null;
    equal: boolean;
    isSolution: boolean;
}) {
    return <div className="grid grid-cols-[145px_1fr] items-stretch gap-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">{label}</div>
            <div className="mt-1 font-mono text-2xl font-black text-indigo-950">{operand.displayNumeral}</div>
        </div>
        <div className="grid grid-cols-6 overflow-hidden rounded-xl border border-slate-300 text-center">
            {alignedComparisonDigits(operand).map((digit, index) => {
                const selected = isSolution && (equal || COMPARISON_PLACES[index] === decidingPlace);
                const implicit = index >= 3 + operand.displayPrecision;
                const color = selected
                    ? equal ? 'bg-emerald-100 text-emerald-950 ring-2 ring-inset ring-emerald-400' : 'bg-amber-100 text-amber-950 ring-2 ring-inset ring-amber-400'
                    : implicit ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-900';
                return <div key={COMPARISON_PLACES[index]} className={`flex items-center justify-center border-r border-slate-300 font-mono text-3xl font-black last:border-r-0 ${index === 3 ? 'border-l-4 border-l-indigo-400' : ''} ${color}`}>
                    {digit}
                </div>;
            })}
        </div>
    </div>;
}

export const NumbersDecimalPlaceComparisonCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'base', 'left', 'right', 'relation', 'witness']);
    assertDecimalPlaceComparison(VIEW_ID, data);
    const isSolution = payload.isSolutionView;
    const equal = data.relation === 'equal';
    const decidingPlace = equal ? null : data.witness.decidingPlace;
    const hasImplicitZeros = data.left.displayPrecision < 3 || data.right.displayPrecision < 3;

    return <main className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800 shadow-sm" style={{width: 875, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Compare decimals by place value</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Compare the two decimals</h1>
        <p className="mt-2 text-base">Compare matching places from left to right. Write &gt;, =, or &lt;.</p>
        <div className="mt-5 flex items-center justify-center gap-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-5 font-mono text-4xl font-black text-slate-950">
            <span>{data.left.displayNumeral}</span>
            <span className={`flex h-16 w-20 items-center justify-center rounded-xl border-2 ${isSolution ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-400 bg-white'}`}>
                {isSolution ? comparisonSymbol(data.relation) : ''}
            </span>
            <span>{data.right.displayNumeral}</span>
        </div>
        <div className="mt-5 grid grid-cols-[145px_1fr] gap-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
            <div>Numeral</div>
            <div className="grid grid-cols-6">
                {COMPARISON_PLACES.map((place, index) => <div key={place} className={`px-1 ${index === 3 ? 'border-l-4 border-l-indigo-400' : ''}`}>{place}</div>)}
            </div>
        </div>
        <div className="mt-2 space-y-3">
            <AlignedRow operand={data.left} label="First" decidingPlace={decidingPlace} equal={equal} isSolution={isSolution} />
            <AlignedRow operand={data.right} label="Second" decidingPlace={decidingPlace} equal={equal} isSolution={isSolution} />
        </div>
        {hasImplicitZeros && <p className="mt-3 text-center text-sm text-slate-500">Pale zeros extend a shorter numeral for place-by-place comparison.</p>}
        {isSolution && <div className="mt-5 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-4 text-base font-semibold leading-relaxed text-emerald-950">
            {equal
                ? <>Every aligned place has the same digit. {data.left.displayPrecision !== data.right.displayPrecision && <>Adding trailing zeros does not change the value. </>}So {data.left.displayNumeral} = {data.right.displayNumeral}.</>
                : <>All higher places match. At the {data.witness.decidingPlace} place, {data.witness.leftDigit} {comparisonSymbol(data.relation)} {data.witness.rightDigit}, so {data.left.displayNumeral} {comparisonSymbol(data.relation)} {data.right.displayNumeral}.</>}
        </div>}
    </main>;
};

export const NumbersDecimalPlaceComparison = withConfig(
    NumbersDecimalPlaceComparisonViewSchema,
    NumbersDecimalPlaceComparisonCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersDecimalPlaceComparison payload={payload} />);
    }
};
