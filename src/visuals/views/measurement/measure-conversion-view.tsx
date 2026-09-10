import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {
    GenericUnitScaleRelationProblem,
    MeasurementConversionProblem,
    StandardUnitEquivalencesProblem
} from '../../../types/problems.ts';
import {
    formatFactorInstruction,
    formatMeasurement,
    formatMeasurementEquation,
    formatRelativeSizeStatement,
    formatUnitEquivalence,
    getMeasurementUnitPresentation,
    getQuantityName,
    MeasurementUnitPresentation
} from '../../helpers/measurement-conversion.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    isValidMeasureConversionProblem
} from './measure-conversion-helpers.ts';

export type MeasureConversionTaskMode = 'derivation' | 'execution';
type MeasureConversionViewId =
    | 'measure-conversion-derivation'
    | 'measure-conversion-execution';

interface MeasureConversionViewProps {
    mode: MeasureConversionTaskMode;
    payload: ViewRenderPayload<MeasureConversionViewId>;
    viewId: MeasureConversionViewId;
}

const UnitCard = ({unit, role}: {
    unit: MeasurementUnitPresentation;
    role: 'larger' | 'smaller';
}) => (
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

const UnitPair = ({data}: {
    data: StandardUnitEquivalencesProblem;
}) => (
    <div className="grid grid-cols-[1fr_76px_1fr] items-center gap-3">
        <UnitCard
            unit={getMeasurementUnitPresentation(data.pair.largerUnit)}
            role="larger"
        />
        <div
            className="text-center text-3xl font-bold text-slate-400"
            aria-label="is equivalent to"
        >
            ⇄
        </div>
        <UnitCard
            unit={getMeasurementUnitPresentation(data.pair.smallerUnit)}
            role="smaller"
        />
    </div>
);

const PartitionRow = ({count, smaller}: {count: number; smaller: boolean}) => (
    <div
        className="flex h-14 w-full overflow-hidden rounded-lg border-2 border-slate-600"
        role="img"
        aria-label={`Equal length partitioned into ${count} ${smaller ? 'small' : 'large'} units`}
    >
        {Array.from({length: count}, (_, index) => (
            <span
                className={`flex-1 border-r border-slate-500 last:border-r-0 ${smaller ? 'bg-sky-100' : 'bg-indigo-100'}`}
                key={index}
            />
        ))}
    </div>
);

const GenericUnitScale = ({data, isSolutionView}: {
    data: GenericUnitScaleRelationProblem;
    isSolutionView: boolean;
}) => {
    const large = formatStandardNumeral(data.largeUnitCount);
    const small = formatStandardNumeral(data.smallUnitCount);
    const factor = formatStandardNumeral(data.unitsPerLarge);
    const solutionEquation = `${large} × ${factor} = ${small}`;
    return (
        <>
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-center text-base font-bold text-amber-950">
                The same length is {large} large units or {small} small units.
            </div>
            <div className="mt-4 space-y-4 rounded-xl border-2 border-slate-200 bg-slate-50 px-6 py-5">
                <div>
                    <div className="mb-2 flex items-center justify-between text-sm font-bold text-indigo-900">
                        <span>Large units</span><span>{large} units</span>
                    </div>
                    <PartitionRow count={data.largeUnitCount} smaller={false} />
                </div>
                <div>
                    <div className="mb-2 flex items-center justify-between text-sm font-bold text-sky-900">
                        <span>Small units</span><span>{small} units</span>
                    </div>
                    <PartitionRow count={data.smallUnitCount} smaller />
                </div>
            </div>
            <div className={`mt-4 rounded-xl border-2 px-6 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 text-slate-600'}`}>
                {isSolutionView ? (
                    <>
                        <div className="text-lg font-bold">
                            Smaller units need a larger count: {small} &gt; {large}.
                        </div>
                        <div className="mt-2 font-mono text-base font-bold">{solutionEquation}</div>
                        <div className="mt-2 text-sm font-semibold text-emerald-900">
                            Each large unit covers the same length as {factor} small units, so {solutionEquation}.
                        </div>
                    </>
                ) : (
                    <div className="font-bold">Conclusion: ______ units need a larger count.</div>
                )}
            </div>
        </>
    );
};

const RelativeUnitSize = ({data, isSolutionView}: {
    data: StandardUnitEquivalencesProblem;
    isSolutionView: boolean;
}) => {
    const larger = getMeasurementUnitPresentation(data.pair.largerUnit);
    const smaller = getMeasurementUnitPresentation(data.pair.smallerUnit);
    const quantity = getQuantityName(data.pair.quantityKind);
    const equivalent = data.equivalents[0]!;
    const exampleEquation = formatMeasurementEquation(
        equivalent.largerValue,
        equivalent.smallerValue,
        data.pair
    );
    const solutionEquation = formatUnitEquivalence(data.pair);
    return (
        <>
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-amber-700">
                    Common-quantity evidence
                </div>
                <div className="mt-1 font-mono text-xl font-bold text-amber-950">
                    {exampleEquation}
                </div>
                <div className="mt-1 text-sm font-semibold text-amber-800">
                    Use this equivalent pair to derive the one-unit scale factor.
                </div>
            </div>
            <div className={`mt-4 rounded-xl border-2 px-6 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
                <div className={`font-mono text-2xl font-bold ${isSolutionView ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {isSolutionView
                        ? solutionEquation
                        : `1 ${larger.singular} = ? ${smaller.plural}`}
                </div>
                {isSolutionView ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm font-semibold">
                        <div className="rounded-lg bg-white/80 px-4 py-3 text-indigo-900">
                            {formatFactorInstruction(data.pair)}
                        </div>
                        <div className="rounded-lg bg-white/80 px-4 py-3 text-sky-900">
                            {formatRelativeSizeStatement(data.pair)}
                        </div>
                    </div>
                ) : (
                    <div
                        className="mx-auto mt-3 h-9 w-28 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50"
                        aria-label="Unresolved one-unit scale factor"
                    />
                )}
            </div>
            {isSolutionView ? (
                <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-center text-emerald-950">
                    <div className="font-bold">
                        {exampleEquation} names the same {quantity} with a smaller count of {larger.plural} and a larger count of {smaller.plural}.
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">
                        {exampleEquation} represents the same {quantity}. Dividing both counts by {formatStandardNumeral(equivalent.largerValue)} gives {solutionEquation}. {formatRelativeSizeStatement(data.pair)}
                    </div>
                </div>
            ) : null}
        </>
    );
};

const LargerToSmaller = ({data, isSolutionView}: {
    data: StandardUnitEquivalencesProblem;
    isSolutionView: boolean;
}) => {
    const larger = getMeasurementUnitPresentation(data.pair.largerUnit);
    const smaller = getMeasurementUnitPresentation(data.pair.smallerUnit);
    const equivalent = data.equivalents[0]!;
    const source = formatMeasurement(equivalent.largerValue, data.pair.largerUnit);
    const converted = formatMeasurement(equivalent.smallerValue, data.pair.smallerUnit);
    const sourceText = formatStandardNumeral(equivalent.largerValue);
    const factorText = formatStandardNumeral(data.pair.factor);
    const convertedText = formatStandardNumeral(equivalent.smallerValue);
    const solutionEquation = `${sourceText} × ${factorText} = ${convertedText}`;
    const measurementEquation = `${source} = ${converted}`;
    return (
        <>
            <div className="mt-5 rounded-xl border border-indigo-300 bg-indigo-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">
                    Given unit relation
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-indigo-950">
                    {formatUnitEquivalence(data.pair)}
                </div>
                <div className="mt-1 text-sm font-semibold text-indigo-800">
                    {formatFactorInstruction(data.pair)}
                </div>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_110px_1fr] items-stretch gap-3">
                <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 px-4 py-4 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-indigo-600">Source measure</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-indigo-950">
                        {sourceText} {larger.symbol}
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl bg-slate-100 px-2 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Multiply by</div>
                    <div className="font-mono text-xl font-bold text-slate-800">× {factorText}</div>
                </div>
                <div className={`rounded-xl border-2 px-4 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-sky-300 bg-sky-50'}`}>
                    <div className={`text-xs font-bold uppercase tracking-wide ${isSolutionView ? 'text-emerald-700' : 'text-sky-700'}`}>Smaller-unit measure</div>
                    <div className={`mt-1 font-mono text-2xl font-bold ${isSolutionView ? 'text-emerald-950' : 'text-sky-900'}`}>
                        {isSolutionView ? `${convertedText} ${smaller.symbol}` : `? ${smaller.symbol}`}
                    </div>
                </div>
            </div>
            <div className={`mt-4 rounded-xl border-2 px-6 py-4 text-center ${isSolutionView ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
                <div className={`font-mono text-2xl font-bold ${isSolutionView ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {isSolutionView ? solutionEquation : `${sourceText} × ${factorText} = ?`}
                </div>
                {isSolutionView ? (
                    <>
                        <div className="mt-2 font-mono text-base font-bold text-emerald-900">
                            {measurementEquation}
                        </div>
                        <div className="mt-2 font-bold text-emerald-950">
                            {source} is equivalent to {converted}.
                        </div>
                        <div className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">
                            Since {formatUnitEquivalence(data.pair)}, multiply {sourceText} by {factorText}. {solutionEquation}, so {measurementEquation}.
                        </div>
                    </>
                ) : null}
            </div>
        </>
    );
};

export const MeasureConversionView = ({mode, payload, viewId}: MeasureConversionViewProps) => {
    const data: MeasurementConversionProblem = payload.problem.data;
    validateProblemData(viewId, data, []);
    if (!('pair' in data)) {
        validateProblemData(viewId, data, [
            'largeUnitCount',
            'smallUnitCount',
            'unitsPerLarge'
        ]);
    } else {
        validateProblemData(viewId, data, ['pair', 'equivalents']);
    }

    if ((!('pair' in data) && mode !== 'derivation') || !isValidMeasureConversionProblem(data)) {
        throw new ViewValidationError(
            viewId,
            'The fixed task identity, unit pair, scale factor, and quantities must agree.'
        );
    }

    const prompt = !('pair' in data)
        ? 'The same length is measured with large units and small units. Which unit size needs more units?'
        : mode === 'derivation'
        ? `Use the equivalent ${getQuantityName(data.pair.quantityKind)} to determine how many ${getMeasurementUnitPresentation(data.pair.smallerUnit).plural} equal 1 ${getMeasurementUnitPresentation(data.pair.largerUnit).singular}.`
        : `Convert ${formatMeasurement(data.equivalents[0]!.largerValue, data.pair.largerUnit)} to ${getMeasurementUnitPresentation(data.pair.smallerUnit).plural}.`;

    return (
        <div className="w-[860px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    {mode === 'derivation'
                        ? 'Derive a unit-size relation'
                        : 'Convert to a smaller unit'}
                </div>
                <div className="mt-1 text-xl font-bold text-slate-800">{prompt}</div>
            </div>
            {!('pair' in data) ? (
                <GenericUnitScale data={data} isSolutionView={payload.isSolutionView} />
            ) : (
                <>
                    <div className="mt-5"><UnitPair data={data} /></div>
                    {mode === 'derivation'
                        ? <RelativeUnitSize data={data} isSolutionView={payload.isSolutionView} />
                        : <LargerToSmaller data={data} isSolutionView={payload.isSolutionView} />}
                </>
            )}
        </div>
    );
};
