import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    ArithmeticPatternExplainFeatureProblem,
    ArithmeticPatternGenerateProblem,
    ArithmeticPatternLegacyProblem,
    ArithmeticPatternProblem,
    ArithmeticPatternProperty
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

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

function assertText(viewId: string, values: readonly string[], message: string) {
    if (values.some(value => typeof value !== 'string' || value.trim().length === 0)) fail(viewId, message);
}

function validateTable(viewId: string, data: ArithmeticPatternProblem) {
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
        || data.sequence.length !== 7
        || data.sequence.some((value, index) => value !== data.table[data.focusRow][index])
        || data.patternStep !== (data.operation === 'addition' ? 1 : data.focusRow)
        || data.patternOptions.length !== 3
        || new Set(data.patternOptions).size !== 3
        || !data.patternOptions.includes(data.patternAnswer)) {
        fail(viewId, 'The supplied arithmetic operation table is inconsistent.');
    }
}

function validateProperty(viewId: string, data: ArithmeticPatternProblem) {
    validateProblemData(viewId, data, [
        'propertyLaw',
        'leftExpression',
        'rightExpression',
        'propertyResult',
        'explanation',
        'highlightedCells'
    ]);
    if (!data.propertyLaw
        || !Object.hasOwn(PROPERTY_NAMES, data.propertyLaw)
        || typeof data.leftExpression !== 'string'
        || data.leftExpression.trim().length === 0
        || typeof data.rightExpression !== 'string'
        || data.rightExpression.trim().length === 0
        || !Number.isSafeInteger(data.propertyResult)
        || typeof data.explanation !== 'string'
        || data.explanation.trim().length === 0
        || !Array.isArray(data.highlightedCells)
        || data.highlightedCells.length === 0
        || !['addition', 'multiplication'].includes(data.operation)
        || data.headers.some((header, index) => header !== index)
        || data.headers.length !== 7
        || data.table.length !== 7
        || data.table.some((row, rowIndex) => (
            row.length !== 7
            || row.some((value, columnIndex) => value !== (data.operation === 'addition'
                ? rowIndex + columnIndex
                : rowIndex * columnIndex))
        ))
        || data.highlightedCells.some(([row, column]) => (
            !Number.isInteger(row)
            || !Number.isInteger(column)
            || row < 0
            || row >= 7
            || column < 0
            || column >= 7
        ))) {
        fail(viewId, 'Invalid property explanation payload.');
    }
}

function validateGrade4(viewId: string, data: ArithmeticPatternExplainFeatureProblem) {
    validateProblemData(viewId, data, [
        'startValue',
        'ruleOperation',
        'ruleValue',
        'ruleText',
        'terms',
        'prompt',
        'inferredFeature',
        'featureEvidence',
        'response'
    ]);
    assertText(
        viewId,
        [
            data.ruleText,
            data.prompt,
            data.inferredFeature,
            data.featureEvidence,
            data.response
        ],
        'The Grade 4 explanation requires a supplied rule, feature, evidence, and response.'
    );
    if (!['add', 'multiply', 'multiply-position'].includes(data.ruleOperation)
        || (data.operation === 'addition') !== (data.ruleOperation === 'add')
        || !Number.isSafeInteger(data.startValue)
        || !Number.isSafeInteger(data.ruleValue)
        || data.ruleValue < 1
        || data.terms.length < 4
        || data.terms.length > 8
        || data.terms[0] !== data.startValue
        || (data.ruleOperation === 'multiply-position'
            ? data.terms.some((term, index) => term !== index * data.ruleValue)
            : data.terms.slice(1).some((term, index) => data.ruleOperation === 'add'
                ? term !== data.terms[index] + data.ruleValue
                : term !== data.terms[index] * data.ruleValue))
        || data.response !== data.explanation) {
        fail(viewId, 'The Grade 4 feature explanation does not agree with its supplied terms or rule.');
    }
}

function validateGrade4Practice(viewId: string, data: ArithmeticPatternGenerateProblem) {
    validateProblemData(viewId, data, [
        'startValue', 'ruleOperation', 'ruleValue', 'ruleText', 'terms', 'prompt', 'response'
    ]);
    assertText(viewId, [data.ruleText, data.prompt], 'The number-pattern task requires a supplied rule and prompt.');
    if (!['add', 'multiply'].includes(data.ruleOperation)
        || (data.operation === 'addition') !== (data.ruleOperation === 'add')
        || !Number.isSafeInteger(data.startValue)
        || !Number.isSafeInteger(data.ruleValue)
        || data.ruleValue < 1
        || data.terms.length < 4
        || data.terms.length > 8
        || data.terms[0] !== data.startValue
        || data.terms.slice(1).some((term, index) => term !== (data.ruleOperation === 'add'
            ? data.terms[index] + data.ruleValue
            : data.terms[index] * data.ruleValue))) {
        fail(viewId, 'The supplied terms do not follow the stated number-pattern rule.');
    }

    validateProblemData(viewId, data, ['missingTermIndex']);
    if (!Number.isInteger(data.missingTermIndex)
        || data.missingTermIndex < 1
        || data.missingTermIndex >= data.terms.length
        || data.response !== data.terms[data.missingTermIndex]) {
        fail(viewId, 'The generated-term response is inconsistent.');
    }
}

