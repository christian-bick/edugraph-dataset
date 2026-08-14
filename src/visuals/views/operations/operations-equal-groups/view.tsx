import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    OperationsEqualGroupsViewConfig,
    OperationsEqualGroupsViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsEqualGroupsViewConfig;
    payload: ViewRenderPayload<'operations-equal-groups'>;
}

const OperationsEqualGroupsCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-equal-groups', data, [
        'operation',
        'groupCount',
        'groupSize',
        'total',
        'answer'
    ]);

    if (!Number.isInteger(data.groupCount) || data.groupCount < 2 || data.groupCount > 6
        || !Number.isInteger(data.groupSize) || data.groupSize < 2 || data.groupSize > 6
        || data.total !== data.groupCount * data.groupSize) {
        throw new ViewValidationError(
            'operations-equal-groups',
            'The collection must contain two through six equal groups of two through six objects.'
        );
    }

    const expectedAnswer = data.operation === 'partitive-division'
        ? data.groupSize
        : data.operation === 'quotative-division'
            ? data.groupCount
            : data.total;
    if (data.answer !== expectedAnswer || config.responseMode === undefined) {
        throw new ViewValidationError('operations-equal-groups', 'The operation, answer, and response mode must agree.');
    }

    const prompt = data.operation === 'multiplication'
        ? `A set of ${data.total} objects is partitioned into ${data.groupCount} equal groups of ${data.groupSize}. What does ${data.groupCount} × ${data.groupSize} mean?`
        : data.operation === 'partitive-division'
            ? `Share ${data.total} objects equally among ${data.groupCount} groups. How many go in each group?`
            : `Put ${data.total} objects into groups of ${data.groupSize}. How many groups are made?`;

    const equation = data.operation === 'multiplication'
        ? `${data.groupCount} × ${data.groupSize} = ${data.total}`
        : data.operation === 'partitive-division'
            ? `${data.total} ÷ ${data.groupCount} = ${data.groupSize}`
            : `${data.total} ÷ ${data.groupSize} = ${data.groupCount}`;

    const interpretation = data.operation === 'multiplication'
        ? `The whole set is partitioned into ${data.groupCount} equal groups of ${data.groupSize}, so ${data.groupCount} × ${data.groupSize} = ${data.total}.`
        : data.operation === 'partitive-division'
            ? `Each of the ${data.groupCount} groups gets ${data.groupSize} objects.`
            : `${data.groupSize} objects in each group makes ${data.groupCount} groups.`;

    return (
        <div className="w-[700px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Equal groups</div>
                <div className="mt-2 text-xl font-semibold text-slate-700">{prompt}</div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                {Array.from({length: data.groupCount}, (_, groupIndex) => (
                    <div key={groupIndex} className="rounded-xl border-2 border-teal-300 bg-white p-3">
                        <div className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-teal-700">
                            Group {groupIndex + 1}
                        </div>
                        <div className="flex min-h-16 flex-wrap items-center justify-center gap-2">
                            {Array.from({length: data.groupSize}, (_, itemIndex) => (
                                <div
                                    key={itemIndex}
                                    className="size-7 rounded-full border-2 border-amber-500 bg-amber-300"
                                    aria-label={`Object ${itemIndex + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 min-h-20 rounded-xl border border-slate-200 px-5 py-4 text-center">
                {isSolutionView ? (
                    <>
                        <div className="font-mono text-2xl font-bold text-emerald-700">{equation}</div>
                        <div className="mt-2 text-lg font-semibold text-slate-700">{interpretation}</div>
                    </>
                ) : (
                    <div className="font-mono text-3xl font-bold text-slate-500">?</div>
                )}
            </div>
        </div>
    );
};

export const OperationsEqualGroups = withConfig(
    OperationsEqualGroupsViewSchema,
    OperationsEqualGroupsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-equal-groups'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsEqualGroups payload={payload} />);
    }
};
