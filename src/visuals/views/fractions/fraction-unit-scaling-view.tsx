import type {FractionValue, ProperFractionUnitScalingProblem} from '../../../types/problems.ts';

const PART_COUNTS = [2, 3, 4, 6, 8];

export const isValidUnitScalingProblem = (data: ProperFractionUnitScalingProblem): boolean => {
    const {first, second, scaleFactor, unitMultiplier} = data;
    return data.task === 'relate-equivalent-fractions'
        && data.relation === 'equal'
        && first !== null && typeof first === 'object'
        && second !== null && typeof second === 'object'
        && unitMultiplier !== null && typeof unitMultiplier === 'object'
        && Number.isInteger(first.numerator)
        && Number.isInteger(first.denominator)
        && PART_COUNTS.includes(first.denominator)
        && first.numerator > 0
        && first.numerator < first.denominator
        && Number.isInteger(second.numerator)
        && Number.isInteger(second.denominator)
        && PART_COUNTS.includes(second.denominator)
        && second.numerator === first.numerator * scaleFactor
        && second.denominator === first.denominator * scaleFactor
        && (scaleFactor === 2 || scaleFactor === 3 || scaleFactor === 4)
        && unitMultiplier.numerator === scaleFactor
        && unitMultiplier.denominator === scaleFactor
        && unitMultiplier.value === 1;
};

const Fraction = ({value}: {value: FractionValue}) => (
    <span className="inline-grid min-w-10 grid-rows-2 text-center align-middle text-[1.45rem] font-bold leading-none text-slate-800">
        <span className="border-b-2 border-slate-700 px-1 pb-1">{value.numerator}</span>
        <span className="px-1 pt-1">{value.denominator}</span>
    </span>
);

const Bar = ({fraction}: {fraction: FractionValue}) => (
    <div
        className="grid h-16 w-[610px] overflow-hidden rounded-md border-[3px] border-slate-700 bg-white"
        style={{gridTemplateColumns: `repeat(${fraction.denominator}, minmax(0, 1fr))`}}
        aria-label={`${fraction.numerator} of ${fraction.denominator} equal parts shaded`}
    >
        {Array.from({length: fraction.denominator}, (_, index) => (
            <div
                key={index}
                className={`${index < fraction.numerator ? 'bg-blue-500' : 'bg-white'} ${index ? 'border-l-2 border-slate-600' : ''}`}
            />
        ))}
    </div>
);

const ModelRow = ({title, value}: {title: string; value: FractionValue}) => (
    <div className="grid grid-cols-[112px_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">{title}</span>
            <Fraction value={value} />
        </div>
        <Bar fraction={value} />
    </div>
);

export const FractionUnitScalingBody = ({data, isSolutionView}: {
    data: ProperFractionUnitScalingProblem;
    isSolutionView: boolean;
}) => {
    const {first, second, scaleFactor} = data;
    const unit = data.unitMultiplier;
    return (
        <div className="w-[900px] rounded-2xl bg-white p-8 font-sans text-slate-800 shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-2xl font-bold">Why does this multiplication keep the same value?</div>
            <div className="mt-5 flex items-center justify-center gap-3 rounded-xl bg-slate-50 px-5 py-4 text-xl font-bold">
                <Fraction value={first} />
                <span>×</span>
                <Fraction value={unit} />
                <span>=</span>
                <Fraction value={second} />
                <span className="mx-2 text-slate-400">and</span>
                <Fraction value={unit} />
                <span>= 1</span>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-5">
                <div className="mb-4 text-center text-sm font-semibold text-slate-600">
                    Both bars represent the same whole.
                </div>
                <div className="space-y-5">
                    <ModelRow title="Original" value={first} />
                    <ModelRow title="Scaled" value={second} />
                </div>
            </div>

            <div className={`mt-6 rounded-xl border-2 px-6 py-5 ${
                isSolutionView ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-slate-300 bg-slate-50'
            }`}>
                {isSolutionView ? (
                    <div className="text-center text-lg font-semibold text-emerald-950">
                        {scaleFactor}/{scaleFactor} = 1, so multiplying by it keeps the same quantity. Each original
                        part becomes {scaleFactor} equal smaller parts: both the shaded-part count and the total-part
                        count grow by {scaleFactor}, while the shaded amount stays the same.
                    </div>
                ) : (
                    <div className="text-center text-lg font-semibold text-slate-700">
                        Explain why multiplying by this fraction changes the part counts but not the amount shaded.
                        <div className="mt-4 border-b-2 border-slate-300 pb-4" />
                        <div className="mt-4 border-b-2 border-slate-300 pb-4" />
                    </div>
                )}
            </div>
        </div>
    );
};