function PropertyBody({data}: {data: ArithmeticPatternProblem}) {
    const highlighted = new Set(data.highlightedCells!.map(([row, column]) => `${row}-${column}`));
    const symbol = data.operation === 'addition' ? '+' : '×';
    return (
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
                <div className="text-xs font-bold uppercase tracking-wide text-violet-700">{PROPERTY_NAMES[data.propertyLaw!]}</div>
                <div className="mt-4 font-mono text-xl font-bold text-slate-800">{data.leftExpression} = {data.propertyResult}</div>
                <div className="mt-2 font-mono text-xl font-bold text-slate-800">{data.rightExpression} = {data.propertyResult}</div>
            </div>
        </div>
    );
}

function LegacyExplanation({data, isSolutionView}: {
    data: ArithmeticPatternLegacyProblem;
    isSolutionView: boolean;
}) {
    return (
        <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Explain the pattern</div>
            <div className="mt-1 text-xl font-bold text-slate-800">How does the {PROPERTY_NAMES[data.propertyLaw!].toLowerCase()} explain the selected cells?</div>
            <PropertyBody data={data} />
            <div className={`mt-5 min-h-[92px] rounded-xl border-2 p-5 text-lg ${isSolutionView ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-900' : 'border-dashed border-slate-300 bg-white text-slate-400'}`}>
                {isSolutionView ? data.explanation : 'Write your explanation here.'}
            </div>
        </div>
    );
}

function Grade4Explanation({data, isSolutionView}: {
    data: ArithmeticPatternExplainFeatureProblem;
    isSolutionView: boolean;
}) {
    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Explain the number pattern</div>
            <div className="mt-2 text-center text-xl font-bold leading-relaxed text-slate-800">{data.prompt}</div>
            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Rule</div>
                    <div className="mt-1 text-lg font-bold text-sky-950">{data.ruleText}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Feature to explain</div>
                    <div className="mt-1 text-lg font-bold text-amber-950">{data.inferredFeature}</div>
                </div>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                {data.terms.map((term, index) => (
                    <div className="contents" key={`${index}-${term}`}>
                        {index > 0 && <div className="font-bold text-slate-400">→</div>}
                        <div className="min-w-[58px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-mono text-lg font-bold text-slate-900">{term}</div>
                    </div>
                ))}
            </div>
            <PropertyBody data={data} />
            <div className={`mt-5 min-h-[92px] rounded-xl border-2 p-5 text-center text-base leading-relaxed ${isSolutionView ? 'border-emerald-500 bg-emerald-50 font-semibold text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-400'}`}>
                {isSolutionView ? data.response : 'Write why this feature continues.'}
            </div>
        </div>
    );
}

function PracticeTerms({data, hiddenIndex}: {
    data: ArithmeticPatternGenerateProblem;
    hiddenIndex: number | null;
}) {
    return (
        <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50 p-5">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-violet-700">Follow the rule through the terms</div>
            <div className="mt-4 flex items-center justify-center gap-2">
                {data.terms.map((term, index) => (
                    <div className="contents" key={`${index}-${term}`}>
                        {index > 0 && <div className="font-bold text-violet-400">→</div>}
                        <div className={`flex h-14 min-w-[60px] items-center justify-center rounded-lg border-2 px-3 font-mono text-xl font-bold ${hiddenIndex === index ? 'border-dashed border-emerald-400 bg-white text-emerald-700' : 'border-violet-200 bg-white text-violet-950'}`}>
                            {hiddenIndex === index ? '?' : term}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Grade4Practice({data, isSolutionView}: {
    data: ArithmeticPatternGenerateProblem;
    isSolutionView: boolean;
}) {
    const hiddenIndex = data.task === 'generate' && !isSolutionView ? data.missingTermIndex : null;
    return (
        <div className="w-[760px] rounded-2xl border-l-8 border-violet-500 bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Reason through the number pattern</div>
            <div className="mt-2 text-xl font-bold leading-relaxed text-slate-800">{data.prompt}</div>
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
            <PracticeTerms data={data} hiddenIndex={hiddenIndex} />
            <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-lg font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-dashed border-emerald-300 bg-white text-emerald-700'}`}>
                {isSolutionView ? `The missing term is ${data.response}.` : 'Missing term: __________'}
            </div>
        </div>
    );
}

export const PatternExplanationView = ({
    mode,
    payload,
    viewId
}: PatternExplanationViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, [
        'operation',
        'headers',
        'table',
        'focusRow',
        'sequence',
        'patternStep',
        'patternOptions',
        'patternAnswer'
    ]);
    validateTable(viewId, data);

    if (data.task === 'generate') {
        if (mode !== 'generation-practice') {
            fail(viewId, 'Generated-term payloads require the generation-practice view.');
        }
        validateGrade4Practice(viewId, data);
        return <Grade4Practice data={data} isSolutionView={isSolutionView} />;
    }
    if (data.task === 'identify-feature') {
        return fail(viewId, 'Feature-identification payloads belong to the pattern-table view.');
    }

    validateProperty(viewId, data);
    if (data.task === undefined) {
        if (mode !== 'legacy-explanation') {
            fail(viewId, 'Retained explanations require the legacy-explanation view.');
        }
        return <LegacyExplanation data={data} isSolutionView={isSolutionView} />;
    }
    if (mode !== 'feature-explanation') {
        fail(viewId, 'Generated feature explanations require the feature-explanation view.');
    }

    validateGrade4(viewId, data);
    return <Grade4Explanation data={data} isSolutionView={isSolutionView} />;
};
