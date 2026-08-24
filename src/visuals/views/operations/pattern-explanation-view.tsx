import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {ArithmeticRecurrencePatternProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    featureEvidence,
    featureExplanation,
    featureStatement,
    isValidRecurrence,
    lawPresentation,
    recurrenceRule,
    recurrenceStart
} from './pattern-table-helpers.ts';

export type PatternExplanationMode = 'legacy-explanation' | 'generation-practice' | 'feature-explanation';

interface PatternExplanationViewProps {
    mode: PatternExplanationMode;
    payload: RenderPayload<AbstractProblem<ArithmeticRecurrencePatternProblem>>;
    viewId: string;
    missingTermIndex?: number;
}

function fail(viewId: string, message: string): never {
    throw new ViewValidationError(viewId, message);
}

function validatePattern(viewId: string, data: ArithmeticRecurrencePatternProblem) {
    validateProblemData(viewId, data, ['kind', 'recurrence', 'terms', 'emergentFeature']);
    if (data.kind !== 'recurrence' || !isValidRecurrence(data)) {
        fail(viewId, 'The supplied terms, emergent feature, and law witness must be mathematically coherent.');
    }
}

function PropertyBody({data}: {data: ArithmeticRecurrencePatternProblem}) {
    const presentation = lawPresentation(data);
    if (!presentation) {
        const propertyEquation = data.recurrence.kind === 'add-constant'
            ? 'odd + odd = even  •  even + odd = odd'
            : 'whole number × even = even';
        return (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-center text-amber-950">
                <div className="font-mono text-base font-extrabold">{propertyEquation}</div>
                <div className="mt-2 font-semibold">{featureEvidence(data)}</div>
            </div>
        );
    }

    return (
        <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-4 text-center">
            <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Property witness</div>
            <div className="mt-2 font-mono text-lg font-bold text-violet-950">
                {presentation.leftExpression} = {presentation.rightExpression} = {presentation.result}
            </div>
        </div>
    );
}

function TermStrip({data, hiddenIndex}: {
    data: ArithmeticRecurrencePatternProblem;
    hiddenIndex: number | null;
}) {
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

function GenerationPractice({data, missingTermIndex, isSolutionView, viewId}: {
    data: ArithmeticRecurrencePatternProblem;
    missingTermIndex?: number;
    isSolutionView: boolean;
    viewId: string;
}) {
    if (!Number.isInteger(missingTermIndex)
        || missingTermIndex! < 2
        || missingTermIndex! >= data.terms.length) {
        fail(viewId, 'The generation view requires a valid configured missing-term index.');
    }
    return (
        <div className="w-[760px] rounded-2xl border-l-8 border-violet-500 bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Reason through the number pattern</div>
            <div className="mt-2 text-xl font-bold leading-relaxed text-slate-800">Follow the rule to find the missing term in the pattern.</div>
            <div className="mt-5 grid grid-cols-[150px_1fr] overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-slate-100 px-4 py-4 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Start</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-slate-900">{recurrenceStart(data)}</div>
                </div>
                <div className="border-l border-slate-200 bg-white px-5 py-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Stated rule</div>
                    <div className="mt-1 text-lg font-bold text-violet-950">{recurrenceRule(data)}</div>
                </div>
            </div>
            <TermStrip data={data} hiddenIndex={isSolutionView ? null : missingTermIndex!} />
            <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-lg font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-dashed border-emerald-300 bg-white text-emerald-700'}`}>
                {isSolutionView ? `The missing term is ${data.terms[missingTermIndex!]}.` : 'Missing term: __________'}
            </div>
        </div>
    );
}

function Explanation({data, compact, requiresExecution, isSolutionView}: {
    data: ArithmeticRecurrencePatternProblem;
    compact: boolean;
    requiresExecution: boolean;
    isSolutionView: boolean;
}) {
    const propertyName = lawPresentation(data)?.name.toLowerCase() ?? 'pattern rule';
    return (
        <div className={`${compact ? 'w-[760px]' : 'w-[780px]'} rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]`}>
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Explain the number pattern</div>
            <div className="mt-2 text-center text-xl font-bold leading-relaxed text-slate-800">
                {requiresExecution ? 'Complete the missing term, then explain' : 'Explain'} why this feature continues: {featureStatement(data)}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Rule</div>
                    <div className="mt-1 text-lg font-bold text-sky-950">{recurrenceRule(data)}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Why it works</div>
                    <div className="mt-1 text-base font-bold text-amber-950">Use the {propertyName} and the visible terms.</div>
                </div>
            </div>
            <TermStrip data={data} hiddenIndex={requiresExecution && !isSolutionView ? 3 : null} />
            {requiresExecution && isSolutionView && (
                <div className="mt-3 text-center font-bold text-emerald-700">
                    Missing term: {data.terms[3]}
                </div>
            )}
            <PropertyBody data={data} />
            <div className={`mt-5 min-h-[92px] rounded-xl border-2 p-5 text-center text-base leading-relaxed ${isSolutionView ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-400'}`}>
                {isSolutionView ? featureExplanation(data) : 'Write why this feature continues.'}
            </div>
        </div>
    );
}

export const PatternExplanationView = ({
    mode,
    payload,
    viewId,
    missingTermIndex
}: PatternExplanationViewProps) => {
    const {problem, isSolutionView} = payload;
    validatePattern(viewId, problem.data);
    return mode === 'generation-practice'
        ? <GenerationPractice
            data={problem.data}
            missingTermIndex={missingTermIndex}
            isSolutionView={isSolutionView}
            viewId={viewId}
        />
        : <Explanation
            data={problem.data}
            compact={mode === 'legacy-explanation'}
            requiresExecution={mode === 'feature-explanation'}
            isSolutionView={isSolutionView}
        />;
};
