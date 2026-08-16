import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {FractionComparisonProblem, FractionValue} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    FractionsCompareModelsViewConfig,
    FractionsCompareModelsViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-compare-models';
const DENOMINATORS = [2, 3, 4, 6, 8];

interface CoreProps {
    config: FractionsCompareModelsViewConfig;
    payload: ViewRenderPayload<'fractions-compare-models'>;
}

type FractionTerm = 'numerator' | 'denominator';

const FractionNotation = ({
    fraction,
    emphasizedTerm
}: {
    fraction: FractionValue;
    emphasizedTerm: FractionTerm;
}) => (
    <span className="inline-grid min-w-[3rem] grid-rows-2 text-center align-middle text-[1.65rem] font-bold leading-[1.05] text-slate-800">
        <span className={`rounded-t-md border-b-2 border-slate-700 px-2 pb-1 ${
            emphasizedTerm === 'numerator' ? 'bg-sky-100 text-sky-800' : ''
        }`}>
            {fraction.numerator}
        </span>
        <span className={`rounded-b-md px-2 pt-1 ${
            emphasizedTerm === 'denominator' ? 'bg-violet-100 text-violet-800' : ''
        }`}>
            {fraction.denominator}
        </span>
    </span>
);

const FractionBar = ({fraction, label}: {fraction: FractionValue; label: string}) => (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-4">
        <span className="text-right text-sm font-bold uppercase tracking-[0.1em] text-slate-500">
            {label}
        </span>
        <div
            className="grid h-[68px] w-[650px] overflow-hidden rounded-lg border-[3px] border-slate-700 bg-white"
            style={{gridTemplateColumns: `repeat(${fraction.denominator}, minmax(0, 1fr))`}}
            aria-label={`${fraction.numerator} of ${fraction.denominator} equal parts shaded`}
        >
            {Array.from({length: fraction.denominator}, (_, index) => (
                <div
                    key={index}
                    className={`${index < fraction.numerator ? 'bg-sky-500' : 'bg-white'} ${
                        index > 0 ? 'border-l-2 border-slate-600' : ''
                    }`}
                />
            ))}
        </div>
    </div>
);

const validateFraction = (name: string, fraction: FractionValue) => {
    if (!fraction || typeof fraction !== 'object') {
        throw new ViewValidationError(VIEW_ID, `${name} fraction is missing.`);
    }
    if (!Number.isInteger(fraction.numerator)
        || fraction.numerator < 1
        || !Number.isInteger(fraction.denominator)
        || !DENOMINATORS.includes(fraction.denominator)
        || fraction.numerator >= fraction.denominator) {
        throw new ViewValidationError(VIEW_ID, `${name} must be a supported positive proper fraction.`);
    }
    if (fraction.notation !== `${fraction.numerator}/${fraction.denominator}`) {
        throw new ViewValidationError(VIEW_ID, `${name} fraction notation is inconsistent.`);
    }
};

