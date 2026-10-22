import type {CSSProperties, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {StandardDivisionProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {alignedDivisionDigits, formatDivisionNumeral, isValidStandardDivision} from './helpers.ts';
import type {OperationsDivisionStandardAlgorithmViewConfig} from './spec.ts';
import {OperationsDivisionStandardAlgorithmViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-division-standard-algorithm';
interface CoreProps {
    config: OperationsDivisionStandardAlgorithmViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

function WrittenAlgorithm({data, isSolutionView}: {data: StandardDivisionProblem; isSolutionView: boolean}) {
    const columns = data.dividendDigits.length;
    const compact = columns > 8 || String(data.divisor).length > 8;
    const cellWidth = compact ? 24 : 44;
    const divisorWidth = Math.max(64, String(data.divisor).length * (compact ? 13 : 18) + 18);
    const annotationWidth = compact ? 150 : 176;
    const gridStyle: CSSProperties = {gridTemplateColumns: `${divisorWidth}px repeat(${columns}, ${cellWidth}px) ${annotationWidth}px`};
    const digitStyle: CSSProperties = {fontSize: compact ? 19 : 28};

    const Digit = ({value, solution, children}: {value: number | null; solution: boolean; children?: ReactNode}) =>
        <div className={`relative flex h-10 items-center justify-center font-mono font-bold ${solution ? 'text-emerald-800' : 'text-slate-900'}`} style={digitStyle}>
            {children}{value}
        </div>;

    function WorkRow({value, endColumn, role, minus = false, sourceColumn, note}: {
        value: number; endColumn: number; role: string; minus?: boolean; sourceColumn?: number; note: ReactNode;
    }) {
        const digits = alignedDivisionDigits(value, endColumn, columns);
        const startColumn = endColumn + 1 - String(value).length;
        return <div className="grid" style={gridStyle} data-role={role} data-end-column={endColumn}>
            <div />
            {digits.map((digit, column) => <Digit key={column} value={digit} solution={true}>
                {minus && column === startColumn && <span className="absolute -left-2 text-lg">−</span>}
                {column === sourceColumn && <span aria-label={`Bring down original dividend digit ${digit} in column ${column + 1}`}
                    className="absolute -top-3 text-base leading-none">↓</span>}
            </Digit>)}
            <div className="flex items-center pl-4 text-xs leading-snug text-emerald-800">{note}</div>
        </div>;
    }

    return <div className="mx-auto w-fit rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-5">
        <div className="grid h-10" style={gridStyle} data-role="quotient">
            <div />
            {data.dividendDigits.map((_, column) => <Digit key={column}
                value={isSolutionView && column >= data.quotientStartColumn ? data.quotientDigits[column - data.quotientStartColumn]! : null}
                solution={isSolutionView} />)}
            <div className="flex items-center pl-4 text-xs text-slate-500">Quotient</div>
        </div>
        <div className="grid" style={gridStyle} data-role="given-operands">
            <div className="flex items-center justify-end pr-3 font-mono font-bold text-slate-900" style={{fontSize: compact ? 19 : 28}}>{data.divisor}</div>
            <div className="relative grid" style={{gridColumn: `2 / span ${columns}`, gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`}}>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-tl-md border-l-2 border-t-2 border-slate-700" />
                {data.dividendDigits.map((digit, column) => <Digit key={column} value={digit} solution={false} />)}
            </div>
            <div />
        </div>
        {isSolutionView ? data.steps.map((step, index) => {
            const next = data.steps[index + 1];
            const activeWidth = String(step.partialDividend).length;
            const sourceColumn = step.nextBringDown ? step.nextBringDown.sourceColumn : next?.columnIndex;
            const broughtDigit = step.nextBringDown ? step.nextBringDown.digit : next?.broughtDownDigits[0];
            return <div key={step.columnIndex} data-role="division-step" data-column={step.columnIndex}>
                <WorkRow value={step.product} endColumn={step.columnIndex} role="product" minus={true}
                    note={<>{data.divisor} × {step.quotientDigit}</>} />
                <div className="grid" style={gridStyle}>
                    <div className="border-t-2 border-emerald-700" data-role="subtraction-rule"
                        style={{gridColumn: `${step.columnIndex + 3 - activeWidth} / span ${activeWidth}`}} />
                </div>
                {next ? <WorkRow value={next.partialDividend} endColumn={next.columnIndex} role="next-partial" sourceColumn={sourceColumn}
                    note={<>Bring down {broughtDigit}</>} />
                    : <WorkRow value={step.remainder} endColumn={step.columnIndex} role="final-remainder" note="Remainder" />}
            </div>;
        }) : <div className="flex h-56 items-end justify-center pb-4 text-sm text-slate-400" data-role="blank-work">Show your work here.</div>}
    </div>;
}

export const OperationsDivisionStandardAlgorithmCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'base', 'dividend', 'divisor', 'quotient', 'remainder', 'dividendDigits', 'quotientStartColumn', 'quotientDigits', 'steps']);
    if (!isValidStandardDivision(data)) {
        throw new ViewValidationError(VIEW_ID, 'The long-division columns, subtraction, brought-down digits, or final quotient and remainder are inconsistent.');
    }
    const compact = data.dividendDigits.length > 8 || String(data.divisor).length > 8;
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm"
        style={{width: compact ? 960 : 780, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Standard division algorithm</div>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Divide {formatDivisionNumeral(data.dividend)} ÷ {formatDivisionNumeral(data.divisor)}.</h1>
        <p className="mb-4 mt-2 text-sm text-slate-600">Use long division. Write the quotient and remainder.</p>
        <WrittenAlgorithm data={data} isSolutionView={isSolutionView} />
        <div className={`mt-4 rounded-xl border-2 px-5 py-3 text-center font-mono text-lg font-bold ${isSolutionView
            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
            : 'border-dashed border-slate-300 bg-slate-50 text-slate-700'}`}>
            {isSolutionView ? <>
                <div>Quotient: {formatDivisionNumeral(data.quotient)} &nbsp; Remainder: {formatDivisionNumeral(data.remainder)}</div>
                <div className="mt-1 text-sm"><span className="text-slate-700">{formatDivisionNumeral(data.dividend)} = {formatDivisionNumeral(data.divisor)}</span> × {formatDivisionNumeral(data.quotient)} + {formatDivisionNumeral(data.remainder)}</div>
            </> : <>Quotient: ___ &nbsp; Remainder: ___</>}
        </div>
    </main>;
};

export const OperationsDivisionStandardAlgorithm = withConfig(
    OperationsDivisionStandardAlgorithmViewSchema,
    OperationsDivisionStandardAlgorithmCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsDivisionStandardAlgorithm payload={payload} />);
};
