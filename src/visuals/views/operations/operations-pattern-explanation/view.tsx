import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsPatternExplanationViewConfig, OperationsPatternExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {config: OperationsPatternExplanationViewConfig; payload: ViewRenderPayload<'operations-pattern-explanation'>}
const names = {commutative: 'Commutative property', associative: 'Associative property', distributive: 'Distributive property'} as const;

const OperationsPatternExplanationCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-pattern-explanation', data, [
        'operation', 'headers', 'table', 'propertyLaw', 'leftExpression', 'rightExpression',
        'propertyResult', 'explanation', 'highlightedCells'
    ]);
    if (!data.propertyLaw || !Object.hasOwn(names, data.propertyLaw)
        || data.headers.length !== 7 || data.table.length !== 7) {
        throw new ViewValidationError('operations-pattern-explanation', 'Invalid property explanation payload.');
    }
    const highlighted = new Set(data.highlightedCells!.map(([row, column]) => `${row}-${column}`));
    const symbol = data.operation === 'addition' ? '+' : '×';

    return <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Explain the pattern</div>
        <div className="mt-1 text-xl font-bold text-slate-800">How does the {names[data.propertyLaw].toLowerCase()} explain the selected cells?</div>
        <div className="mt-5 flex gap-5">
            <div className="grid w-[350px] grid-cols-8 overflow-hidden rounded-xl border border-slate-300 font-mono text-sm">
                <div className="flex h-9 items-center justify-center bg-slate-800 font-bold text-white">{symbol}</div>
                {data.headers.map(header => <div key={`h-${header}`} className="flex h-9 items-center justify-center border-l border-slate-300 bg-slate-100 font-bold">{header}</div>)}
                {data.table.map((row, rowIndex) => <div key={`r-${rowIndex}`} className="contents">
                    <div className="flex h-9 items-center justify-center border-t border-slate-300 bg-slate-100 font-bold">{data.headers[rowIndex]}</div>
                    {row.map((value, columnIndex) => <div key={`${rowIndex}-${columnIndex}`} className={`flex h-9 items-center justify-center border-l border-t border-slate-300 ${highlighted.has(`${rowIndex}-${columnIndex}`) ? 'bg-violet-200 font-bold text-violet-900' : 'bg-white text-slate-600'}`}>{value}</div>)}
                </div>)}
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-violet-200 bg-violet-50 p-5 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-violet-700">{names[data.propertyLaw]}</div>
                <div className="mt-4 font-mono text-xl font-bold text-slate-800">{data.leftExpression} = {data.propertyResult}</div>
                <div className="mt-2 font-mono text-xl font-bold text-slate-800">{data.rightExpression} = {data.propertyResult}</div>
            </div>
        </div>
        <div className={`mt-5 min-h-[92px] rounded-xl border-2 p-5 text-lg ${isSolutionView ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900' : 'border-dashed border-slate-300 bg-white text-slate-400'}`}>
            {isSolutionView ? data.explanation : 'Write your explanation here.'}
        </div>
    </div>;
};

export const OperationsPatternExplanation = withConfig(OperationsPatternExplanationViewSchema, OperationsPatternExplanationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-pattern-explanation'>) => {
    const container = document.getElementById('view');
    if (container) {if (!root) root = createRoot(container); root.render(<OperationsPatternExplanation payload={payload} />);}
};
