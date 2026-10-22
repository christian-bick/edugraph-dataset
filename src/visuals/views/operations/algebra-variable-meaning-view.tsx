import type {AlgebraicSymbolDeclaration, AlgebraVariableMeaningProblem as Problem, VariableMeaningDomain} from '../../../types/problems.ts';
import {AlgebraExpression} from './algebra-expression-format.tsx';
import {exactNumericValue} from './numerical-power-expression-format.tsx';

const domainNames: Record<VariableMeaningDomain['name'], string> = {
    'rational-numbers': 'rational numbers',
    integers: 'integers',
    'nonnegative-rational-numbers': 'nonnegative rational numbers',
    'nonnegative-integers': 'nonnegative integers'
};

function QuantityContext({data}: {data: Problem}) {
    const fixed = data.role.kind === 'particular-unknown';
    const frame = data.quantity.kind === 'count' ? fixed ? 'Consider one fixed bag of tokens.' : 'Consider bags with any admissible token count.'
        : data.quantity.kind === 'length' ? fixed ? 'Consider one fixed segment.' : 'Consider segments with any admissible length.'
            : fixed ? 'Consider one fixed mathematical situation.' : 'Consider any mathematical number in the stated domain.';
    const meaning = data.quantity.kind === 'count' ? 'the number of tokens in a bag'
        : data.quantity.kind === 'length' ? 'a segment length measured in meters' : 'a mathematical number';
    return <div className="space-y-2" data-role="variable-meaning-context"><p>{frame}</p><p>The letter <i>{data.symbol.symbol}</i> denotes {meaning}.</p>
        <p>Allowed domain: {domainNames[data.domain.name]}.</p></div>;
}

/** One fixed interpretation task; all mathematical conclusions are supplied by the model. */
export function AlgebraVariableMeaningBody({data, isSolutionView}: {data: Problem; isSolutionView: boolean}) {
    const symbols: readonly AlgebraicSymbolDeclaration[] = [{...data.symbol, domain: data.domain.set}];
    const left = data.expressions.find(expression => expression.expressionId === data.relation.leftExpressionId)!;
    const right = data.expressions.find(expression => expression.expressionId === data.relation.rightExpressionId)!;
    const fixed = data.role.kind === 'particular-unknown';
    return <main className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" style={{width: 760, maxWidth: '96vw'}}>
        <h1 className="text-xl font-semibold">Interpret the letter</h1>
        <p className="mt-3">Explain what the letter represents, how its domain applies, and how the relation uses it.</p>
        <section className="mt-4 rounded-xl bg-slate-100 p-5">
            <QuantityContext data={data} />
            <p className="mt-4">{fixed ? 'Condition for this fixed situation:' : <>The following relation holds for every <i>{data.symbol.symbol}</i> in the stated domain:</>}</p>
            <div className="mt-3 text-2xl leading-loose" style={{overflowWrap: 'anywhere'}} data-role="variable-meaning-relation">
                <AlgebraExpression node={left.root} symbols={symbols} /> = <AlgebraExpression node={right.root} symbols={symbols} />
            </div>
        </section>
        {isSolutionView ? <section className="mt-5 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900" data-role="variable-meaning-answer">
            {data.role.kind === 'particular-unknown' ? <>
                <p>Here <i>{data.symbol.symbol}</i> represents one particular unknown value for this fixed situation. The condition determines that value within the {domainNames[data.domain.name]}.</p>
                <p data-role="variable-meaning-unique-value">The value is <i>{data.symbol.symbol}</i> = {exactNumericValue(data.role.uniqueValueWitness.uniqueValue)}{data.quantity.unit !== 'none' && ` ${data.quantity.unit}`}.</p>
                <p>This value belongs to the stated domain and satisfies the original condition.</p>
            </> : <>
                <p>Here <i>{data.symbol.symbol}</i> represents an arbitrary member of the {domainNames[data.domain.name]}: a generalized number.</p>
                <p>The relation is valid for every member of that domain, so any admissible value may be used for the letter.</p>
            </>}
        </section> : <div className="mt-5 min-h-28 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-500" data-role="variable-meaning-response">Your explanation:</div>}
    </main>;
}
