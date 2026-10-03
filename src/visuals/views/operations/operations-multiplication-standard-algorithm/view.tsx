import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {StandardMultiplicationProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {digitAt, formatMultiplicationNumeral, partialRowDigits, PLACE_NAMES, validStandardMultiplication, workColumnCount} from './helpers.ts';
import type {OperationsMultiplicationStandardAlgorithmViewConfig} from './spec.ts';
import {OperationsMultiplicationStandardAlgorithmViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-multiplication-standard-algorithm';

interface CoreProps {
    config: OperationsMultiplicationStandardAlgorithmViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

function AnswerCell({value, blank, highlight = false}: {value: number | null; blank: boolean; highlight?: boolean}) {
    return <div className={`flex h-11 items-center justify-center font-mono text-2xl font-bold ${highlight ? 'text-emerald-900' : 'text-slate-900'}`}>
        {blank
            ? <span aria-label="Unresolved digit" className="h-8 w-8 rounded border-2 border-dashed border-slate-300 bg-white" />
            : value}
    </div>;
}

function CarryCell({value, blank}: {value: number | null; blank: boolean}) {
    return <div className="flex h-7 items-center justify-center font-mono text-sm font-bold text-amber-900">
        {blank
            ? <span aria-label="Unresolved carry" className="h-5 w-5 rounded border border-dashed border-amber-300 bg-white" />
            : value}
    </div>;
}

function AlgorithmWork({data, isSolutionView}: {data: StandardMultiplicationProblem; isSolutionView: boolean}) {
    const width = workColumnCount(data);
    const multiplierDigits = String(data.multiplier).length;
    const multiplicandDigits = String(data.multiplicand).length;
    const places = Array.from({length: width}, (_, leftIndex) => width - leftIndex - 1);
    const gridStyle = {gridTemplateColumns: `144px repeat(${width}, 44px)`};

    return <div className="mx-auto w-fit rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4">
        <div className="grid" style={gridStyle}>
            <div className="self-center pr-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Multiplicand</div>
            {places.map(place => <AnswerCell key={`top-${place}`}
                value={place < multiplicandDigits ? digitAt(data.multiplicand, place) : null} blank={false} />)}
            <div className="self-center pr-4 text-right text-2xl font-bold text-indigo-700">×</div>
            {places.map(place => <AnswerCell key={`bottom-${place}`}
                value={place < multiplierDigits ? digitAt(data.multiplier, place) : null} blank={false} />)}
            <div className="col-start-2 my-2 border-t-[3px] border-slate-800" style={{gridColumn: `2 / span ${width}`}} />

            {data.partialRows.map((row, rowIndex) => {
                const digits = partialRowDigits(data, rowIndex);
                const name = PLACE_NAMES[row.shiftPlaces];
                return <div key={`pass-${rowIndex}`} className="contents">
                    <div className="self-center pr-4 text-right text-xs font-bold text-amber-800">Carry for ×{row.multiplierDigit}</div>
                    {places.map(place => {
                        const stepIndex = place - row.shiftPlaces;
                        const canCarry = stepIndex > 0 && stepIndex < multiplicandDigits;
                        const carry = canCarry ? row.columns[stepIndex]!.carryIn : 0;
                        return <CarryCell key={`carry-${rowIndex}-${place}`}
                            value={isSolutionView && carry > 0 ? carry : null}
                            blank={!isSolutionView && carry > 0} />;
                    })}
                    <div className="self-center pr-4 text-right text-xs font-bold text-indigo-800">
                        {rowIndex > 0 && <span className="mr-1 text-lg">+</span>}{name} × {row.multiplierDigit}
                    </div>
                    {digits.map((digit, leftIndex) => {
                        const place = width - leftIndex - 1;
                        const isShiftZero = place < row.shiftPlaces;
                        return <AnswerCell key={`partial-${rowIndex}-${place}`}
                            value={digit} blank={!isSolutionView && digit !== null && !isShiftZero} />;
                    })}
                </div>;
            })}

            <div className="col-start-2 my-2 border-t-[3px] border-slate-800" style={{gridColumn: `2 / span ${width}`}} />
            <div className="self-center pr-4 text-right text-xs font-bold text-amber-800">Sum carries</div>
            {places.map(place => {
                const carry = place < data.sumColumns.length ? data.sumColumns[place]!.carryIn : null;
                return <CarryCell key={`sum-carry-${place}`}
                    value={isSolutionView && carry !== null && carry > 0 ? carry : null}
                    blank={!isSolutionView && carry !== null && carry > 0} />;
            })}
            <div className="self-center pr-4 text-right text-sm font-bold text-emerald-800">Total</div>
            {places.map(place => <AnswerCell key={`total-${place}`}
                value={isSolutionView && place < String(data.product).length ? digitAt(data.product, place) : null}
                blank={!isSolutionView && place < String(data.product).length} highlight={isSolutionView} />)}
        </div>
    </div>;
}

export const OperationsMultiplicationStandardAlgorithmCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'multiplicand', 'multiplier', 'product', 'partialRows', 'sumColumns']);
    if (!validStandardMultiplication(data)) {
        throw new ViewValidationError(VIEW_ID, 'The multiplication passes, carries, place shifts, or final sum are inconsistent.');
    }

    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm" style={{width: 780, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Standard multiplication algorithm</div>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Multiply {formatMultiplicationNumeral(data.multiplicand)} × {formatMultiplicationNumeral(data.multiplier)}.</h1>
        <p className="mb-4 mt-2 text-sm text-slate-600">Work from right to left; align each partial product by the multiplier digit’s place.</p>
        <AlgorithmWork data={data} isSolutionView={isSolutionView} />
        <div className={`mt-4 rounded-xl border-2 px-5 py-3 text-center font-mono text-lg font-bold ${isSolutionView
            ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
            : 'border-dashed border-slate-300 bg-slate-50 text-slate-700'}`}>
            {formatMultiplicationNumeral(data.multiplicand)} × {formatMultiplicationNumeral(data.multiplier)} = {isSolutionView
                ? formatMultiplicationNumeral(data.product) : '___'}
        </div>
    </main>;
};

export const OperationsMultiplicationStandardAlgorithm = withConfig(
    OperationsMultiplicationStandardAlgorithmViewSchema,
    OperationsMultiplicationStandardAlgorithmCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsMultiplicationStandardAlgorithm payload={payload} />);
};
