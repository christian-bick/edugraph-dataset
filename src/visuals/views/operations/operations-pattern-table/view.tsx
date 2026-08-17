import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    ArithmeticPatternGenerateProblem,
    ArithmeticPatternIdentifyFeatureProblem,
    ArithmeticPatternLegacyProblem,
    ArithmeticPatternProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {getPatternTaskIdentity, hasConsistentRuleTerms} from './helpers.ts';
import {OperationsPatternTableViewConfig, OperationsPatternTableViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsPatternTableViewConfig;
    payload: ViewRenderPayload<'operations-pattern-table'>;
}

const VIEW_ID = 'operations-pattern-table';
function fail(message: string): never {
    throw new ViewValidationError(VIEW_ID, message);
}

function assertText(values: readonly string[], message: string) {
    if (values.some(value => typeof value !== 'string' || value.trim().length === 0)) fail(message);
}

function validateTable(data: ArithmeticPatternProblem) {
    if (!['addition', 'multiplication'].includes(data.operation)
        || !Array.isArray(data.headers)
        || data.headers.length !== 7
        || data.headers.some((header, index) => header !== index)
        || !Array.isArray(data.table)
        || data.table.length !== 7
        || data.table.some((row, rowIndex) => (
            !Array.isArray(row)
            || row.length !== 7
            || row.some((value, columnIndex) => value !== (data.operation === 'addition'
                ? rowIndex + columnIndex
                : rowIndex * columnIndex))
        ))
        || !Number.isInteger(data.focusRow)
        || data.focusRow < 0
        || data.focusRow >= 7
        || !Array.isArray(data.sequence)
        || data.sequence.length !== 7
        || data.sequence.some((value, index) => value !== data.table[data.focusRow][index])
        || data.patternStep !== (data.operation === 'addition' ? 1 : data.focusRow)
        || !Array.isArray(data.patternOptions)
        || data.patternOptions.length !== 3
        || new Set(data.patternOptions).size !== 3
        || (data.task !== 'identify-feature' && data.patternAnswer !== `Increase by ${data.patternStep}`)
        || !data.patternOptions.includes(data.patternAnswer)) {
        fail('The supplied arithmetic operation table is inconsistent.');
    }
}

function validateGrade4Base(data: Exclude<ArithmeticPatternProblem, ArithmeticPatternLegacyProblem>) {
    validateProblemData(VIEW_ID, data, [
        'startValue', 'ruleOperation', 'ruleValue', 'ruleText', 'terms', 'prompt'
    ]);
    assertText([data.ruleText, data.prompt], 'The number-pattern task requires a supplied rule and prompt.');
    if (!['add', 'multiply'].includes(data.ruleOperation)
        || (data.operation === 'addition') !== (data.ruleOperation === 'add')
        || !hasConsistentRuleTerms(data.startValue, data.ruleOperation, data.ruleValue, data.terms)) {
        fail('The supplied terms do not follow the stated number-pattern rule.');
    }
}

function validateGenerate(data: ArithmeticPatternGenerateProblem) {
    validateProblemData(VIEW_ID, data, ['missingTermIndex', 'response']);
    if (!Number.isInteger(data.missingTermIndex)
        || data.missingTermIndex < 1
        || data.missingTermIndex >= data.terms.length
        || data.response !== data.terms[data.missingTermIndex]) {
        fail('The generated-term response must be the supplied term at the requested position.');
    }
}

function validateIdentify(data: ArithmeticPatternIdentifyFeatureProblem) {
    validateProblemData(VIEW_ID, data, [
        'featureOptions', 'inferredFeature', 'featureEvidence', 'response'
    ]);
    assertText(
        [...data.featureOptions, data.inferredFeature, data.featureEvidence, data.response],
        'The feature task requires complete supplied options, evidence, and response.'
    );
    if (data.featureOptions.length !== 3
        || new Set(data.featureOptions).size !== 3
        || !data.featureOptions.includes(data.inferredFeature)
        || data.patternOptions.some((option, index) => option !== data.featureOptions[index])
        || data.patternAnswer !== data.inferredFeature
        || data.response !== data.inferredFeature) {
        fail('The supplied feature response must identify exactly one listed feature.');
    }
}

