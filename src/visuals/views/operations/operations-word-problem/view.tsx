import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticWordProblemView} from '../arithmetic-word-problem-view.tsx';
import {
    OperationsWordProblemViewConfig,
    OperationsWordProblemViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsWordProblemViewConfig;
    payload: ViewRenderPayload<'operations-word-problem'>;
}

const Core = ({payload}: CoreProps) => (
    <ArithmeticWordProblemView invertProcedure={false} payload={payload} />
);

export const OperationsWordProblem = withConfig(OperationsWordProblemViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-word-problem'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsWordProblem payload={payload} />);
};
