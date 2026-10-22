import {createRoot} from 'react-dom/client';
import {isAlgebraicExpressionProblem} from '../../../../generators/algebra/algebra-expression-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AlgebraSubexpressionBody} from '../algebra-expression-view.tsx';
import {AlgebraSubexpressionInterpretationViewSchema, type AlgebraSubexpressionInterpretationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'algebra-subexpression-interpretation';
export const AlgebraSubexpressionInterpretationCore = ({payload}: {config: AlgebraSubexpressionInterpretationViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // Empty restrictions and optional calculation/factor arrays are validated by the exact guard.
    validateProblemData(VIEW_ID, data, ['kind', 'expression', 'symbols', 'substitution', 'structuralExpression', 'structuralRelations', 'groupedOperands', 'context']);
    if (!isAlgebraicExpressionProblem(data)) throw new ViewValidationError(VIEW_ID, 'The symbolic structure, domains, substitution or quantitative context is inconsistent.');
    return <AlgebraSubexpressionBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const AlgebraSubexpressionInterpretation = withConfig(AlgebraSubexpressionInterpretationViewSchema, AlgebraSubexpressionInterpretationCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AlgebraSubexpressionInterpretation payload={payload} />);
};
