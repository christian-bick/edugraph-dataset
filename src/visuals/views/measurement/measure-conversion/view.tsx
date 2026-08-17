import {createRoot} from 'react-dom/client';
import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    GenericUnitScaleRelationProblem,
    LargerToSmallerConversionProblem,
    MeasurementConversionProblem,
    MeasurementConversionUnit,
    RelativeUnitSizeProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    isSupportedMeasureConversionProblem,
    isValidMeasureConversionProblem
} from './helpers.ts';
import {MeasureConversionViewConfig, MeasureConversionViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: MeasureConversionViewConfig;
    payload: ViewRenderPayload<'measure-conversion'>;
}

const UnitCard = ({unit, role}: {unit: MeasurementConversionUnit; role: 'larger' | 'smaller'}) => (
    <div className={`rounded-xl border-2 px-5 py-4 text-center ${role === 'larger' ? 'border-indigo-300 bg-indigo-50' : 'border-sky-300 bg-sky-50'}`}>
        <div className={`text-xs font-bold uppercase tracking-[0.12em] ${role === 'larger' ? 'text-indigo-600' : 'text-sky-700'}`}>
            {role} unit
        </div>
        <div className={`mt-1 text-xl font-bold ${role === 'larger' ? 'text-indigo-950' : 'text-sky-950'}`}>
            {unit.singular}
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-600">
            {unit.plural} · {unit.symbol}
        </div>
    </div>
);

const UnitPair = ({data}: {data: RelativeUnitSizeProblem | LargerToSmallerConversionProblem}) => (
    <div className="grid grid-cols-[1fr_76px_1fr] items-center gap-3">
        <UnitCard unit={data.pair.largerUnit} role="larger" />
        <div className="text-center text-3xl font-bold text-slate-400" aria-label="is equivalent to">⇄</div>
        <UnitCard unit={data.pair.smallerUnit} role="smaller" />
    </div>
);

const PartitionRow = ({count, smaller}: {count: number; smaller: boolean}) => (
    <div className="flex h-14 w-full overflow-hidden rounded-lg border-2 border-slate-600" role="img" aria-label={`Equal length partitioned into ${count} ${smaller ? 'small' : 'large'} units`}>
        {Array.from({length: count}, (_, index) => (
            <span
                className={`flex-1 border-r border-slate-500 last:border-r-0 ${smaller ? 'bg-sky-100' : 'bg-indigo-100'}`}
                key={index}
            />
        ))}
    </div>
);

const GenericUnitScale = ({
    data,
    isSolutionView
}: {
    data: GenericUnitScaleRelationProblem;
    isSolutionView: boolean;
}) => (
    <>
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-center text-base font-bold text-amber-950">
            {data.equivalentLengthStatement}
        </div>
        <div className="mt-4 space-y-4 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-5">
            <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-indigo-900">
                    <span>Large units</span><span>{formatStandardNumeral(data.largeUnitCount)} units</span>
                </div>
                <PartitionRow count={data.largeUnitCount} smaller={false} />
            </div>
            <div>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-sky-900">
                    <span>Small units</span><span>{formatStandardNumeral(data.smallUnitCount)} units</span>
                </div>
                <PartitionRow count={data.smallUnitCount} smaller />
            </div>
        </div>
        <div className={`mt-4 rounded-xl border-2 px-6 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 text-slate-600'}`}>
            {isSolutionView ? (
                <>
                    <div className="text-lg font-bold">{data.answerStatement}</div>
                    <div className="mt-2 font-mono text-base font-bold">{data.solutionEquation}</div>
                    <div className="mt-2 text-sm font-semibold text-emerald-900">{data.explanation}</div>
                </>
            ) : (
                <div className="font-bold">Conclusion: ______ units need a larger count.</div>
            )}
        </div>
    </>
);