const validateComparison = (data: FractionComparisonProblem) => {
    if (data.task !== 'compare-fractions') {
        throw new ViewValidationError(VIEW_ID, 'Expected a fraction-comparison task.');
    }
    validateFraction('First', data.first);
    validateFraction('Second', data.second);

    if (data.sharedWhole !== 1) {
        throw new ViewValidationError(VIEW_ID, 'Both fractions must use one shared whole.');
    }

    const isCommonDenominator = data.family === 'common-denominator';
    const isCommonNumerator = data.family === 'common-numerator';
    if (!isCommonDenominator && !isCommonNumerator) {
        throw new ViewValidationError(VIEW_ID, 'Expected a common-numerator or common-denominator comparison.');
    }
    if (isCommonDenominator
        && (data.first.denominator !== data.second.denominator
            || data.first.numerator === data.second.numerator
            || data.sharedComponent !== data.first.denominator)) {
        throw new ViewValidationError(VIEW_ID, 'The common-denominator family must share only its denominator.');
    }
    if (isCommonNumerator
        && (data.first.numerator !== data.second.numerator
            || data.first.denominator === data.second.denominator
            || data.sharedComponent !== data.first.numerator)) {
        throw new ViewValidationError(VIEW_ID, 'The common-numerator family must share only its numerator.');
    }

    const comparison = data.first.numerator * data.second.denominator
        - data.second.numerator * data.first.denominator;
    const expectedRelation = comparison > 0 ? 'greater' : comparison < 0 ? 'less' : 'equal';
    const expectedSymbol = expectedRelation === 'greater' ? '>' : expectedRelation === 'less' ? '<' : '=';
    if (expectedRelation === 'equal'
        || data.relation !== expectedRelation
        || data.symbol !== expectedSymbol) {
        throw new ViewValidationError(VIEW_ID, 'The comparison relation does not match the fractions.');
    }

    const expectedAnswer = `${data.first.notation} ${data.symbol} ${data.second.notation}`;
    if (data.answer !== expectedAnswer) {
        throw new ViewValidationError(VIEW_ID, 'The comparison answer is inconsistent.');
    }
    if (typeof data.rationale !== 'string') {
        throw new ViewValidationError(VIEW_ID, 'The comparison rationale must be text.');
    }
    const rationale = data.rationale.toLowerCase();
    const familyTerm = isCommonDenominator ? 'denominator' : 'numerator';
    if (!rationale.includes(data.first.notation)
        || !rationale.includes(data.second.notation)
        || !rationale.includes(`${familyTerm} ${data.sharedComponent}`)
        || !rationale.includes(data.relation)
        || !rationale.includes('same whole')) {
        throw new ViewValidationError(VIEW_ID, 'The rationale must name both fractions, their shared component, relation, and the same whole.');
    }
};

const FractionsCompareModelsCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'task',
        'first',
        'second',
        'family',
        'sharedComponent',
        'relation',
        'symbol',
        'sharedWhole',
        'answer',
        'rationale'
    ]);
    validateComparison(data);

    const emphasizedTerm: FractionTerm = data.family === 'common-denominator'
        ? 'denominator'
        : 'numerator';
    const sharedDescription = data.family === 'common-denominator'
        ? `Same denominator: ${data.sharedComponent} equal parts in each whole`
        : `Same numerator: ${data.sharedComponent} ${data.sharedComponent === 1 ? 'part' : 'parts'} shaded in each whole`;

    return (
        <div className="w-[930px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-bold text-slate-800">
                Compare the fractions using their shared {emphasizedTerm}.
            </div>

            <div className="mt-5 flex items-center justify-center gap-5">
                <FractionNotation fraction={data.first} emphasizedTerm={emphasizedTerm} />
                <span className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-[2rem] font-extrabold ${
                    isSolutionView
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-dashed border-slate-300 bg-slate-50 text-slate-400'
                }`}>
                    {isSolutionView ? data.symbol : '?'}
                </span>
                <FractionNotation fraction={data.second} emphasizedTerm={emphasizedTerm} />
            </div>

            <div className="mt-5 rounded-2xl border-2 border-slate-200 bg-slate-50 px-6 py-5">
                <div className="mb-4 flex items-center justify-center gap-3 text-sm font-semibold text-slate-600">
                    <span className="rounded-full bg-white px-4 py-1.5 shadow-sm">Both bars represent the same whole</span>
                    <span className={`rounded-full px-4 py-1.5 ${
                        emphasizedTerm === 'denominator'
                            ? 'bg-violet-100 text-violet-800'
                            : 'bg-sky-100 text-sky-800'
                    }`}>
                        {sharedDescription}
                    </span>
                </div>
                <div className="space-y-4">
                    <FractionBar fraction={data.first} label="First" />
                    <FractionBar fraction={data.second} label="Second" />
                </div>
            </div>

            {isSolutionView && (
                <div className="mt-5 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-6 py-4 text-center text-emerald-950">
                    <div className="text-xl font-bold">{data.answer}</div>
                    <div className="mt-2 text-base font-semibold">{data.rationale}</div>
                </div>
            )}
        </div>
    );
};

export const FractionsCompareModels = withConfig(
    FractionsCompareModelsViewSchema,
    FractionsCompareModelsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-compare-models'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsCompareModels payload={payload} />);
    }
};
