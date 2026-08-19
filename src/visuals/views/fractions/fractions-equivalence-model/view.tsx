import {Ability} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    FractionValue,
    ProperFractionEquivalenceProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    FractionsEquivalenceModelViewConfig,
    FractionsEquivalenceModelViewSchema
} from './spec.ts';
import {
    isValidTenthsToHundredthsProblem,
    TenthsToHundredthsModel
} from '../tenths-hundredths-grid.tsx';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-equivalence-model';
const DENOMINATORS = [2, 3, 4, 6, 8];

interface CoreProps {
    config: FractionsEquivalenceModelViewConfig;
    payload: ViewRenderPayload<'fractions-equivalence-model'>;
}

interface FractionNotationProps {
    numerator: number | '?';
    denominator: number;
}

const FractionNotation = ({numerator, denominator}: FractionNotationProps) => (
    <span className="inline-grid min-w-[2.2rem] grid-rows-2 text-center align-middle text-[1.35rem] font-bold leading-[1.05] text-slate-800">
        <span className="border-b-2 border-slate-700 px-1 pb-0.5">{numerator}</span>
        <span className="px-1 pt-0.5">{denominator}</span>
    </span>
);

const FractionBar = ({fraction}: {fraction: FractionValue}) => (
    <div
        className="grid h-[70px] w-[650px] overflow-hidden rounded-lg border-[3px] border-slate-700 bg-white"
        style={{gridTemplateColumns: `repeat(${fraction.denominator}, minmax(0, 1fr))`}}
        aria-label={`${fraction.numerator} of ${fraction.denominator} equal parts shaded`}
    >
        {Array.from({length: fraction.denominator}, (_, index) => (
            <div
                key={index}
                className={`${index < fraction.numerator ? 'bg-blue-500' : 'bg-white'} ${
                    index > 0 ? 'border-l-2 border-slate-600' : ''
                }`}
            />
        ))}
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
        || fraction.numerator > fraction.denominator) {
        throw new ViewValidationError(VIEW_ID, `${name} fraction cannot be rendered as a portion of one whole.`);
    }
    if (fraction.notation !== `${fraction.numerator}/${fraction.denominator}`) {
        throw new ViewValidationError(VIEW_ID, `${name} fraction notation is inconsistent.`);
    }
};

const hasExactAbilities = (
    actual: readonly string[] | undefined,
    expected: readonly string[]
): boolean => Array.isArray(actual)
    && actual.length === expected.length
    && expected.every(ability => actual.includes(ability));

const equivalenceExplanation = (data: ProperFractionEquivalenceProblem): string =>
    `${data.first.notation} is equivalent to ${data.second.notation} because its numerator and denominator are multiplied by ${data.scaleFactor}.`;

const FractionsEquivalenceModelCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    if (data.task === 'tenths-to-hundredths') {
        validateProblemData(VIEW_ID, data, [
            'task',
            'tenths',
            'hundredths',
            'scaleFactor',
            'sharedWhole',
            'numeratorScale',
            'denominatorScale',
            'models',
            'relation',
            'equation'
        ]);
        if (!isValidTenthsToHundredthsProblem(data)) {
            throw new ViewValidationError(
                VIEW_ID,
                'Tenths-to-hundredths data must contain one coherent shared whole, ×10 scaling, and equality.'
            );
        }
        const formalizationOnly = hasExactAbilities(
            config.taskAbilities,
            [Ability.Formalization]
        );
        const explainsProcedure = hasExactAbilities(
            config.taskAbilities,
            [Ability.Formalization, Ability.ProcedureUnderstanding]
        );
        if (!formalizationOnly && !explainsProcedure) {
            throw new ViewValidationError(
                VIEW_ID,
                'Base-ten equivalence requires Formalization, optionally with ProcedureUnderstanding.'
            );
        }
        return (
            <TenthsToHundredthsModel
                data={data}
                isSolutionView={isSolutionView}
                explainScaling={explainsProcedure}
            />
        );
    }
    validateProblemData(VIEW_ID, data, [
        'task',
        'first',
        'second',
        'scaleFactor',
        'relation',
        'equation'
    ]);

    if (data.task !== 'relate-equivalent-fractions') {
        throw new ViewValidationError(VIEW_ID, 'Expected a proper-fraction equivalence relation.');
    }
    validateFraction('First', data.first);
    validateFraction('Second', data.second);
    if ((data.scaleFactor !== 2 && data.scaleFactor !== 3 && data.scaleFactor !== 4)
        || data.second.numerator !== data.first.numerator * data.scaleFactor
        || data.second.denominator !== data.first.denominator * data.scaleFactor) {
        throw new ViewValidationError(VIEW_ID, 'The second fraction must scale both terms of the first by the declared factor.');
    }
    if (data.relation !== 'equal'
        || data.equation !== `${data.first.notation} = ${data.second.notation}`) {
        throw new ViewValidationError(VIEW_ID, 'The equivalence relation and equation are inconsistent.');
    }

    const isClassification = hasExactAbilities(
        config.taskAbilities,
        [Ability.ConceptClassification]
    );
    const formalizationOnly = hasExactAbilities(
        config.taskAbilities,
        [Ability.Formalization]
    );
    const explainsProcedure = hasExactAbilities(
        config.taskAbilities,
        [Ability.Formalization, Ability.ProcedureUnderstanding]
    );
    const requestsCompletion = formalizationOnly || explainsProcedure;
    if (!isClassification && !requestsCompletion) {
        throw new ViewValidationError(
            VIEW_ID,
            'Proper-fraction equivalence requires ConceptClassification or Formalization, optionally with ProcedureUnderstanding.'
        );
    }

    const secondNumerator = requestsCompletion && !isSolutionView ? '?' : data.second.numerator;
    const prompt = isClassification
        ? 'Are these fractions equivalent?'
        : explainsProcedure
            ? 'Complete the equivalent fraction. Then explain why the value stays the same.'
            : 'Complete the equivalent fraction.';

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.5rem] font-bold text-slate-800">{prompt}</div>
            <div className="mt-6 space-y-6">
                <div className="grid grid-cols-[120px_1fr] items-center gap-5">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">First</span>
                        <FractionNotation numerator={data.first.numerator} denominator={data.first.denominator} />
                    </div>
                    <FractionBar fraction={data.first} />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-5">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Second</span>
                        <FractionNotation numerator={secondNumerator} denominator={data.second.denominator} />
                    </div>
                    <FractionBar fraction={data.second} />
                </div>
            </div>

            <div className={`mt-7 rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="flex items-center justify-center gap-3 text-xl font-bold">
                            <FractionNotation numerator={data.first.numerator} denominator={data.first.denominator} />
                            <span>=</span>
                            <FractionNotation numerator={data.second.numerator} denominator={data.second.denominator} />
                        </div>
                        <div className="mt-3 text-[1.05rem] font-semibold">
                            {explainsProcedure
                                ? equivalenceExplanation(data)
                                : isClassification
                                    ? 'The two fractions are equivalent.'
                                    : `The missing numerator is ${data.second.numerator}.`}
                        </div>
                    </>
                ) : requestsCompletion ? (
                    <div className="flex items-center justify-center gap-3 text-xl font-bold">
                        <FractionNotation numerator={data.first.numerator} denominator={data.first.denominator} />
                        <span>=</span>
                        <FractionNotation numerator="?" denominator={data.second.denominator} />
                    </div>
                ) : (
                    <div className="text-xl font-bold">Equivalent or not equivalent?</div>
                )}
            </div>
        </div>
    );
};

export const FractionsEquivalenceModel = withConfig(
    FractionsEquivalenceModelViewSchema,
    FractionsEquivalenceModelCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-equivalence-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsEquivalenceModel payload={payload} />);
    }
};
