import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureConversionToSmallerView} from '../measure-conversion-view.tsx';
import {
    MeasureConversionToSmallerViewConfig,
    MeasureConversionToSmallerViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-conversion-to-smaller';

interface CoreProps {
    config: MeasureConversionToSmallerViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <MeasureConversionToSmallerView payload={payload} />
);

export const MeasureConversionToSmaller = withConfig(
    MeasureConversionToSmallerViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureConversionToSmaller payload={payload} />);
};
