import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    ArithmeticOperationTablePatternProblem,
    ArithmeticPatternProblem,
    ArithmeticRecurrencePatternProblem
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    featureEvidence,
    featureOptions,
    featureStatement,
    getPatternTaskIdentity,
    isValidOperationTable,
    isValidRecurrence,
    operationTableRule,
    recurrenceRule,
    recurrenceStart
} from './pattern-table-helpers.ts';

export type PatternTableMode = 'legacy-classification' | 'generation' | 'feature-classification';

interface PatternTableViewProps {
    mode: PatternTableMode;
    payload: RenderPayload<AbstractProblem<ArithmeticPatternProblem>>;
    viewId: string;
    missingTermIndex?: number;
    focusOperand?: number;
}

function fail(viewId: string, message: string): never {
    throw new ViewValidationError(viewId, message);
}

function rotate<T>(values: readonly T[], seed: number): T[] {
    const offset = Math.abs(seed) % values.length;
    return [...values.slice(offset), ...values.slice(0, offset)];
}

function validatePattern(viewId: string, data: ArithmeticPatternProblem) {
    validateProblemData(viewId, data, ['kind']);
    if (data.kind === 'operation-table') {
        validateProblemData(viewId, data, ['operation', 'operands', 'values']);
        if (!isValidOperationTable(data)) {
            fail(viewId, 'The supplied operation table must be mathematically coherent.');
        }
        return;
    }

    validateProblemData(viewId, data, ['recurrence', 'terms', 'emergentFeature']);
    if (!isValidRecurrence(data)) {
        fail(viewId, 'The supplied terms, emergent feature, and law witness must be mathematically coherent.');
    }
}

function OperationTable({data, focusIndex}: {
    data: ArithmeticOperationTablePatternProblem;
    focusIndex: number;
}) {
    const symbol = data.operation === 'addition' ? '+' : '×';
    return (
        <div className="mt-5 grid grid-cols-8 overflow-hidden rounded-xl border border-slate-300 font-mono text-lg">
            <div className="flex h-11 items-center justify-center bg-slate-800 font-bold text-white">{symbol}</div>
            {data.operands.map(operand => <div key={`h-${operand}`} className="flex h-11 items-center justify-center border-l border-slate-300 bg-slate-100 font-bold">{operand}</div>)}
            {data.values.map((row, rowIndex) => <div key={`r-${rowIndex}`} className="contents">
                <div className={`flex h-11 items-center justify-center border-t border-slate-300 font-bold ${rowIndex === focusIndex ? 'bg-amber-300' : 'bg-slate-100'}`}>{data.operands[rowIndex]}</div>
                {row.map((value, columnIndex) => <div key={`${rowIndex}-${columnIndex}`} className={`flex h-11 items-center justify-center border-l border-t border-slate-300 ${rowIndex === focusIndex ? 'bg-amber-100 font-bold text-amber-900' : 'bg-white text-slate-700'}`}>{value}</div>)}
            </div>)}
        </div>
    );
}

function ChoiceGrid({options, answer, isSolutionView}: {
    options: readonly string[];
    answer: string;
    isSolutionView: boolean;
}) {
    return (
        <div className="mt-5 grid grid-cols-3 gap-3">
            {options.map(option => <div key={option} className={`flex min-h-14 items-center justify-center rounded-xl border-2 px-2 text-center font-bold ${isSolutionView && option === answer ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-600'}`}>{option}</div>)}
        </div>
    );
}

function OperationTableTask({data, seed, isSolutionView, focusOperand}: {
    data: ArithmeticOperationTablePatternProblem;
    seed: number;
    isSolutionView: boolean;
    focusOperand: number;
}) {
    const identity = getPatternTaskIdentity(undefined);
    const focusIndex = data.operands.indexOf(focusOperand);
    const answer = operationTableRule(data, focusOperand);
    const options = rotate([answer, `Increase by ${data.operation === 'addition' ? 2 : focusOperand + 1}`, 'Stay the same'], seed);
    return (
        <div className="w-[700px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{identity.eyebrow}</div>
            <div className="mt-1 text-xl font-bold text-slate-800">{identity.instruction}</div>
            <OperationTable data={data} focusIndex={focusIndex} />
            <ChoiceGrid options={options} answer={answer} isSolutionView={isSolutionView} />
        </div>
    );
}

