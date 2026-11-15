import { faDatabase, faGears, faNetworkWired, faServer, faShieldHalved, faWindowMaximize } from '@fortawesome/free-solid-svg-icons';

/** Trusted presentation only: never sourced from article CSS or remote icons. */
export const FLOWCHART_CSS = `
.node rect { stroke: none !important; rx: 0 !important; ry: 0 !important; }
.cluster rect { fill: #f7f9f8 !important; stroke: none !important; }
.edgeLabel { background-color: #ffffff; }
.nodeLabel { font-weight: 500; }
`;

/** Add bundled role pictograms outside labels, without changing graph geometry. */
export function addDiagramIcons(svg: string): string {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (doc.querySelector('parsererror')) return svg;
  const ns = 'http://www.w3.org/2000/svg';
  for (const node of Array.from(doc.querySelectorAll('g.node'))) {
    const label = node.querySelector('.label')?.textContent?.trim() || '';
    const icon = /nginx/i.test(label) ? faNetworkWired
      : /auth0|policy boundary/i.test(label) ? faShieldHalved
      : /node\.js bff/i.test(label) ? faServer
      : /worker|dispatcher/i.test(label) ? faGears
      : /store|queue/i.test(label) ? faDatabase
      : /^browser$/i.test(label) ? faWindowMaximize : null;
    const rect = node.querySelector('rect');
    if (!icon || !rect) continue;
    const x = Number(rect.getAttribute('x'));
    const y = Number(rect.getAttribute('y'));
    const height = Number(rect.getAttribute('height'));
    if (![x, y, height].every(Number.isFinite) || height <= 0) continue;
    const [width, iconHeight, , , paths] = icon.icon;
    const group = doc.createElementNS(ns, 'g');
    group.setAttribute('aria-hidden', 'true');
    group.setAttribute('class', 'diagram-role-icon');
    group.setAttribute('transform', `translate(${x - 22},${y + height / 2 - 8}) scale(${16 / width},${16 / iconHeight})`);
    group.setAttribute('fill', '#167b70');
    for (const data of Array.isArray(paths) ? paths : [paths]) {
      const path = doc.createElementNS(ns, 'path');
      path.setAttribute('d', data);
      group.append(path);
    }
    node.append(group);
  }
  return new XMLSerializer().serializeToString(doc.documentElement);
}
