import type {AlgebraCovariationProblem as Problem, CovariationValueWitness, CovaryingQuantity} from '../../../types/problems.ts';
import {AlgebraExpression} from './algebra-expression-format.tsx';
import {ExactNumericExpression, exactNumericNotation, exactNumericValue} from './numerical-power-expression-format.tsx';

export const covariationQuantityName = (quantity: CovaryingQuantity): string => ({'elapsed-time': 'elapsed time', 'distance-traveled': 'distance traveled', 'rental-duration': 'rental duration', 'rental-cost': 'rental cost', 'item-count': 'item count', 'total-cost': 'total cost', 'production-time': 'production time', 'total-length': 'total length'}[quantity.meaning]);
export const covariationAxisLabel = (quantity: CovaryingQuantity): string => `${quantity.symbol}: ${covariationQuantityName(quantity)} (${quantity.unit.name})`;
/** Short display names share the exact row-to-point mapping without exposing storage IDs. */
export const covariationPointLabel = (data: Problem, rowId: string): string => `P${data.table.findIndex(row => row.rowId === rowId) + 1}`;

export function CovariationEquation({data}: {data: Problem}) {
    return <span data-role="covariation-equation"><i>{data.output.symbol}</i> = <AlgebraExpression node={data.equation.right} symbols={data.lawProof.proofDomain.symbols} /></span>;
}

/** Physical real/integer domains come from quantities, never from the formal all-Q proof. */
export function CovariationDomains({data, revealSymbols}: {data: Problem; revealSymbols: boolean}) {
    return <div className="mt-3 space-y-2 text-sm" data-role="covariation-domains">{[data.input, data.output].map(quantity => <p key={quantity.quantityId}>
        {covariationQuantityName(quantity)}{revealSymbols && <> <i>{quantity.symbol}</i></>}: {quantity.domain.kind === 'real' ? 'all real values' : 'integer values'} from {exactNumericValue(quantity.domain.minimum)} to {exactNumericValue(quantity.domain.maximum)} {quantity.unit.name}, inclusive.
    </p>)}<p>The output domain states permitted values.</p></div>;
}

export function CovariationSituation({data}: {data: Problem}) {
    const context = data.context;
    return <p data-role="covariation-situation">{context.kind === 'constant-speed' ? <>An object travels at a constant speed of {exactNumericNotation(context.speedNotation)} {context.rateUnit.name}. Distance traveled is measured from the start of the motion.</>
        : context.kind === 'rental-charge' ? <>A rental has an initial charge of {exactNumericNotation(context.initialChargeNotation)} {context.initialUnit.name}, plus a charge of {exactNumericNotation(context.hourlyChargeNotation)} {context.rateUnit.name} for its duration.</>
            : context.kind === 'item-purchase' ? <>A purchase has a fixed charge of {exactNumericNotation(context.fixedChargeNotation)} {context.initialUnit.name}, plus {exactNumericNotation(context.itemPriceNotation)} {context.rateUnit.name}.</>
                : <>Production begins with {exactNumericNotation(context.initialLengthNotation)} {context.initialUnit.name} of material and adds length at {exactNumericNotation(context.lengthPerTimeNotation)} {context.rateUnit.name}.</>}</p>;
}

export function CovariationRoles({data}: {data: Problem}) {
    return <div className="space-y-3" data-role="covariation-role-answer"><p><i>{data.input.symbol}</i> represents {covariationQuantityName(data.input)}, measured in {data.input.unit.name}. It is the independent variable, chosen from its stated domain.</p>
        <p><i>{data.output.symbol}</i> represents {covariationQuantityName(data.output)}, measured in {data.output.unit.name}. It is the dependent variable: the equation determines one corresponding output for each admissible input.</p></div>;
}

export function CovariationModelMeaning({data}: {data: Problem}) {
    return <p>The rate is the total coefficient of <i>{data.input.symbol}</i>: {exactNumericNotation(data.equation.slopeNotation)} {data.context.rateUnit.name}. The initial amount is the constant part: {exactNumericNotation(data.equation.interceptNotation)} {data.output.unit.name}. Together they relate {covariationQuantityName(data.output)} to {covariationQuantityName(data.input)}.</p>;
}

export function CovariationRowWork({value}: {value: CovariationValueWitness}) {
    const calculation = value.evaluation.calculation;
    return <div className="mt-3 space-y-2" data-role="covariation-row-work"><p>Substitute the row's value into the original right-hand expression:</p>
        <div className="text-xl leading-loose"><ExactNumericExpression node={calculation.expression} /></div>
        {calculation.reductions.map((step, index) => <div key={index}>Step {index + 1}: <ExactNumericExpression node={step.after} /></div>)}
        <p>Corresponding output: {exactNumericNotation(value.outputNotation)}.</p></div>;
}