function PatternHeader({data, mode}: {
    data: ArithmeticRecurrencePatternProblem;
    mode: Exclude<PatternTableMode, 'legacy-classification'>;
}) {
    const identity = getPatternTaskIdentity(mode === 'feature-classification' ? 'identify-feature' : 'generate');
    const prompt = mode === 'feature-classification'
        ? 'Complete the missing term, then choose the feature that is not stated in the rule.'
        : 'Follow the rule to find the missing term in the pattern.';
    return (
        <>
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{identity.eyebrow}</div>
            <div className="mt-2 text-center text-xl font-bold leading-relaxed text-slate-800">{prompt}</div>
            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Starting value</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-sky-950">{recurrenceStart(data)}</div>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Rule</div>
                    <div className="mt-1 text-lg font-bold text-violet-950">{recurrenceRule(data)}</div>
                </div>
            </div>
        </>
    );
}

function TermStrip({data, hiddenIndex}: {
    data: ArithmeticRecurrencePatternProblem;
    hiddenIndex: number | null;
}) {
    return (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">Generated terms</div>
            <div className="mt-3 flex items-center justify-center gap-2">
                {data.terms.map((term, index) => (
                    <div className="contents" key={`${index}-${term}`}>
                        {index > 0 && <div className="text-lg font-bold text-slate-400">→</div>}
                        <div className={`flex h-14 min-w-[62px] items-center justify-center rounded-xl border-2 px-3 font-mono text-xl font-bold ${hiddenIndex === index ? 'border-dashed border-emerald-400 bg-white text-emerald-700' : 'border-slate-200 bg-white text-slate-900'}`}>
                            {hiddenIndex === index ? '?' : term}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PatternTask({data, mode, seed, isSolutionView, missingTermIndex, viewId}: {
    data: ArithmeticRecurrencePatternProblem;
    mode: Exclude<PatternTableMode, 'legacy-classification'>;
    seed: number;
    isSolutionView: boolean;
    missingTermIndex?: number;
    viewId: string;
}) {
    if (mode === 'generation' && (
        !Number.isInteger(missingTermIndex)
        || missingTermIndex! < 2
        || missingTermIndex! >= data.terms.length
    )) {
        fail(viewId, 'The generation view requires a valid configured missing-term index.');
    }
    const answer = featureStatement(data);
    const options = rotate(featureOptions(data), seed);
    const hiddenTermIndex = mode === 'generation' ? missingTermIndex! : 3;
    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <PatternHeader data={data} mode={mode} />
            <TermStrip data={data} hiddenIndex={isSolutionView ? null : hiddenTermIndex} />
            {mode === 'feature-classification' && isSolutionView && (
                <div className="mt-3 text-center font-bold text-emerald-700">
                    Missing term: {data.terms[hiddenTermIndex]}
                </div>
            )}
            {mode === 'generation' ? (
                <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-lg font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-dashed border-emerald-300 bg-white text-emerald-700'}`}>
                    {isSolutionView ? `Missing term: ${data.terms[missingTermIndex!]}` : 'Missing term: __________'}
                </div>
            ) : (
                <>
                    <ChoiceGrid options={options} answer={answer} isSolutionView={isSolutionView} />
                    {isSolutionView && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-center font-semibold text-amber-950">{featureEvidence(data)}</div>}
                </>
            )}
        </div>
    );
}

export const PatternTableView = ({
    mode,
    payload,
    viewId,
    missingTermIndex,
    focusOperand
}: PatternTableViewProps) => {
    const {problem, isSolutionView, seed} = payload;
    validatePattern(viewId, problem.data);
    if (problem.data.kind === 'operation-table') {
        if (mode !== 'legacy-classification') {
            fail(viewId, 'The recurrence-pattern view requires a recurrence model.');
        }
        if (!Number.isInteger(focusOperand) || !problem.data.operands.includes(focusOperand!)) {
            fail(viewId, 'The operation-table view requires a valid configured focus operand.');
        }
        return <OperationTableTask
            data={problem.data}
            seed={seed}
            isSolutionView={isSolutionView}
            focusOperand={focusOperand!}
        />;
    }
    if (mode === 'legacy-classification') {
        fail(viewId, 'The table-pattern classification view requires an operation-table model.');
    }
    return <PatternTask
        data={problem.data}
        mode={mode}
        seed={seed}
        isSolutionView={isSolutionView}
        missingTermIndex={missingTermIndex}
        viewId={viewId}
    />;
};
