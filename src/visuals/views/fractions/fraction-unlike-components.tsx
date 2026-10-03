import {
    UnlikeFractionArithmeticPresentation,
    UnlikePartitionGroup,
    UnlikePartitionModel
} from './fraction-unlike-presentation.ts';

const roleStyle: Record<UnlikePartitionGroup['role'], string> = {
    first: 'bg-sky-300',
    second: 'bg-amber-300',
    remaining: 'bg-emerald-300',
    removed: 'bg-rose-200 bg-[repeating-linear-gradient(135deg,#fecdd3_0,#fecdd3_5px,#fff1f2_5px,#fff1f2_10px)]'
};

const roleName: Record<UnlikePartitionGroup['role'], string> = {
    first: 'First amount',
    second: 'Second amount',
    remaining: 'Remaining',
    removed: 'Removed'
};

/** Spell out the whole part in compact model labels so 1 7/8 cannot read as 17/8. */
const readableMixedLabel = (label: string): string => label.replace(
    /(\d+) (\d+\/\d+)/g,
    (_, whole: string, fraction: string) =>
        `${whole} ${whole === '1' ? 'whole' : 'wholes'} + ${fraction}`
);

const PartitionedBars = ({
    model,
    title,
    ariaLabel,
    compact = false
}: {
    model: UnlikePartitionModel;
    title: string;
    ariaLabel: string;
    compact?: boolean;
}) => {
    const frameCount = Math.max(1, Math.ceil(model.totalParts / model.denominator));
    const starts = model.groups.map((_, groupIndex) => model.groups
        .slice(0, groupIndex).reduce((sum, group) => sum + group.count, 0));
    const groupFor = (partIndex: number): UnlikePartitionGroup | null => {
        const index = model.groups.findIndex((group, groupIndex) =>
            partIndex >= starts[groupIndex]!
                && partIndex < starts[groupIndex]! + group.count
        );
        return index < 0 ? null : model.groups[index]!;
    };

    return (
        <section
            className={`rounded-xl border-2 border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'}`}
            role="img"
            aria-label={ariaLabel}
        >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
                    {title}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-sm font-bold text-slate-800">
                    {readableMixedLabel(model.display)}
                </span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                {Array.from({length: frameCount}, (_, frameIndex) => (
                    <div key={frameIndex} className="w-[192px] shrink-0">
                        <div
                            className="grid h-10 overflow-hidden rounded-md border-2 border-slate-700 bg-white"
                            style={{gridTemplateColumns: `repeat(${model.denominator}, minmax(0, 1fr))`}}
                            aria-hidden="true"
                        >
                            {Array.from({length: model.denominator}, (_, cellIndex) => {
                                const group = groupFor(frameIndex * model.denominator + cellIndex);
                                return (
                                    <span
                                        key={cellIndex}
                                        className={`${cellIndex === 0 ? '' : 'border-l border-slate-500'} ${
                                            group ? roleStyle[group.role] : 'bg-white'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                        <div className="mt-1 text-center text-[0.65rem] font-bold uppercase tracking-wide text-slate-500">
                            {frameCount === 1 ? 'same one-mile whole' : `mile ${frameIndex + 1}`}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
                {model.groups.filter(group => group.count > 0).map((group, index) => (
                    <span key={`${group.role}-${index}`} className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700">
                        {roleName[group.role]}: {readableMixedLabel(group.label)}
                    </span>
                ))}
            </div>
        </section>
    );
};

const BlankConversion = ({original, position}: {original: string; position: string}) => (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3">
        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
            {position} equivalent amount
        </div>
        <div className="mt-2 text-center font-mono text-base font-bold text-slate-700">
            {original} = ________
        </div>
        <div className="mt-2 text-center text-xs font-semibold text-slate-500">
            Choose a common denominator and show the same factor above and below.
        </div>
    </div>
);

const Conversion = ({
    operand,
    position
}: {
    operand: UnlikeFractionArithmeticPresentation['first'];
    position: string;
}) => (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
        <div className="text-xs font-extrabold uppercase tracking-wide text-blue-800">
            {position} equivalent amount · factor {operand.factor}
        </div>
        <div className="mt-2 text-center font-mono text-sm font-bold text-slate-900">
            {operand.fractionalConversionEquation}
        </div>
        {operand.mixedConversionEquation && (
            <div className="mt-2 text-center font-mono text-sm font-bold text-slate-900">
                {operand.mixedConversionEquation}
            </div>
        )}
    </div>
);

export const UnlikeFractionArithmeticWork = ({
    data,
    isSolutionView
}: {
    data: UnlikeFractionArithmeticPresentation;
    isSolutionView: boolean;
}) => (
    <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-700">
            Both amounts use the same one-mile whole. Their original partitions differ.
        </div>
        <div className="grid grid-cols-2 gap-4">
            <PartitionedBars
                model={data.first.original}
                title="First given amount · original parts"
                ariaLabel={`First given amount ${data.first.originalDisplay} miles, shown as ${data.first.original.totalParts} parts with ${data.first.original.denominator} equal parts per mile.`}
                compact
            />
            <PartitionedBars
                model={data.second.original}
                title="Second given amount · original parts"
                ariaLabel={`Second given amount ${data.second.originalDisplay} miles, shown as ${data.second.original.totalParts} parts with ${data.second.original.denominator} equal parts per mile.`}
                compact
            />
        </div>
        <div className={`rounded-xl border-2 px-5 py-3 text-center font-mono text-xl font-extrabold ${
            isSolutionView
                ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                : 'border-dashed border-slate-300 bg-slate-50 text-slate-700'
        }`}>
            {isSolutionView ? data.solutionEquation : data.questionEquation}
        </div>
        <div className="grid grid-cols-2 gap-4">
            {isSolutionView ? (
                <>
                    <Conversion operand={data.first} position="First" />
                    <Conversion operand={data.second} position="Second" />
                </>
            ) : (
                <>
                    <BlankConversion original={data.first.originalDisplay} position="First" />
                    <BlankConversion original={data.second.originalDisplay} position="Second" />
                </>
            )}
        </div>
        {isSolutionView ? (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <PartitionedBars
                        model={data.first.converted}
                        title="First amount · common parts"
                        ariaLabel={`First amount ${data.first.equivalentDisplay} miles, equivalent to ${data.first.originalDisplay}, now shown in ${data.commonDenominator} equal parts per mile.`}
                        compact
                    />
                    <PartitionedBars
                        model={data.second.converted}
                        title="Second amount · common parts"
                        ariaLabel={`Second amount ${data.second.equivalentDisplay} miles, equivalent to ${data.second.originalDisplay}, now shown in ${data.commonDenominator} equal parts per mile.`}
                        compact
                    />
                </div>
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-center font-mono text-base font-bold text-slate-900">
                    <div>{data.commonOperationEquation}</div>
                    <div className="mt-1">{data.normalizationEquation}</div>
                </div>
                <PartitionedBars
                    model={data.resultModel}
                    title={data.operation === 'addition' ? 'Join in common parts' : 'Remove in common parts'}
                    ariaLabel={data.operation === 'addition'
                        ? `The common-part model joins ${data.first.equivalentDisplay} and ${data.second.equivalentDisplay} of the same one-mile whole to make ${data.resultDisplay} miles.`
                        : `The common-part model shows ${data.second.equivalentDisplay} removed from ${data.first.equivalentDisplay}, leaving ${data.resultDisplay} miles.`}
                />
            </>
        ) : (
            <div className="flex min-h-[100px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm font-bold text-slate-500">
                Common-part models, completed calculation, and result go here.
            </div>
        )}
    </div>
);