const RelativeUnitSize = ({
    data,
    isSolutionView
}: {
    data: RelativeUnitSizeProblem;
    isSolutionView: boolean;
}) => (
    <>
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                Common-quantity evidence
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-amber-950">
                {data.exampleEquation}
            </div>
            <div className="mt-1 text-sm font-semibold text-amber-800">
                Use this equivalent pair to derive the one-unit scale factor.
            </div>
        </div>

        <div className={`mt-4 rounded-xl border-2 px-6 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
            <div className={`font-mono text-2xl font-bold ${isSolutionView ? 'text-emerald-950' : 'text-slate-800'}`}>
                {isSolutionView ? data.solutionEquation : data.questionEquation}
            </div>
            {isSolutionView ? (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold">
                    <div className="rounded-lg bg-white/80 px-4 py-3 text-indigo-900">
                        {data.pair.factorStatement}
                    </div>
                    <div className="rounded-lg bg-white/80 px-4 py-3 text-sky-900">
                        {data.pair.relativeSizeStatement}
                    </div>
                </div>
            ) : (
                <div className="mx-auto mt-3 h-9 w-28 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50" aria-label="Unresolved one-unit scale factor" />
            )}
        </div>

        {isSolutionView ? (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-center text-emerald-950">
                <div className="font-bold">{data.comparisonStatement}</div>
                <div className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">
                    {data.explanation}
                </div>
            </div>
        ) : null}
    </>
);

const LargerToSmaller = ({
    data,
    isSolutionView
}: {
    data: LargerToSmallerConversionProblem;
    isSolutionView: boolean;
}) => (
    <>
        <div className="mt-5 rounded-xl border border-indigo-300 bg-indigo-50 px-5 py-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                Given unit relation
            </div>
            <div className="mt-1 font-mono text-lg font-bold text-indigo-950">
                {data.pair.equivalenceEquation}
            </div>
            <div className="mt-1 text-sm font-semibold text-indigo-800">
                {data.pair.factorStatement}
            </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_110px_1fr] items-stretch gap-3">
            <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 px-4 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-indigo-600">Source measure</div>
                <div className="mt-1 font-mono text-2xl font-bold text-indigo-950">
                    {formatStandardNumeral(data.sourceValue)} {data.pair.largerUnit.symbol}
                </div>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-100 px-2 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Multiply by</div>
                <div className="font-mono text-xl font-bold text-slate-800">× {formatStandardNumeral(data.pair.factor)}</div>
            </div>
            <div className={`rounded-xl border-2 px-4 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-sky-300 bg-sky-50'}`}>
                <div className={`text-xs font-bold uppercase tracking-wide ${isSolutionView ? 'text-emerald-700' : 'text-sky-700'}`}>Smaller-unit measure</div>
                <div className={`mt-1 font-mono text-2xl font-bold ${isSolutionView ? 'text-emerald-950' : 'text-sky-900'}`}>
                    {isSolutionView
                        ? `${formatStandardNumeral(data.convertedValue)} ${data.pair.smallerUnit.symbol}`
                        : `? ${data.pair.smallerUnit.symbol}`}
                </div>
            </div>
        </div>

        <div className={`mt-4 rounded-xl border-2 px-6 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
            <div className={`font-mono text-2xl font-bold ${isSolutionView ? 'text-emerald-950' : 'text-slate-800'}`}>
                {isSolutionView ? data.solutionEquation : data.questionEquation}
            </div>
            {isSolutionView ? (
                <>
                    <div className="mt-2 font-mono text-base font-bold text-emerald-900">
                        {data.measurementEquation}
                    </div>
                    <div className="mt-2 font-bold text-emerald-950">{data.answerStatement}</div>
                    <div className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">
                        {data.explanation}
                    </div>
                </>
            ) : null}
        </div>
    </>
);

const MeasureConversionCore = ({config, payload}: CoreProps) => {
    const data: MeasurementConversionProblem = payload.problem.data;
    validateProblemData('measure-conversion', data, ['task', 'prompt']);
    if (!isSupportedMeasureConversionProblem(data)) {
        throw new ViewValidationError(
            'measure-conversion',
            'Only generic unit-scale, relative unit-size, and larger-to-smaller conversion tasks are supported.'
        );
    }

    if (data.task === 'generic-unit-scale') {
        validateProblemData('measure-conversion', data, [
            'largeUnitCount',
            'smallUnitCount',
            'unitsPerLarge',
            'equivalentLengthStatement',
            'questionEquation',
            'solutionEquation',
            'answerStatement',
            'explanation'
        ]);
    } else if (data.task === 'relative-unit-size') {
        validateProblemData('measure-conversion', data, [
            'pair',
            'exampleLargerValue',
            'exampleSmallerValue',
            'exampleEquation',
            'answer',
            'questionEquation',
            'solutionEquation',
            'comparisonStatement',
            'explanation'
        ]);
    } else {
        validateProblemData('measure-conversion', data, [
            'pair',
            'sourceValue',
            'convertedValue',
            'answer',
            'questionEquation',
            'solutionEquation',
            'measurementEquation',
            'answerStatement',
            'explanation'
        ]);
    }
    const expectedTaskKind = data.task === 'convert-larger-to-smaller'
        ? 'execution'
        : 'derivation';
    if (config.taskKind !== expectedTaskKind || !isValidMeasureConversionProblem(data)) {
        throw new ViewValidationError(
            'measure-conversion',
            'The task mode, unit pair, scale factor, quantities, and authored equations must agree.'
        );
    }

    const isDerivation = data.task !== 'convert-larger-to-smaller';
    return (
        <div className="w-[860px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    {isDerivation ? 'Derive a unit-size relation' : 'Convert to a smaller unit'}
                </div>
                <div className="mt-1 text-xl font-bold text-slate-800">{data.prompt}</div>
            </div>

            {data.task === 'generic-unit-scale' ? (
                <GenericUnitScale data={data} isSolutionView={payload.isSolutionView} />
            ) : (
                <>
                    <div className="mt-5"><UnitPair data={data} /></div>
                    {data.task === 'relative-unit-size'
                        ? <RelativeUnitSize data={data} isSolutionView={payload.isSolutionView} />
                        : <LargerToSmaller data={data} isSolutionView={payload.isSolutionView} />}
                </>
            )}
        </div>
    );
};

export const MeasureConversion = withConfig(MeasureConversionViewSchema, MeasureConversionCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-conversion'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureConversion payload={payload} />);
    }
};
