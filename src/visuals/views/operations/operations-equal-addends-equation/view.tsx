import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {EqualAddendsEquation} from '../equal-addends-equation-view.tsx';
import {OperationsEqualAddendsEquationViewSchema, type OperationsEqualAddendsEquationViewConfig} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsEqualAddendsEquationViewConfig;
    payload: ViewRenderPayload<'operations-equal-addends-equation'>;
}

const Core = ({payload}: CoreProps) => (
    <EqualAddendsEquation data={payload.problem.data} isSolutionView={payload.isSolutionView} />
);

export const OperationsEqualAddendsEquation = withConfig(OperationsEqualAddendsEquationViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-equal-addends-equation'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsEqualAddendsEquation payload={payload} />);
};
