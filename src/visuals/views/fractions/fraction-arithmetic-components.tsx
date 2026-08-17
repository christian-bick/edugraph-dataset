import {
    FractionArithmeticModel,
    FractionArithmeticModelGroupRole,
    FractionArithmeticProblem
} from '../../../types/problems.ts';

const groupStyles: Record<FractionArithmeticModelGroupRole, string> = {
    'first-addend': 'border-sky-600 bg-sky-200 text-sky-950',
    'second-addend': 'border-amber-600 bg-amber-200 text-amber-950',
    remaining: 'border-emerald-600 bg-emerald-200 text-emerald-950',
    removed: 'border-rose-600 bg-[repeating-linear-gradient(135deg,#fecdd3_0,#fecdd3_6px,#fff1f2_6px,#fff1f2_12px)] text-rose-950',
    'decomposition-part': 'border-violet-600 bg-violet-200 text-violet-950',
    result: 'border-teal-600 bg-teal-200 text-teal-950'
};

const MIXED_NUMBER = /^\d+ \d+\/\d+$/;

export const FractionArithmeticText = ({text}: {text: string}) => (
    <>
        {text.split(/(\d+ \d+\/\d+)/g).filter(Boolean).map((part, index) => {
            if (!MIXED_NUMBER.test(part)) return part;
            const [whole, fraction] = part.split(' ');
            return (
                <span key={index} className="inline-flex items-baseline gap-[0.5em] whitespace-nowrap">
                    <span className="sr-only">{part}</span>
                    <span aria-hidden="true">{whole}</span>
                    <span aria-hidden="true">{fraction}</span>
                </span>
            );
        })}
    </>
);

