import type {AlgebraicExpressionProblem, AlgebraicSymbolDeclaration, AlgebraicVariableDomain, ExactSymbolicExpressionNode as Node} from '../../../types/problems.ts';
import {ExactNumericExpression, exactNumericNotation, exactNumericValue} from './numerical-power-expression-format.tsx';

export const algebraSymbol = (symbols: readonly AlgebraicSymbolDeclaration[], id: string): string => symbols.find(symbol => symbol.symbolId === id)!.symbol;
export function algebraNode(node: Node, id: string): Node {
    if (node.id === id) return node;
    const children = node.kind === 'binary' ? [node.left, node.right] : node.kind === 'group' ? [node.expression] : node.kind === 'negation' ? [node.operand] : node.kind === 'power' ? [node.base] : [];
    for (const child of children) {
        const found = findNode(child, id);
        if (found) return found;
    }
    throw new Error('A validated expression reference is missing.');
}
function findNode(node: Node, id: string): Node | undefined {
    if (node.id === id) return node;
    const children = node.kind === 'binary' ? [node.left, node.right] : node.kind === 'group' ? [node.expression] : node.kind === 'negation' ? [node.operand] : node.kind === 'power' ? [node.base] : [];
    for (const child of children) {const found = findNode(child, id); if (found) return found;}
    return undefined;
}

/** Syntax formatting and optional highlighting only; no substitution or arithmetic is performed. */
export function AlgebraExpression({node, symbols, markedId, atomic = false}: {node: Node; symbols: readonly AlgebraicSymbolDeclaration[]; markedId?: string; atomic?: boolean}) {
    const child = (part: Node, atom = false) => <AlgebraExpression node={part} symbols={symbols} markedId={markedId} atomic={atom} />;
    const content = node.kind === 'number' ? <ExactNumericExpression node={node} atomic={atomic} />
        : node.kind === 'variable' ? <i data-symbol-id={node.symbolId}>{algebraSymbol(symbols, node.symbolId)}</i>
            : node.kind === 'group' ? <>({child(node.expression)})</>
                : node.kind === 'binary' ? <>{child(node.left, true)} {{addition: '+', subtraction: '-', multiplication: '×', division: '÷'}[node.operation]} {child(node.right, true)}</>
                    : node.kind === 'power' ? <>{child(node.base, true)}<sup className="ml-0.5 text-[0.7em]">{node.exponent}</sup></>
                        : <>-{(node.operand.kind === 'power' || node.operand.kind === 'negation') && '('}{child(node.operand, true)}{(node.operand.kind === 'power' || node.operand.kind === 'negation') && ')'}</>;
    return <span data-algebra-node={node.kind} data-algebra-id={node.id} className={node.id === markedId ? 'rounded bg-amber-100 px-0.5 ring-1 ring-amber-300' : undefined}>{content}</span>;
}

export function algebraDomain(domain: AlgebraicVariableDomain): string {
    const parts = [domain.kind === 'integer' ? 'integers' : 'rational numbers'];
    if (domain.lower) parts.push(`${domain.lower.inclusive ? 'at least' : 'greater than'} ${exactNumericValue(domain.lower.value)}`);
    if (domain.upper) parts.push(`${domain.upper.inclusive ? 'at most' : 'less than'} ${exactNumericValue(domain.upper.value)}`);
    if (domain.excludedValues.length) parts.push(`excluding ${domain.excludedValues.map(exactNumericValue).join(', ')}`);
    return parts.join('; ');
}

/** Ordered necessary prose; symbols may be withheld for the separate modeling task. */
export function PrescribedAlgebraCalculation({node, symbols, revealSymbols}: {node: Node; symbols: readonly AlgebraicSymbolDeclaration[]; revealSymbols: boolean}) {
    if (node.kind === 'number') return <span>the number {exactNumericNotation(node.notation)}</span>;
    if (node.kind === 'variable') return <span>{revealSymbols ? <>the number denoted by <i>{algebraSymbol(symbols, node.symbolId)}</i></> : `input number ${symbols.findIndex(symbol => symbol.symbolId === node.symbolId) + 1}`}</span>;
    const instruction = node.kind === 'binary' ? {addition: 'Add these two quantities:', subtraction: 'Subtract the second quantity below from the first:', multiplication: 'Multiply these two quantities:', division: 'Divide the first quantity below by the second:'}[node.operation]
        : node.kind === 'group' ? 'Treat this whole quantity together:' : node.kind === 'power' ? `Raise the following quantity to the power ${node.exponent}:` : 'Take the opposite of this quantity:';
    const children = node.kind === 'binary' ? [node.left, node.right] : node.kind === 'group' ? [node.expression] : node.kind === 'power' ? [node.base] : [node.operand];
    return <div><p>{instruction}</p><ol className="mt-1 space-y-2 border-l-2 border-slate-300 pl-4">{children.map((part, index) => <li key={part.id}>{children.length > 1 && <span className="mr-2 text-sm text-slate-500">{index === 0 ? 'First quantity:' : 'Second quantity:'}</span>}<PrescribedAlgebraCalculation node={part} symbols={symbols} revealSymbols={revealSymbols} /></li>)}</ol></div>;
}

export function AlgebraDomains({data, revealSymbols = true, proseRestrictions = false}: {data: AlgebraicExpressionProblem; revealSymbols?: boolean; proseRestrictions?: boolean}) {
    return <div className="mt-3 space-y-2 text-sm" data-role="algebra-domains">{data.symbols.map((symbol, index) => <p key={symbol.symbolId}>{revealSymbols ? <i>{symbol.symbol}</i> : `Input ${index + 1}`}: {algebraDomain(symbol.domain)}.</p>)}
        {data.restrictions.map(restriction => <div key={`${restriction.reason}-${restriction.expressionNodeId}`}><p>The following quantity must be nonzero:</p>{revealSymbols && !proseRestrictions ? <AlgebraExpression node={algebraNode(data.expression, restriction.expressionNodeId)} symbols={data.symbols} /> : <PrescribedAlgebraCalculation node={algebraNode(data.expression, restriction.expressionNodeId)} symbols={data.symbols} revealSymbols={revealSymbols} />}</div>)}
    </div>;
}
