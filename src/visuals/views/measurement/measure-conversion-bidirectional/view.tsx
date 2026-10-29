import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasureConversionBidirectionalView} from '../measure-conversion-view.tsx';
import {
    MeasureConversionBidirectionalViewConfig,
    MeasureConversionBidirectionalViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-conversion-bidirectional';

interface CoreProps {
    config: MeasureConversionBidirectionalViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <MeasureConversionBidirectionalView payload={payload} />
);

export const MeasureConversionBidirectional = withConfig(
    MeasureConversionBidirectionalViewSchema,
    Core
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureConversionBidirectional payload={payload} />);
};
