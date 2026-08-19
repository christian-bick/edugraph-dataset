import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticVerticalView} from '../arithmetic-vertical-view.tsx';
import {
    OperationsVerticalInversionViewConfig,
    OperationsVerticalInversionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsVerticalInversionViewConfig;
    payload: ViewRenderPayload<'operations-vertical-inversion'>;
}

const Core = ({payload}: CoreProps) => (
    <ArithmeticVerticalView invertProcedure payload={payload} />
);

export const OperationsVerticalInversion = withConfig(OperationsVerticalInversionViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-vertical-inversion'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsVerticalInversion payload={payload} />);
};
