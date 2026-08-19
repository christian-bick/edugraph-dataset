import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticVerticalView} from '../arithmetic-vertical-view.tsx';
import {OperationsVerticalViewConfig, OperationsVerticalViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsVerticalViewConfig;
    payload: ViewRenderPayload<'operations-vertical'>;
}

const Core = ({payload}: CoreProps) => (
    <ArithmeticVerticalView invertProcedure={false} payload={payload} />
);

export const OperationsVertical = withConfig(OperationsVerticalViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-vertical'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsVertical payload={payload} />);
};