function LegacyTable({data, isSolutionView}: {data: ArithmeticPatternLegacyProblem; isSolutionView: boolean}) {
    const symbol = data.operation === 'addition' ? '+' : '×';
    const identity = getPatternTaskIdentity(undefined);
    return (
        <div className="w-[700px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{identity.eyebrow}</div>
            <div className="mt-1 text-xl font-bold text-slate-800">{identity.instruction}</div>
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
        </div>
    );
}

function PatternHeader({data}: {data: Exclude<ArithmeticPatternProblem, ArithmeticPatternLegacyProblem>}) {
    const identity = getPatternTaskIdentity(data.task === 'identify-feature' ? data.task : 'generate');
    return (
        <>
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{identity.eyebrow}</div>
            <div className="mt-2 text-center text-xl font-bold leading-relaxed text-slate-800">{data.prompt}</div>
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

function TermStrip({data, hiddenIndex}: {
    data: Exclude<ArithmeticPatternProblem, ArithmeticPatternLegacyProblem>;
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

function FeatureChoices({data, isSolutionView}: {data: ArithmeticPatternIdentifyFeatureProblem; isSolutionView: boolean}) {
    const identity = getPatternTaskIdentity('identify-feature');
    return (
        <div className="mt-5">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">{identity.instruction}</div>
            <div className="mt-3 grid grid-cols-3 gap-3">
                {data.featureOptions.map(option => (
                    <div className={`flex min-h-[64px] items-center justify-center rounded-xl border-2 px-3 text-center font-bold ${isSolutionView && option === data.response ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white text-slate-700'}`} key={option}>
                        {option}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Grade4Task({data, isSolutionView}: {
    data: ArithmeticPatternGenerateProblem | ArithmeticPatternIdentifyFeatureProblem;
    isSolutionView: boolean;
}) {
    const hiddenIndex = data.task === 'generate' && !isSolutionView ? data.missingTermIndex : null;
    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <PatternHeader data={data} />
            <TermStrip data={data} hiddenIndex={hiddenIndex} />

            {data.task === 'generate' && (
                <div className={`mt-5 rounded-xl border-2 px-5 py-4 text-center text-lg font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-dashed border-emerald-300 bg-white text-emerald-700'}`}>
                    {isSolutionView ? `Missing term: ${data.response}` : 'Missing term: __________'}
                </div>
            )}

            {data.task === 'identify-feature' && (
                <>
                    <FeatureChoices data={data} isSolutionView={isSolutionView} />
                    {isSolutionView && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-center font-semibold text-amber-950">{data.featureEvidence}</div>}
                </>
            )}
        </div>
    );
}

const OperationsPatternTableCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'operation', 'headers', 'table', 'focusRow', 'sequence', 'patternStep', 'patternOptions', 'patternAnswer'
    ]);
    validateTable(data);

    if (data.task === undefined) {
        if (!config.classificationMode) fail('Retained table payloads require classification mode.');
        return <LegacyTable data={data} isSolutionView={isSolutionView} />;
    }

    if (data.task === 'generate') {
        if (config.classificationMode) fail('Generated-term payloads cannot use classification mode.');
        validateGrade4Base(data);
        validateGenerate(data);
    } else if (data.task === 'identify-feature') {
        if (!config.classificationMode) fail('Feature-identification payloads require classification mode.');
        validateGrade4Base(data);
        validateIdentify(data);
    } else {
        return fail('This view supports generated terms and feature identification only.');
    }

    return <Grade4Task data={data} isSolutionView={isSolutionView} />;
};

export const OperationsPatternTable = withConfig(OperationsPatternTableViewSchema, OperationsPatternTableCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-pattern-table'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsPatternTable payload={payload} />);
    }
};
