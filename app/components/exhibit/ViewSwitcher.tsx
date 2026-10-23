import { VIEW_IDS, VIEW_LABELS, type ViewId } from '@/lib/scene/camera';

/** Fixed camera viewpoints; the active one is shown pressed until the camera is moved. */
export default function ViewSwitcher({
  active,
  onView,
}: {
  active: ViewId | null;
  onView: (view: ViewId) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label="Camera views">
      {VIEW_IDS.map((id, i) => (
        <button
          key={id}
          aria-pressed={active === id}
          onClick={() => onView(id)}
          title={`${VIEW_LABELS[id]} view (${i + 1})`}
        >
          {VIEW_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
