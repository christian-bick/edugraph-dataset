import {
    TenthsHundredthsAdditionProblem,
    TenthsHundredthsGridGroup,
    TenthsToHundredthsProblem
} from '../../../types/problems.ts';
import {TenthsHundredthsGrid} from '../../components/TenthsHundredthsGrid.tsx';
import {
    isValidDecimalFraction,
    isValidTenthsHundredthsGrid
} from '../../helpers/tenths-hundredths-grid.ts';

export {TenthsHundredthsGrid} from '../../components/TenthsHundredthsGrid.tsx';
export {
    isValidDecimalFraction,
    isValidTenthsHundredthsGrid
} from '../../helpers/tenths-hundredths-grid.ts';

export const isValidTenthsToHundredthsProblem = (
    data: TenthsToHundredthsProblem
): boolean => {
    if (typeof data !== 'object'
        || data === null
        || typeof data.tenths !== 'object'
        || data.tenths === null
        || typeof data.hundredths !== 'object'
        || data.hundredths === null
        || typeof data.numeratorScale !== 'object'
        || data.numeratorScale === null
        || typeof data.denominatorScale !== 'object'
        || data.denominatorScale === null
        || typeof data.models !== 'object'
        || data.models === null) return false;
    const {tenths, hundredths} = data;
    const scaledNumerator = tenths.numerator * 10;
    return data.task === 'tenths-to-hundredths'
        && isValidDecimalFraction(tenths, 10)
        && isValidDecimalFraction(hundredths, 100)
        && hundredths.numerator === scaledNumerator
        && data.scaleFactor === 10
        && data.sharedWhole === 1
        && data.numeratorScale.from === tenths.numerator
        && data.numeratorScale.factor === 10
        && data.numeratorScale.result === scaledNumerator
        && data.numeratorScale.equation === `${tenths.numerator} × 10 = ${scaledNumerator}`
        && data.denominatorScale.from === 10
        && data.denominatorScale.factor === 10
        && data.denominatorScale.result === 100
        && data.denominatorScale.equation === '10 × 10 = 100'
        && data.relation === 'equal'
        && data.equation === `${tenths.notation} = ${hundredths.notation}`
        && isValidTenthsHundredthsGrid(data.models.tenths, tenths)
        && isValidTenthsHundredthsGrid(data.models.hundredths, hundredths);
};

export const isValidTenthsHundredthsAdditionProblem = (
    data: TenthsHundredthsAdditionProblem
): boolean => {
    if (typeof data !== 'object'
        || data === null
        || typeof data.firstTenths !== 'object'
        || data.firstTenths === null
        || typeof data.secondHundredths !== 'object'
        || data.secondHundredths === null
        || typeof data.convertedFirst !== 'object'
        || data.convertedFirst === null
        || typeof data.result !== 'object'
        || data.result === null
        || typeof data.conversion !== 'object'
        || data.conversion === null
        || typeof data.story !== 'object'
        || data.story === null
        || !Array.isArray(data.story.givenDisplays)
        || typeof data.questionModels !== 'object'
        || data.questionModels === null
        || typeof data.solutionModels !== 'object'
        || data.solutionModels === null) return false;
    const {firstTenths, secondHundredths, convertedFirst, result} = data;
    const convertedNumerator = firstTenths.numerator * 10;
    const resultNumerator = convertedNumerator + secondHundredths.numerator;
    const conversionEquation = `${firstTenths.notation} = ${convertedFirst.notation}`;
    const solutionEquation = `${convertedFirst.notation} + ${secondHundredths.notation} = ${result.notation}`;
    const firstTenthsGroups: TenthsHundredthsGridGroup[] = [{
        source: 'first-addend',
        label: firstTenths.notation,
        startCell: 0,
        cellCount: firstTenths.numerator
    }];
    const secondHundredthsGroups: TenthsHundredthsGridGroup[] = [{
        source: 'second-addend',
        label: secondHundredths.notation,
        startCell: 0,
        cellCount: secondHundredths.numerator
    }];
    const convertedFirstGroups: TenthsHundredthsGridGroup[] = [{
        source: 'first-addend',
        label: convertedFirst.notation,
        startCell: 0,
        cellCount: convertedNumerator
    }];
    const resultGroups: TenthsHundredthsGridGroup[] = [
        convertedFirstGroups[0]!,
        {
            source: 'second-addend',
            label: secondHundredths.notation,
            startCell: convertedNumerator,
            cellCount: secondHundredths.numerator
        }
    ];
    return data.task === 'tenths-hundredths-addition'
        && data.operation === 'addition'
        && data.denominator === 100
        && data.sharedWhole === 1
        && data.referenceId === 'same-whole'
        && isValidDecimalFraction(firstTenths, 10)
        && firstTenths.numerator < 10
        && isValidDecimalFraction(secondHundredths, 100)
        && secondHundredths.numerator <= 100 - convertedNumerator
        && isValidDecimalFraction(convertedFirst, 100)
        && convertedFirst.numerator === convertedNumerator
        && isValidDecimalFraction(result, 100)
        && result.numerator === resultNumerator
        && data.conversion.factor === 10
        && data.conversion.numeratorEquation === `${firstTenths.numerator} × 10 = ${convertedNumerator}`
        && data.conversion.denominatorEquation === '10 × 10 = 100'
        && data.conversion.equation === conversionEquation
        && data.prompt === 'Express the tenths as hundredths, then add.'
        && data.questionEquation === `${firstTenths.notation} + ${secondHundredths.notation} = ?/100`
        && data.conversionEquation === conversionEquation
        && data.solutionEquation === solutionEquation
        && data.equationChain === `${firstTenths.notation} + ${secondHundredths.notation} = ${convertedFirst.notation} + ${secondHundredths.notation} = ${result.notation}`
        && data.answer === String(resultNumerator)
        && data.answerStatement === `${firstTenths.notation} + ${secondHundredths.notation} = ${result.notation}.`
        && data.explanation === `${conversionEquation} because multiplying its numerator and denominator by 10 makes hundredths without changing the amount. Then ${solutionEquation}.`
        && data.story.storyKind === 'hundred-grid-addition'
        && data.story.context === `A mosaic uses ${firstTenths.notation} of a unit square in blue and a non-overlapping ${secondHundredths.notation} of the same-sized unit square in gold.`
        && data.story.question === 'How much of one unit square is used altogether when the amount is expressed in hundredths?'
        && data.story.wholeLabel === 'one unit square'
        && data.story.unitLabel === 'of a unit square'
        && data.story.givenDisplays.length === 2
        && data.story.givenDisplays[0] === firstTenths.notation
        && data.story.givenDisplays[1] === secondHundredths.notation
        && data.story.unknownRole === 'result'
        && isValidTenthsHundredthsGrid(
            data.questionModels.firstTenths,
            firstTenths,
            firstTenthsGroups
        )
        && isValidTenthsHundredthsGrid(
            data.questionModels.secondHundredths,
            secondHundredths,
            secondHundredthsGroups
        )
        && isValidTenthsHundredthsGrid(
            data.solutionModels.convertedFirst,
            convertedFirst,
            convertedFirstGroups
        )
        && isValidTenthsHundredthsGrid(data.solutionModels.result, result, resultGroups);
};

