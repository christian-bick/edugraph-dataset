import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticPatternProblem, ArithmeticPatternProperty} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {hasConsistentRuleTerms} from './pattern-table-helpers.ts';

export type PatternExplanationMode = 'legacy-explanation' | 'generation-practice' | 'feature-explanation';

interface PatternExplanationViewProps {
    mode: PatternExplanationMode;
    payload: RenderPayload<AbstractProblem<ArithmeticPatternProblem>>;
    viewId: string;
}

const PROPERTY_NAMES: Record<ArithmeticPatternProperty, string> = {
    commutative: 'Commutative property',
    associative: 'Associative property',
    distributive: 'Distributive property'
};

function fail(viewId: string, message: string): never {
    throw new ViewValidationError(viewId, message);
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
    if (!validTerms || data.terms.length < 4) {
        fail(viewId, 'The supplied terms must follow the stated number-pattern rule.');
    }

    if (data.propertyLaw) {
        validateProblemData(viewId, data, [
            'leftExpression',
            'rightExpression',
            'propertyResult',
            'highlightedCells'
        ]);
        if (data.highlightedCells!.some(([row, column]) => (
            !Number.isInteger(row)
            || !Number.isInteger(column)
            || row < 0
            || row >= data.table.length
            || column < 0
            || column >= data.table[row].length
        ))) {
            fail(viewId, 'The supplied property witness must reference cells in the operation table.');
        }
    }
}

function PropertyBody({data}: {data: ArithmeticPatternProblem}) {
    if (!data.propertyLaw) {
        return (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center font-semibold text-amber-950">
                {data.featureEvidence}
            </div>
        );
    }

    const highlighted = new Set(data.highlightedCells!.map(([row, column]) => `${row}-${column}`));
    return (
        <div className="mt-5 grid grid-cols-[1fr_260px] gap-4">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Property witness</div>
                <div className="mt-2 font-mono text-lg font-bold text-violet-950">
                    {data.leftExpression} = {data.rightExpression} = {data.propertyResult}
                </div>
            </div>
            <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-slate-300 font-mono text-sm">
                {data.table.flatMap((row, rowIndex) => row.map((value, columnIndex) => (
                    <div
                        key={`${rowIndex}-${columnIndex}`}
                        className={`flex h-8 items-center justify-center border-b border-r border-slate-200 ${highlighted.has(`${rowIndex}-${columnIndex}`) ? 'bg-amber-300 font-bold text-amber-950' : 'bg-white text-slate-600'}`}
                    >
                        {value}
                    </div>
                )))}
            </div>
        </div>
    );
}

function TermStrip({data, hiddenIndex}: {data: ArithmeticPatternProblem; hiddenIndex: number | null}) {
    return (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            {data.terms.map((term, index) => (
                <div className="contents" key={`${index}-${term}`}>
                    {index > 0 && <div className="font-bold text-slate-400">→</div>}
                    <div className={`flex h-12 min-w-[58px] items-center justify-center rounded-lg border px-3 font-mono text-lg font-bold ${hiddenIndex === index ? 'border-dashed border-emerald-400 bg-white text-emerald-700' : 'border-slate-200 bg-white text-slate-900'}`}>
                        {hiddenIndex === index ? '?' : term}
                    </div>
                </div>
            ))}
        </div>
    );
}

function GenerationPractice({data, seed, isSolutionView}: {
    data: ArithmeticPatternProblem;
    seed: number;
    isSolutionView: boolean;
}) {
    const missingIndex = 2 + Math.abs(seed) % (data.terms.length - 2);
    return (
        <div className="w-[760px] rounded-2xl border-l-8 border-violet-500 bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Reason through the number pattern</div>
            <div className="mt-2 text-xl font-bold leading-relaxed text-slate-800">Follow the rule to find the missing term in the pattern.</div>
            <div className="mt-5 grid grid-cols-[150px_1fr] overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-slate-100 px-4 py-4 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Start</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-slate-900">{data.startValue}</div>
                </div>
                <div className="border-l border-slate-200 bg-white px-5 py-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Stated rule</div>
                    <div className="mt-1 text-lg font-bold text-violet-950">{data.ruleText}</div>
                </div>
            </div>
            <TermStrip data={data} hiddenIndex={isSolutionView ? null : missingIndex} />
            <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-lg font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-dashed border-emerald-300 bg-white text-emerald-700'}`}>
                {isSolutionView ? `The missing term is ${data.terms[missingIndex]}.` : 'Missing term: __________'}
            </div>
        </div>
    );
}

function Explanation({data, compact, isSolutionView}: {
    data: ArithmeticPatternProblem;
    compact: boolean;
    isSolutionView: boolean;
}) {
    const propertyName = data.propertyLaw ? PROPERTY_NAMES[data.propertyLaw].toLowerCase() : 'pattern rule';
    return (
        <div className={`${compact ? 'w-[760px]' : 'w-[780px]'} rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]`}>
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Explain the number pattern</div>
            <div className="mt-2 text-center text-xl font-bold leading-relaxed text-slate-800">
                Explain why this feature continues: {data.inferredFeature}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Rule</div>
                    <div className="mt-1 text-lg font-bold text-sky-950">{data.ruleText}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Why it works</div>
                    <div className="mt-1 text-base font-bold text-amber-950">Use the {propertyName} and the visible terms.</div>
                </div>
            </div>
            <TermStrip data={data} hiddenIndex={null} />
            <PropertyBody data={data} />
            <div className={`mt-5 min-h-[92px] rounded-xl border-2 p-5 text-center text-base leading-relaxed ${isSolutionView ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-400'}`}>
                {isSolutionView ? data.explanation : 'Write why this feature continues.'}
            </div>
        </div>
    );
}

export const PatternExplanationView = ({mode, payload, viewId}: PatternExplanationViewProps) => {
    const {problem, isSolutionView, seed} = payload;
    validatePattern(viewId, problem.data);
    return mode === 'generation-practice'
        ? <GenerationPractice data={problem.data} seed={seed} isSolutionView={isSolutionView} />
        : <Explanation data={problem.data} compact={mode === 'legacy-explanation'} isSolutionView={isSolutionView} />;
};
