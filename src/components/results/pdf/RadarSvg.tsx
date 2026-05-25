// Pure SVG radar chart for the PDF (spec 006, FR-007).
// Hand-rolled with @react-pdf/renderer's SVG primitives so the output is true
// vector — sharp at any zoom, selectable text on axis labels, no rasterisation.
//
// Math: 8 evenly-spaced axes starting at the top (12 o'clock) going clockwise.
// Each score (1-10) projects radially from center; the polygon connects the 8
// projected points.
import { Svg, Polygon, Line, Circle, Text } from '@react-pdf/renderer';
import { ELEMENT_CODES } from '@/types';
import type { ElementCode } from '@/types';
import { palette, RADAR } from './styles';

interface Props {
  scores: Record<ElementCode, number>;
}

function point(cx: number, cy: number, r: number, angleRad: number): [number, number] {
  return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)];
}

export function RadarSvg({ scores }: Props) {
  const { size, center, maxRadius, ringCount, axisCount } = RADAR;

  // Angles: start at -π/2 (top), step by 2π/N clockwise.
  const angles = Array.from({ length: axisCount }, (_, i) =>
    -Math.PI / 2 + (i * 2 * Math.PI) / axisCount,
  );

  // Background grid rings (concentric polygons for an octagon-shaped grid).
  const rings = Array.from({ length: ringCount }, (_, i) => {
    const r = ((i + 1) / ringCount) * maxRadius;
    const pts = angles.map((θ) => point(center, center, r, θ));
    return pts.map((p) => p.join(',')).join(' ');
  });

  // Axis lines from center to each outer vertex.
  const outerVertices = angles.map((θ) => point(center, center, maxRadius, θ));

  // The user's polygon — score / 10 × maxRadius along each axis.
  const userPoints = ELEMENT_CODES.map((code, i) => {
    const r = (scores[code] / 10) * maxRadius;
    return point(center, center, r, angles[i]);
  });
  const userPolygon = userPoints.map((p) => p.join(',')).join(' ');

  // Axis labels — push slightly outside the outer ring.
  const labelRadius = maxRadius + 14;
  const labelPositions = angles.map((θ) => point(center, center, labelRadius, θ));

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map((pts, i) => (
        <Polygon
          key={`ring-${i}`}
          points={pts}
          stroke={palette.radarGrid}
          strokeWidth={0.6}
          fill="none"
        />
      ))}

      {/* Axis lines */}
      {outerVertices.map(([x, y], i) => (
        <Line
          key={`axis-${i}`}
          x1={center}
          y1={center}
          x2={x}
          y2={y}
          stroke={palette.radarGrid}
          strokeWidth={0.6}
        />
      ))}

      {/* User score polygon */}
      <Polygon
        points={userPolygon}
        fill={palette.accent}
        fillOpacity={0.5}
        stroke={palette.accent}
        strokeWidth={1.5}
      />

      {/* User score dots */}
      {userPoints.map(([x, y], i) => (
        <Circle key={`dot-${i}`} cx={x} cy={y} r={2.5} fill={palette.accent} />
      ))}

      {/* Element code labels (FB, HM, ML, …) */}
      {labelPositions.map(([x, y], i) => (
        <Text
          key={`label-${i}`}
          x={x}
          y={y + 3}
          fill={palette.text}
          textAnchor="middle"
          style={{ fontSize: 10, fontWeight: 700 }}
        >
          {ELEMENT_CODES[i]}
        </Text>
      ))}
    </Svg>
  );
}