export const FractionModelDiagram = ({
    model,
    title,
    ariaLabel,
    compact = false
}: {
    model: FractionArithmeticModel;
    title: string;
    ariaLabel: string;
    compact?: boolean;
}) => {
    const groupTokens = new Map(model.groups.map((group, index) => [
        group.id,
        String.fromCharCode(65 + index)
    ]));
    const groupsById = new Map(model.groups.map(group => [group.id, group]));

    return (
        <div
            className={`rounded-xl border-2 border-slate-200 bg-white ${compact ? 'p-3' : 'p-4'}`}
            role="img"
            aria-label={ariaLabel}
        >
            <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-extrabold uppercase tracking-[0.08em] text-slate-600">
                    {title}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                    <FractionArithmeticText text={model.display} />
                </span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
                {model.frames.map(frame => (
                    <div key={frame.frameIndex} className="w-[200px] shrink-0">
                        <div
                            className="grid h-14 overflow-hidden rounded-lg border-[3px] border-slate-700 bg-white"
                            style={{gridTemplateColumns: `repeat(${model.denominator}, minmax(0, 1fr))`}}
                            aria-hidden="true"
                        >
                            {frame.cells.map((cell, localIndex) => {
                                const group = cell.groupId === null ? null : groupsById.get(cell.groupId);
                                return (
                                    <div
                                        key={cell.partIndex}
                                        className={`flex items-center justify-center text-xs font-black ${
                                            localIndex > 0 ? 'border-l-2 border-slate-500' : ''
                                        } ${group ? groupStyles[group.role] : 'bg-white text-slate-300'}`}
                                    >
                                        {cell.groupId === null ? '' : groupTokens.get(cell.groupId)}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-1 text-center text-[0.68rem] font-bold uppercase tracking-wide text-slate-400">
                            {model.frameCount === 1 ? 'same whole' : `whole ${frame.frameIndex + 1}`}
                        </div>
                    </div>
                ))}
            </div>
            {model.groups.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {model.groups.map(group => (
                        <span
                            key={group.id}
                            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${groupStyles[group.role]}`}
                        >
                            {groupTokens.get(group.id)} · <FractionArithmeticText text={group.label} />
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export const EquationPanel = ({
    equation,
    solved
}: {
    equation: string;
    solved: boolean;
}) => (
    <div className={`rounded-xl border-2 px-5 py-3 text-center font-mono text-xl font-extrabold ${
        solved
            ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
            : 'border-dashed border-slate-300 bg-slate-50 text-slate-600'
    }`}>
        <FractionArithmeticText text={equation} />
    </div>
);

const ModelPlaceholder = ({label}: {label: string}) => (
    <div className="flex min-h-[118px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm font-bold text-slate-500">
        {label}
    </div>
);

const OperandModels = ({data}: {data: Extract<FractionArithmeticProblem, {questionModels: unknown}>}) => (
    <div className="grid grid-cols-2 gap-4">
        <FractionModelDiagram
            model={data.questionModels[0]}
            title="First given amount"
            ariaLabel={`The first given amount is ${data.first.notation} of the shared whole, divided into ${data.denominator} equal parts.`}
            compact
        />
        <FractionModelDiagram
            model={data.questionModels[1]}
            title="Second given amount"
            ariaLabel={`The second given amount is ${data.second.notation} of the same shared whole, divided into ${data.denominator} equal parts.`}
            compact
        />
    </div>
);

export const FractionArithmeticWork = ({
    data,
    isSolutionView
}: {
    data: FractionArithmeticProblem;
    isSolutionView: boolean;
}) => {
    if (data.task === 'decompose') {
        return (
            <div className="space-y-4">
                <FractionModelDiagram
                    model={data.sourceModel}
                    title="Source amount"
                    ariaLabel={`${data.sourceDisplay} is shown in equal-width whole frames, each divided into ${data.denominator} equal parts.`}
                />
                <div className="grid grid-cols-2 gap-4">
                    {isSolutionView ? data.decompositions.map((decomposition, index) => (
                        <div key={index} className="space-y-2">
                            <FractionModelDiagram
                                model={decomposition.model}
                                title={`Decomposition ${index + 1}`}
                                ariaLabel={`Decomposition ${index + 1} groups the same ${data.sourceDisplay} amount as ${decomposition.equation}.`}
                                compact
                            />
                            <EquationPanel equation={decomposition.equation} solved />
                        </div>
                    )) : [0, 1].map(index => (
                        <div key={index} className="space-y-2">
                            <ModelPlaceholder label={`Decomposition ${index + 1}: group the same amount in a different way`} />
                            <EquationPanel equation={`${data.sourceDisplay} = ____________________`} solved={false} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const interpretation = data.task === 'interpret-operation';
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-700">
                {interpretation
                    ? `${data.action === 'join' ? 'Join' : 'Separate'} equal parts of the same whole`
                    : `Both operands use ${data.denominator} equal parts in the same whole`}
            </div>
            <OperandModels data={data} />
            <EquationPanel
                equation={isSolutionView ? data.solutionEquation : data.questionEquation}
                solved={isSolutionView}
            />
            {isSolutionView ? (
                <FractionModelDiagram
                    model={data.solutionModel}
                    title={data.operation === 'subtraction' && data.task !== 'mixed-operation'
                        ? 'Separated amount'
                        : 'Result model'}
                    ariaLabel={data.operation === 'subtraction' && data.task !== 'mixed-operation'
                        ? `${data.solutionModel.display} is separated into ${data.result.notation} remaining and ${data.second.notation} removed.`
                        : `The supplied result model shows ${data.result.notation} using the same whole and ${data.denominator} equal parts.`}
                />
            ) : (
                <ModelPlaceholder label={interpretation
                    ? 'The completed joining or separating model is withheld.'
                    : 'The result model is withheld.'}
                />
            )}
            {data.task === 'mixed-operation' && (
                <div className={`grid min-h-[104px] grid-cols-2 gap-2 rounded-xl border-2 p-3 ${
                    isSolutionView
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-dashed border-slate-300 bg-slate-50'
                }`}>
                    {isSolutionView ? data.transformationSteps.map((step, index) => (
                        <div key={index} className="rounded-lg bg-white px-3 py-2 text-center font-mono text-sm font-bold text-slate-800 shadow-sm">
                            <span className="mr-2 text-amber-700">{index + 1}.</span>
                            <FractionArithmeticText text={step} />
                        </div>
                    )) : (
                        <div className="col-span-2 flex items-center justify-center text-sm font-bold text-slate-500">
                            Conversion and regrouping steps are withheld.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
