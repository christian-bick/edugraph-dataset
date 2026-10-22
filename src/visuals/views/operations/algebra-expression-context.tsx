import type {AlgebraicExpressionProblem, AlgebraicQuantity, AlgebraicQuantityRelation, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {AlgebraDomains, algebraDomain, algebraSymbol, PrescribedAlgebraCalculation} from './algebra-expression-format.tsx';
import {exactNumericNotation} from './numerical-power-expression-format.tsx';

/** Repeated semantic roles need distinct learner-facing references, independent of hidden symbols. */
export function quantityMeaning(quantity: AlgebraicQuantity, quantities: readonly AlgebraicQuantity[]): string {
    const sameRole = quantities.filter(value => value.meaning === quantity.meaning);
    const meaning = quantity.meaning.replaceAll('-', ' ');
    return sameRole.length === 1 ? meaning : `${meaning} ${sameRole.findIndex(value => value.quantityId === quantity.quantityId) + 1}`;
}
const ungroup = (node: Node): Node => node.kind === 'group' ? ungroup(node.expression) : node;
export function algebraOutputUnit(data: AlgebraicExpressionProblem): string | null {
    const context = data.context;
    return context.kind === 'quantitative-system' ? context.quantities.find(quantity => quantity.quantityId === context.outputQuantityId)!.unit.name : null;
}

function Relationship({relation, quantities}: {relation: AlgebraicQuantityRelation; quantities: readonly AlgebraicQuantity[]}) {
    const name = (id: string) => quantityMeaning(quantities.find(quantity => quantity.quantityId === id)!, quantities);
    switch (relation.kind) {
        case 'fixed-and-proportional': return <p>The {name(relation.resultId)} includes the {name(relation.fixedId)} and a charge for each unit of {name(relation.inputId)} at the stated {name(relation.rateId)}.</p>;
        case 'equal-groups': return <p>The {name(relation.resultId)} covers all equally sized groups. Use the stated {name(relation.groupCountId)} and the {name(relation.amountPerGroupId)} in each group.</p>;
        case 'combined-amounts': return <p>The {name(relation.resultId)} consists of the {name(relation.firstId)} and the {name(relation.secondId)} together.</p>;
        case 'remaining-amount': return <p>The {name(relation.removedId)} is removed from the {name(relation.initialId)}. The quantity of interest is the {name(relation.resultId)}.</p>;
        case 'equal-sharing': return <p>The {name(relation.totalId)} is shared equally among the stated {name(relation.shareCountId)}. The quantity of interest is the {name(relation.resultId)}.</p>;
        case 'rectangular-measure': return <p>A rectangle has the stated {name(relation.lengthId)} and {name(relation.widthId)}. The quantity of interest is its {name(relation.resultId)}.</p>;
        case 'cubical-measure': return <p>A cube has the stated {name(relation.edgeId)}. The quantity of interest is its {relation.measure === 'surface-area' ? 'surface area' : 'volume'}.</p>;
    }
}

/** The quantitative facts supply semantics, units and admissibility, never a ready output formula. */
export function AlgebraContextProse({data, includeBindings, revealSymbols}: {data: AlgebraicExpressionProblem; includeBindings: boolean; revealSymbols: boolean}) {
    const context = data.context;
    if (context.kind === 'parameter-description') return <div data-role="algebra-context-prose"><p>The inputs are numbers. Find the resulting number.</p>{data.symbols.map((symbol, index) => {
        const binding = data.substitution.bindings.find(value => value.symbolId === symbol.symbolId)!;
        return <p className="mt-2" key={symbol.symbolId}>{revealSymbols ? <>The number denoted by <i>{symbol.symbol}</i></> : `Input number ${index + 1}`} may be any of the {algebraDomain(symbol.domain)}.{includeBindings && <> For this calculation that number is {exactNumericNotation(binding.notation)}.</>}</p>;
    })}</div>;
    const derived = new Set(context.relations.map(relation => relation.resultId));
    const primitives = context.quantities.filter(quantity => !derived.has(quantity.quantityId));
    const output = context.quantities.find(quantity => quantity.quantityId === context.outputQuantityId)!;
    return <div data-role="algebra-context-prose"><p>This {context.setting} situation concerns the {quantityMeaning(output, context.quantities)}, measured in {output.unit.name}.</p>
        {primitives.map(quantity => {
            const atom = ungroup(quantity.expression);
            const variable = context.variableQuantities.find(value => value.quantityId === quantity.quantityId);
            if (!variable) return <p className="mt-2" key={quantity.quantityId}>The {quantityMeaning(quantity, context.quantities)} is {atom.kind === 'number' && exactNumericNotation(atom.notation)} {quantity.unit.name}.</p>;
            const declaration = data.symbols.find(value => value.symbolId === variable.symbolId)!;
            const binding = data.substitution.bindings.find(value => value.symbolId === variable.symbolId)!;
            return <p className="mt-2" key={quantity.quantityId}>The {quantityMeaning(quantity, context.quantities)} is measured in {quantity.unit.name} and admits {algebraDomain(declaration.domain)}.{revealSymbols && <> In the formula, <i>{algebraSymbol(data.symbols, variable.symbolId)}</i> denotes this quantity.</>}{includeBindings && <> Here it is {exactNumericNotation(binding.notation)} {quantity.unit.name}.</>}</p>;
        })}
        <div className="mt-3 space-y-2">{context.relations.map((relation, index) => <Relationship key={index} relation={relation} quantities={context.quantities} />)}</div>
    </div>;
}

export function AbstractModelProse({data}: {data: AlgebraicExpressionProblem}) {
    return <><p>Consider the following relationship between input numbers and a resulting number.</p><PrescribedAlgebraCalculation node={data.expression} symbols={data.symbols} revealSymbols={false} /><AlgebraDomains data={data} revealSymbols={false} /></>;
}
