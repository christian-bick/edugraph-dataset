import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {WholeNumberFractionEquivalenceProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    FractionsWholeEquivalenceViewConfig,
    FractionsWholeEquivalenceViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-whole-equivalence';
const DENOMINATORS = [2, 3, 4, 6, 8];

interface CoreProps {
    config: FractionsWholeEquivalenceViewConfig;
    payload: ViewRenderPayload<'fractions-whole-equivalence'>;
}

const FractionNotation = ({
    numerator,
    denominator
}: {
    numerator: number | '?';
    denominator: number;
}) => (
    <span className="inline-grid min-w-[2.5rem] grid-rows-2 text-center align-middle text-[1.5rem] font-bold leading-[1.05] text-slate-800">
        <span className="border-b-2 border-slate-700 px-1.5 pb-0.5">{numerator}</span>
        <span className="px-1.5 pt-0.5">{denominator}</span>
    </span>
);

const validateWholeFraction = (data: WholeNumberFractionEquivalenceProblem) => {
    validateProblemData(VIEW_ID, data, [
        'task',
        'wholeNumber',
        'fraction',
        'relation',
        'equation',
        'explanation',
        'answer'
    ]);

    if (data.task !== 'represent-whole-as-fraction'
        || !Number.isInteger(data.wholeNumber)
        || data.wholeNumber < 1
        || data.wholeNumber > 3) {
        throw new ViewValidationError(VIEW_ID, 'Expected a whole number from 1 through 3 to express as a fraction.');
    }
    if (!data.fraction
        || typeof data.fraction !== 'object'
        || !Number.isInteger(data.fraction.numerator)
        || !Number.isInteger(data.fraction.denominator)
        || !DENOMINATORS.includes(data.fraction.denominator)
        || data.fraction.numerator !== data.wholeNumber * data.fraction.denominator
        || data.fraction.notation !== `${data.fraction.numerator}/${data.fraction.denominator}`) {
        throw new ViewValidationError(VIEW_ID, 'The fraction must contain one denominator-sized group for each whole.');
    }
    if (data.relation !== 'equal'
        || data.equation !== `${data.wholeNumber} = ${data.fraction.notation}`
        || data.answer !== data.fraction.notation) {
        throw new ViewValidationError(VIEW_ID, 'The equality, equation, and answer must agree with the whole and fraction.');
    }
    if (typeof data.explanation !== 'string') {
        throw new ViewValidationError(VIEW_ID, 'The whole-number equivalence explanation must be text.');
    }

    const explanation = data.explanation.toLowerCase();
    if (!explanation.includes(String(data.wholeNumber))
        || !explanation.includes(data.fraction.notation.toLowerCase())
        || !explanation.includes(`${data.fraction.denominator}/${data.fraction.denominator}`)) {
        throw new ViewValidationError(VIEW_ID, 'The explanation must connect the whole and fraction through complete denominator-sized groups.');
    }
};

const FractionsWholeEquivalenceCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['task']);
    if (data.task !== 'represent-whole-as-fraction') {
        throw new ViewValidationError(VIEW_ID, 'Expected a whole-number fraction-equivalence task.');
    }
    validateWholeFraction(data);

    const unitWhole = `${data.fraction.denominator}/${data.fraction.denominator}`;
    const wholeParts = Array.from({length: data.wholeNumber}, (_, index) => index);

    return (
        <div className="w-[860px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-bold text-slate-800">
                Express {data.wholeNumber} as a fraction with denominator {data.fraction.denominator}.
            </div>

            <div className="mt-7 flex items-center justify-center gap-6 rounded-2xl bg-slate-50 px-8 py-7">
                <span className="text-[3.2rem] font-extrabold text-blue-700">{data.wholeNumber}</span>
                <span className="text-[2.2rem] font-bold text-slate-500">=</span>
                <FractionNotation
                    numerator={isSolutionView ? data.fraction.numerator : '?'}
                    denominator={data.fraction.denominator}
                />
            </div>

            <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 px-6 py-5 text-center text-slate-700">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-sky-700">
                    Build from complete wholes
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-lg font-semibold">
                    {wholeParts.map(index => (
                        <span key={index} className="flex items-center gap-3">
                            <span>{unitWhole}</span>
                            {index < wholeParts.length - 1 && <span className="text-slate-400">+</span>}
                        </span>
                    ))}
                    <span className="text-slate-400">=</span>
                    <FractionNotation
                        numerator={isSolutionView ? data.fraction.numerator : '?'}
                        denominator={data.fraction.denominator}
                    />
                </div>
            </div>

            <div className={`mt-6 rounded-xl border-2 px-5 py-4 text-center text-lg font-semibold ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView
                    ? `${data.equation}. ${data.explanation}`
                    : `Count the numerator parts needed for ${data.wholeNumber} complete ${data.wholeNumber === 1 ? 'whole' : 'wholes'}.`}
            </div>
        </div>
    );
};

export const FractionsWholeEquivalence = withConfig(
    FractionsWholeEquivalenceViewSchema,
    FractionsWholeEquivalenceCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-whole-equivalence'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsWholeEquivalence payload={payload} />);
    }
};
