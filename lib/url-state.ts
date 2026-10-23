import { clampLight, type RakingLight } from '@/lib/scene/lighting';
import { VIEW_IDS, type ViewId } from '@/lib/scene/camera';

/** Shareable viewer state, kept in the exhibit URL's query string. */
export type ViewerLink = { region?: string; view?: ViewId; light?: RakingLight };

/**
 * Reads `?region=…&view=…&light=az,el`. Unknown regions and malformed values are dropped,
 * so an old or edited link still opens the exhibit.
 */
export function parseViewerLink(search: string, regionIds: ReadonlySet<string>): ViewerLink {
  const params = new URLSearchParams(search);
  const link: ViewerLink = {};
  const region = params.get('region');
  if (region && regionIds.has(region)) link.region = region;
  const view = params.get('view');
  if (view && (VIEW_IDS as readonly string[]).includes(view)) link.view = view as ViewId;
  const light = params.get('light')?.split(',').map(Number);
  if (light?.length === 2 && light.every(Number.isFinite))
    link.light = clampLight({ azimuth: light[0], elevation: light[1] });
  return link;
}

/** Query string for a link, or '' when there is nothing to share. */
export function serializeViewerLink(link: ViewerLink): string {
  const params = new URLSearchParams();
  if (link.region) params.set('region', link.region);
  else if (link.view) params.set('view', link.view);
  if (link.light) params.set('light', `${link.light.azimuth},${link.light.elevation}`);
  const query = params.toString();
  return query ? `?${query}` : '';
}
