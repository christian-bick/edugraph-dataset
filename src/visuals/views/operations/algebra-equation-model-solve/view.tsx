import {createRoot} from 'react-dom/client';
import {isAlgebraicEquationProblem} from '../../../../generators/algebra/algebra-statement-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AlgebraEquationModelSolveBody} from '../algebra-statement-view.tsx';
import {AlgebraEquationModelSolveViewSchema, type AlgebraEquationModelSolveViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'algebra-equation-model-solve';
export const AlgebraEquationModelSolveCore = ({payload}: {config: AlgebraEquationModelSolveViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // ambientChecks may validly be empty; the complete guard validates that required array.
    validateProblemData(VIEW_ID, data, ['kind', 'variable', 'ambientDomain', 'statement', 'candidateUniverse', 'assignment', 'candidateChecks', 'restrictedSolutions', 'ambientSolution', 'solutionCardinality', 'context', 'form', 'solutionWitness']);
    if (!(isAlgebraicEquationProblem(data))) throw new ViewValidationError(VIEW_ID, 'The statement, domain, assignments or complete solution witnesses are inconsistent.');
    return <AlgebraEquationModelSolveBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const AlgebraEquationModelSolve = withConfig(AlgebraEquationModelSolveViewSchema, AlgebraEquationModelSolveCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AlgebraEquationModelSolve payload={payload} />);
};

