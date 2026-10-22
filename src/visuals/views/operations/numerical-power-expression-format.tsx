import type {ExactNumericalExpressionNode, ExactNumericNotation, ExactNumericValue} from '../../../types/problems.ts';

export const exactNumericNotation = (notation: ExactNumericNotation): string => notation.kind === 'fraction'
    ? `${notation.numerator}/${notation.denominator}` : notation.numeral;
export const exactNumericValue = (value: ExactNumericValue): string => value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
const symbols = {addition: '+', subtraction: '-', multiplication: '×', division: '÷'} as const;

/** Formats supplied syntax only. Atomic clarity parentheses never become group nodes or work. */
export function ExactNumericExpression({node, atomic = false}: {node: ExactNumericalExpressionNode; atomic?: boolean}) {
    if (node.kind === 'number') {
        const content = exactNumericNotation(node.notation);
        const wrap = atomic && (node.value.numerator < 0 || node.notation.kind === 'fraction');
        return <span data-node-kind="number" data-node-id={node.id} data-literal-notation={content}>{wrap ? `(${content})` : content}</span>;
    }
    if (node.kind === 'group') return <span data-node-kind="group" data-node-id={node.id}>(<ExactNumericExpression node={node.expression} />)</span>;
    if (node.kind === 'binary') return <span data-node-kind="binary" data-node-id={node.id}><ExactNumericExpression node={node.left} atomic /> {symbols[node.operation]} <ExactNumericExpression node={node.right} atomic /></span>;
    if (node.kind === 'power') return <span data-node-kind="power" data-node-id={node.id}><ExactNumericExpression node={node.base} atomic /><sup className="ml-0.5 text-[0.7em]" data-role="power-exponent">{node.exponent}</sup></span>;
    // A power binds before unary minus. Extra clarity parentheses do not add a group identity.
    const wrapOperand = node.operand.kind === 'power' || node.operand.kind === 'negation';
    return <span data-node-kind="negation" data-node-id={node.id}>-{wrapOperand && '('}<ExactNumericExpression node={node.operand} atomic />{wrapOperand && ')'}</span>;
}

function LiteralProse({notation}: {notation: ExactNumericNotation}) {
    if (notation.kind === 'fraction') return <>the fraction with numerator {notation.numerator < 0 ? `negative ${String(notation.numerator).slice(1)}` : notation.numerator} and denominator {notation.denominator}</>;
    const numeral = notation.numeral.startsWith('-') ? `negative ${notation.numeral.slice(1)}` : notation.numeral;
    return <>{notation.kind === 'decimal' ? 'the decimal' : 'the number'} {numeral}</>;
}

/** Ordered prose exposes the prescribed operations, without printing the requested expression. */
export function PrescribedNumericCalculation({node}: {node: ExactNumericalExpressionNode}) {
    if (node.kind === 'number') return <span><LiteralProse notation={node.notation} /></span>;
    if (node.kind === 'binary') {
        const instruction = node.operation === 'addition' ? 'Add these two quantities:'
            : node.operation === 'subtraction' ? 'Subtract the second quantity below from the first:'
                : node.operation === 'multiplication' ? 'Multiply these two quantities:' : 'Divide the first quantity below by the second:';
        return <div><p>{instruction}</p><ol className="mt-1 space-y-2 border-l-2 border-slate-300 pl-5">{[node.left, node.right].map((child, index) => <li key={child.id}><span className="mr-2 text-sm text-slate-500">{index === 0 ? 'First quantity:' : 'Second quantity:'}</span><PrescribedNumericCalculation node={child} /></li>)}</ol></div>;
    }
    const child = node.kind === 'group' ? node.expression : node.kind === 'power' ? node.base : node.operand;
    const instruction = node.kind === 'group' ? 'Treat this whole calculation as one quantity:'
        : node.kind === 'negation' ? 'Take the opposite of this quantity:' : `Raise the following quantity to the power ${node.exponent}:`;
    return <div><p>{instruction}</p><div className="mt-1 border-l-2 border-slate-300 pl-5"><PrescribedNumericCalculation node={child} /></div></div>;
}
