import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticPatternProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {getPatternTaskIdentity, hasConsistentRuleTerms} from './pattern-table-helpers.ts';

export type PatternTableMode = 'legacy-classification' | 'generation' | 'feature-classification';

interface PatternTableViewProps {
    mode: PatternTableMode;
    payload: RenderPayload<AbstractProblem<ArithmeticPatternProblem>>;
    viewId: string;
}

function fail(viewId: string, message: string): never {
    throw new ViewValidationError(viewId, message);
}

function rotate<T>(values: readonly T[], seed: number): T[] {
    const offset = Math.abs(seed) % values.length;
    return [...values.slice(offset), ...values.slice(0, offset)];
}

function featureOptions(data: ArithmeticPatternProblem, seed: number): string[] {
    const alternatives = data.inferredFeature.includes('alternate')
        ? ['Every term is odd.', 'Every term is even.']
        : data.inferredFeature.includes('every term is even')
            ? ['Every term is odd.', 'The terms alternate between odd and even.']
            : ['The terms stay the same.', 'There is no consistent relationship.'];
    return rotate([data.inferredFeature, ...alternatives], seed);
}

function validatePattern(viewId: string, data: ArithmeticPatternProblem) {
    validateProblemData(viewId, data, [
        'operation',
        'headers',
        'table',
        'focusRow',
        'sequence',
        'patternStep',
        'startValue',
        'ruleOperation',
        'ruleValue',
        'ruleText',
        'terms',
        'inferredFeature',
        'featureEvidence',
        'explanation'
    ]);
    const validTerms = data.ruleOperation === 'multiply-position'
        ? data.operation === 'multiplication'
            && data.terms.every((term, index) => term === index * data.ruleValue)
        : hasConsistentRuleTerms(data.startValue, data.ruleOperation, data.ruleValue, data.terms);
    if (!['addition', 'multiplication'].includes(data.operation)
        || data.headers.length !== 7
        || data.headers.some((header, index) => header !== index)
        || data.table.length !== 7
        || data.table.some((row, rowIndex) => (
            row.length !== 7
            || row.some((value, columnIndex) => value !== (data.operation === 'addition'
                ? rowIndex + columnIndex
                : rowIndex * columnIndex))
        ))
        || !Number.isInteger(data.focusRow)
        || data.focusRow < 0
        || data.focusRow >= 7
        || data.sequence.some((value, index) => value !== data.table[data.focusRow][index])
        || data.patternStep !== (data.operation === 'addition' ? 1 : data.focusRow)
        || !validTerms) {
        fail(viewId, 'The supplied arithmetic pattern and operation table must be mathematically coherent.');
    }
}

function OperationTable({data}: {data: ArithmeticPatternProblem}) {
    const symbol = data.operation === 'addition' ? '+' : '×';
    return (
        <div className="mt-5 grid grid-cols-8 overflow-hidden rounded-xl border border-slate-300 font-mono text-lg">
            <div className="flex h-11 items-center justify-center bg-slate-800 font-bold text-white">{symbol}</div>
            {data.headers.map(header => <div key={`h-${header}`} className="flex h-11 items-center justify-center border-l border-slate-300 bg-slate-100 font-bold">{header}</div>)}
            {data.table.map((row, rowIndex) => <div key={`r-${rowIndex}`} className="contents">
                <div className={`flex h-11 items-center justify-center border-t border-slate-300 font-bold ${rowIndex === data.focusRow ? 'bg-amber-300' : 'bg-slate-100'}`}>{data.headers[rowIndex]}</div>
                {row.map((value, columnIndex) => <div key={`${rowIndex}-${columnIndex}`} className={`flex h-11 items-center justify-center border-l border-t border-slate-300 ${rowIndex === data.focusRow ? 'bg-amber-100 font-bold text-amber-900' : 'bg-white text-slate-700'}`}>{value}</div>)}
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

function LegacyTable({data, seed, isSolutionView}: {
    data: ArithmeticPatternProblem;
    seed: number;
    isSolutionView: boolean;
}) {
    const identity = getPatternTaskIdentity(undefined);
    const answer = `Increase by ${data.patternStep}`;
    const options = rotate([answer, `Increase by ${data.patternStep + 1}`, 'Stay the same'], seed);
    return (
        <div className="w-[700px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{identity.eyebrow}</div>
            <div className="mt-1 text-xl font-bold text-slate-800">{identity.instruction}</div>
            <OperationTable data={data} />
            <ChoiceGrid options={options} answer={answer} isSolutionView={isSolutionView} />
        </div>
    );
}

function PatternHeader({data, mode}: {data: ArithmeticPatternProblem; mode: Exclude<PatternTableMode, 'legacy-classification'>}) {
    const identity = getPatternTaskIdentity(mode === 'feature-classification' ? 'identify-feature' : 'generate');
    const prompt = mode === 'feature-classification'
        ? 'Which feature appears in the generated terms but is not stated in the rule?'
        : 'Follow the rule to find the missing term in the pattern.';
    return (
        <>
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{identity.eyebrow}</div>
            <div className="mt-2 text-center text-xl font-bold leading-relaxed text-slate-800">{prompt}</div>
            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Starting value</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-sky-950">{data.startValue}</div>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Rule</div>
                    <div className="mt-1 text-lg font-bold text-violet-950">{data.ruleText}</div>
                </div>
            </div>
        </>
    );
}

function TermStrip({data, hiddenIndex}: {data: ArithmeticPatternProblem; hiddenIndex: number | null}) {
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

function PatternTask({data, mode, seed, isSolutionView}: {
    data: ArithmeticPatternProblem;
    mode: Exclude<PatternTableMode, 'legacy-classification'>;
    seed: number;
    isSolutionView: boolean;
}) {
    const hiddenIndex = mode === 'generation' ? 2 + Math.abs(seed) % (data.terms.length - 2) : null;
    const options = featureOptions(data, seed);
    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <PatternHeader data={data} mode={mode} />
            <TermStrip data={data} hiddenIndex={hiddenIndex !== null && !isSolutionView ? hiddenIndex : null} />
            {mode === 'generation' ? (
                <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-lg font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-dashed border-emerald-300 bg-white text-emerald-700'}`}>
                    {isSolutionView ? `Missing term: ${data.terms[hiddenIndex!]}` : 'Missing term: __________'}
                </div>
            ) : (
                <>
                    <ChoiceGrid options={options} answer={data.inferredFeature} isSolutionView={isSolutionView} />
                    {isSolutionView && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-center font-semibold text-amber-950">{data.featureEvidence}</div>}
                </>
            )}
        </div>
    );
}

export const PatternTableView = ({mode, payload, viewId}: PatternTableViewProps) => {
    const {problem, isSolutionView, seed} = payload;
    validatePattern(viewId, problem.data);
    return mode === 'legacy-classification'
        ? <LegacyTable data={problem.data} seed={seed} isSolutionView={isSolutionView} />
        : <PatternTask data={problem.data} mode={mode} seed={seed} isSolutionView={isSolutionView} />;
};
