import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {OperationsPatternTableViewConfig, OperationsPatternTableViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {config: OperationsPatternTableViewConfig; payload: ViewRenderPayload<'operations-pattern-table'>}

const OperationsPatternTableCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-pattern-table', data, [
        'operation', 'headers', 'table', 'focusRow', 'sequence', 'patternStep', 'patternOptions', 'patternAnswer'
    ]);
    if (!['addition', 'multiplication'].includes(data.operation)
        || data.headers.length !== 7
        || data.table.length !== 7
        || data.table.some(row => row.length !== 7)
        || data.sequence.length !== 7
        || !data.patternOptions.includes(data.patternAnswer)) {
        throw new ViewValidationError('operations-pattern-table', 'Invalid arithmetic pattern table.');
    }
    const symbol = data.operation === 'addition' ? '+' : '×';

    return <div className="w-[700px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Find the table pattern</div>
        <div className="mt-1 text-xl font-bold text-slate-800">Which rule describes the highlighted row?</div>
        <div className="mt-5 grid grid-cols-8 overflow-hidden rounded-xl border border-slate-300 font-mono text-lg">
            <div className="flex h-11 items-center justify-center bg-slate-800 font-bold text-white">{symbol}</div>
            {data.headers.map(header => <div key={`h-${header}`} className="flex h-11 items-center justify-center border-l border-slate-300 bg-slate-100 font-bold">{header}</div>)}
            {data.table.map((row, rowIndex) => <div key={`r-${rowIndex}`} className="contents">
                <div className={`flex h-11 items-center justify-center border-t border-slate-300 font-bold ${rowIndex === data.focusRow ? 'bg-amber-300' : 'bg-slate-100'}`}>{data.headers[rowIndex]}</div>
                {row.map((value, columnIndex) => <div key={`${rowIndex}-${columnIndex}`} className={`flex h-11 items-center justify-center border-l border-t border-slate-300 ${rowIndex === data.focusRow ? 'bg-amber-100 font-bold text-amber-900' : 'bg-white text-slate-700'}`}>{value}</div>)}
            </div>)}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
            {data.patternOptions.map(option => <div key={option} className={`flex h-14 items-center justify-center rounded-xl border-2 px-2 text-center font-bold ${isSolutionView && option === data.patternAnswer ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-600'}`}>{option}</div>)}
        </div>
    </div>;
};

export const OperationsPatternTable = withConfig(OperationsPatternTableViewSchema, OperationsPatternTableCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-pattern-table'>) => {
    const container = document.getElementById('view');
    if (container) {if (!root) root = createRoot(container); root.render(<OperationsPatternTable payload={payload} />);}
};
