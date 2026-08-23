import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureConversionView} from '../measure-conversion-view.tsx';
import {
    MeasureConversionExecutionViewConfig,
    MeasureConversionExecutionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-conversion-execution';

interface CoreProps {
    config: MeasureConversionExecutionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <MeasureConversionView mode="execution" payload={payload} viewId={VIEW_ID} />
);

export const MeasureConversionExecution = withConfig(
    MeasureConversionExecutionViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureConversionExecution payload={payload} />);
};