export const TenthsToHundredthsModel = ({
    data,
    isSolutionView,
    explainScaling
}: {
    data: TenthsToHundredthsProblem;
    isSolutionView: boolean;
    explainScaling: boolean;
}) => {
    const questionEquation = `${data.tenths.notation} = ?/100`;
    const scalingEquation = `${data.tenths.notation} = (${data.tenths.numerator} × 10)/(10 × 10) = ${data.hundredths.notation}`;
    const explanation = `Multiplying the numerator and denominator of ${data.tenths.notation} by 10 makes 10 times as many equal parts. Each tenth becomes 10 hundredths, so ${data.hundredths.notation} shades the same amount.`;

    return (
        <div className="w-[930px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.42rem] font-extrabold text-slate-800">
                {explainScaling
                    ? 'Scale the numerator and denominator by 10. Complete the equality and explain why the amount stays the same.'
                    : 'Complete the equivalent fraction by expressing the tenths as hundredths.'}
            </div>
            <div className="mt-2 text-center font-mono text-[1.08rem] font-bold text-blue-700">
                {isSolutionView ? data.equation : questionEquation}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-5">
                <TenthsHundredthsGrid
                    model={data.models.tenths}
                    title="Tenths"
                    ariaLabel={`${data.tenths.notation} shades ${data.tenths.numerator} of 10 equal vertical parts in the shared whole.`}
                />
                <TenthsHundredthsGrid
                    model={data.models.hundredths}
                    title="The same whole in hundredths"
                    ariaLabel={isSolutionView
                        ? `${data.hundredths.notation} shades the same region using 100 equal parts grouped into 10 tenths.`
                        : 'The same-sized whole is divided into 100 equal parts grouped into tenths. Its shaded region aligns with the tenths model; the scaled numerator is withheld.'}
                    showDisplay={isSolutionView}
                />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-900">
                <span>{data.numeratorScale.from} × {data.numeratorScale.factor} = {isSolutionView ? data.numeratorScale.result : '?'}</span>
                <span className="text-blue-300">•</span>
                <span>{data.denominatorScale.equation}</span>
            </div>

            <div className={`mt-4 min-h-[104px] rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="text-lg font-extrabold">{data.equation}.</div>
                        {explainScaling && (
                            <>
                                <div className="mt-2 font-mono text-sm font-bold">{scalingEquation}</div>
                                <div className="mt-2 text-sm font-semibold leading-snug">{explanation}</div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="flex min-h-[70px] items-center justify-center font-mono text-lg font-bold">
                        {questionEquation}
                    </div>
                )}
            </div>
        </div>
    );
};
