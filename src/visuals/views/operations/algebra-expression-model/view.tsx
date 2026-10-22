import {createRoot} from 'react-dom/client';
import {isAlgebraicExpressionProblem} from '../../../../generators/algebra/algebra-expression-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AlgebraExpressionModelBody} from '../algebra-expression-view.tsx';
import {AlgebraExpressionModelViewSchema, type AlgebraExpressionModelViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'algebra-expression-model';
export const AlgebraExpressionModelCore = ({payload}: {config: AlgebraExpressionModelViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // Empty restrictions and optional calculation/factor arrays are validated by the exact guard.
    validateProblemData(VIEW_ID, data, ['kind', 'expression', 'symbols', 'substitution', 'structuralExpression', 'structuralRelations', 'groupedOperands', 'context']);
    if (!isAlgebraicExpressionProblem(data)) throw new ViewValidationError(VIEW_ID, 'The symbolic structure, domains, substitution or quantitative context is inconsistent.');
    return <AlgebraExpressionModelBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const AlgebraExpressionModel = withConfig(AlgebraExpressionModelViewSchema, AlgebraExpressionModelCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AlgebraExpressionModel payload={payload} />);
};
