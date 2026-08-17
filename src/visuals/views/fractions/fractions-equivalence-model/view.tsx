import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {FractionScalingBar, FractionScalingProblem, FractionValue} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    FractionsEquivalenceModelViewConfig,
    FractionsEquivalenceModelViewSchema
} from './spec.ts';
import {isValidFractionScalingProblem} from '../../../helpers/fraction-equivalence-scaling.ts';
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

const ScalingFractionBar = ({
    model,
    groupSize,
    label,
    revealCount
}: {
    model: FractionScalingBar;
    groupSize: number;
    label: string;
    revealCount: boolean;
}) => (
    <div className="space-y-2">
        <div
            className="grid h-[76px] w-[650px] overflow-hidden rounded-lg border-[3px] border-slate-700 bg-white"
            style={{gridTemplateColumns: `repeat(${model.partCount}, minmax(0, 1fr))`}}
            role="img"
            aria-label={revealCount
                ? `${model.shadedCount} of ${model.partCount} equal parts shaded in ${label}`
                : `${label} uses smaller equal parts and preserves the same shaded length; the missing scaled numerator is not stated`}
        >
            {Array.from({length: model.partCount}, (_, index) => (
                <div
                    key={index}
                    className={`${index < model.shadedCount ? 'bg-blue-500' : 'bg-white'} ${
                        index > 0
                            ? index % groupSize === 0
                                ? 'border-l-[4px] border-slate-700'
                                : 'border-l border-slate-500'
                            : ''
                    }`}
                />
            ))}
        </div>
        <div className="text-center text-[0.78rem] font-semibold text-slate-500">
            {label}
        </div>
    </div>
);

const ScalingEquivalenceModel = ({
    data,
    isSolutionView
}: {
    data: FractionScalingProblem;
    isSolutionView: boolean;
}) => (
    <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
        <div className="text-center text-[1.42rem] font-bold text-slate-800">
            Scale both the numerator and denominator by {data.scaleFactor}.
        </div>
        <div className="mt-2 text-center text-[1.08rem] font-semibold text-slate-600">
            Complete <span className="font-extrabold text-blue-700">{data.questionEquation}</span> using one shared whole.
        </div>

        <div className="mt-6 space-y-5">
            <div className="grid grid-cols-[120px_1fr] items-center gap-5">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Original</span>
                    <FractionNotation numerator={data.first.numerator} denominator={data.first.denominator} />
                </div>
                <ScalingFractionBar
                    model={data.barModel.first}
                    groupSize={1}
                    label={`${data.first.denominator} equal parts; each part is ${data.firstUnitPart}`}
                    revealCount
                />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-5">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Scaled</span>
                    <FractionNotation
                        numerator={isSolutionView ? data.second.numerator : '?'}
                        denominator={data.second.denominator}
                    />
                </div>
                <ScalingFractionBar
                    model={data.barModel.second}
                    groupSize={data.scaleFactor}
                    label={`Each original part becomes ${data.scaleFactor} smaller equal parts of size ${data.secondUnitPart}`}
                    revealCount={isSolutionView}
                />
            </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-[0.92rem] font-bold text-blue-800">
            <span>{data.numeratorScale.from} × {data.scaleFactor} = {isSolutionView ? data.numeratorScale.result : '?'}</span>
            <span className="text-blue-300">•</span>
            <span>{data.denominatorScale.equation}</span>
        </div>

        <div className={`mt-4 rounded-xl border-2 px-5 py-4 text-center ${
            isSolutionView
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
        }`}>
            {isSolutionView ? (
                <>
                    <div className="text-[1.08rem] font-extrabold">{data.scalingEquation}</div>
                    <div className="mt-2 text-[0.95rem] font-bold">{data.answerStatement}</div>
                    <div className="mt-1 text-[0.88rem] font-semibold leading-snug text-slate-700">{data.explanation}</div>
                </>
            ) : (
                <div className="text-[1.05rem] font-bold">{data.questionEquation}</div>
            )}
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
        || fraction.numerator > fraction.denominator) {
        throw new ViewValidationError(VIEW_ID, `${name} fraction cannot be rendered as a portion of one whole.`);
    }
    if (fraction.notation !== `${fraction.numerator}/${fraction.denominator}`) {
        throw new ViewValidationError(VIEW_ID, `${name} fraction notation is inconsistent.`);
    }
};

const FractionsEquivalenceModelCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    if (data.task === 'scale-equivalence') {
        validateProblemData(VIEW_ID, data, [
            'task',
            'first',
            'second',
            'scaleFactor',
            'sharedWhole',
            'numeratorScale',
            'denominatorScale',
            'questionEquation',
            'scalingEquation',
            'firstUnitPart',
            'secondUnitPart',
            'barModel',
            'numberLineModel',
            'relation',
            'answer',
            'answerStatement',
            'explanation'
        ]);
        if (!isValidFractionScalingProblem(data)) {
            throw new ViewValidationError(VIEW_ID, 'Grade 4 scaling requires one coherent shared-whole model and equation.');
        }
        return <ScalingEquivalenceModel data={data} isSolutionView={isSolutionView} />;
    }
    validateProblemData(VIEW_ID, data, [
        'task',
        'first',
        'second',
        'scaleFactor',
        'relation',
        'equation',
        'explanation',
        'answer'
    ]);

    if (data.task !== 'recognize-equivalence' && data.task !== 'generate-equivalence') {
        throw new ViewValidationError(VIEW_ID, 'Expected an equivalence recognition or generation task.');
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

    if (typeof data.explanation !== 'string') {
        throw new ViewValidationError(VIEW_ID, 'The equivalence explanation must be text.');
    }
    const explanation = data.explanation.toLowerCase();
    if (!explanation.includes(data.first.notation.toLowerCase())
        || !explanation.includes(data.second.notation.toLowerCase())
        || !explanation.includes(String(data.scaleFactor))
        || !explanation.includes('multipl')
        || !explanation.includes('numerator')
        || !explanation.includes('denominator')) {
        throw new ViewValidationError(VIEW_ID, 'The explanation must name both fractions and the multiplication applied to both terms.');
    }

    const expectedAnswer = data.task === 'recognize-equivalence'
        ? 'equivalent'
        : data.second.notation;
    if (data.answer !== expectedAnswer) {
        throw new ViewValidationError(VIEW_ID, 'The answer does not match the equivalence task.');
    }

    const isGeneration = data.task === 'generate-equivalence';
    const secondNumerator = isGeneration && !isSolutionView ? '?' : data.second.numerator;
    const prompt = isGeneration
        ? 'Complete the equivalent fraction.'
        : 'Are these fractions equivalent?';

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
                        <div className="mt-3 text-[1.05rem] font-semibold">{data.explanation}</div>
                    </>
                ) : isGeneration ? (
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
