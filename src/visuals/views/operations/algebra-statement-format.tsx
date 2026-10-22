import type {AlgebraicEquationProblem, AlgebraicInequalityProblem, ExactAlgebraicStatement, ExactSymbolicExpressionNode, StatementAmbientDomain} from '../../../types/problems.ts';
import {algebraDomain} from './algebra-expression-format.tsx';
import {ExactNumericExpression, exactNumericValue} from './numerical-power-expression-format.tsx';

type Variable = AlgebraicEquationProblem['variable'];
/** Same explicit-group syntax as the expression formatter, without fabricating a symbol domain. */
export function StatementExpression({node, variable, atomic = false}: {node: ExactSymbolicExpressionNode; variable: Variable; atomic?: boolean}) {
    const child = (part: ExactSymbolicExpressionNode, atom = false) => <StatementExpression node={part} variable={variable} atomic={atom} />;
    const content = node.kind === 'number' ? <ExactNumericExpression node={node} atomic={atomic} />
        : node.kind === 'variable' ? <i>{variable.symbol}</i>
            : node.kind === 'group' ? <>({child(node.expression)})</>
                : node.kind === 'binary' ? <>{child(node.left, true)} {{addition: '+', subtraction: '-', multiplication: '×', division: '÷'}[node.operation]} {child(node.right, true)}</>
                    : node.kind === 'power' ? <>{child(node.base, true)}<sup>{node.exponent}</sup></>
                        : <>-{(node.operand.kind === 'negation' || node.operand.kind === 'power') && '('}{child(node.operand, true)}{(node.operand.kind === 'negation' || node.operand.kind === 'power') && ')'}</>;
    return <span data-statement-node={node.kind} data-statement-node-id={node.id}>{content}</span>;
}
export const statementOperator = {equal: '=', less: '<', greater: '>'} as const;
export function StatementRelation({statement, variable}: {statement: ExactAlgebraicStatement; variable: Variable}) {
    return <><StatementExpression node={statement.left} variable={variable} /> {statementOperator[statement.operator]} <StatementExpression node={statement.right} variable={variable} /></>;
}
export function StatementDomain({domain}: {domain: StatementAmbientDomain}) {
    return <span data-role="statement-domain">{domain.kind === 'finite' ? <>the finite set {'{'}{domain.values.map(exactNumericValue).join(', ')}{'}'}</> : algebraDomain(domain.values)}</span>;
}
export type StatementProblem = AlgebraicEquationProblem | AlgebraicInequalityProblem;
