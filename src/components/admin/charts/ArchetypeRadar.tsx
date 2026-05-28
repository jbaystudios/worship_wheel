'use client';

// Small-multiple radar chart for per-archetype detail (spec 007 T020).
// Matches the consumer /results RadarChart styling, scaled down for the
// archetype detail view.
import { useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import type { ElementCode } from '@/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

const ELEMENT_ORDER: ElementCode[] = ['FB', 'HM', 'ML', 'RH', 'TO', 'TH', 'TE', 'AU'];

interface ArchetypeRadarProps {
  /** Average score per element, keyed by ElementCode. Values 0–10. */
  elementAverages: Partial<Record<ElementCode, number>>;
  /** Label for the dataset tooltip. */
  label?: string;
}

export function ArchetypeRadar({ elementAverages, label = 'Average' }: ArchetypeRadarProps) {
  const ordered = ELEMENT_ORDER.map((code) => elementAverages[code] ?? 0);

  const data: ChartData<'radar'> = {
    labels: ELEMENT_ORDER,
    datasets: [
      {
        label,
        data: ordered,
        backgroundColor: 'rgba(177, 155, 100, 0.4)',
        borderColor: 'rgba(177, 155, 100, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(177, 155, 100, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(29, 28, 26, 0.95)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(245, 244, 244, 1)',
        padding: 10,
        titleFont: { family: 'Montserrat', weight: 'bold', size: 13 },
        bodyFont: { family: 'Montserrat', size: 13 },
        displayColors: false,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: { stepSize: 2, display: false },
        grid: { color: 'rgba(70, 69, 66, 0.6)', lineWidth: 1 },
        angleLines: { color: 'rgba(70, 69, 66, 0.6)', lineWidth: 1 },
        pointLabels: {
          color: 'rgba(190, 176, 140, 1)',
          font: { family: 'Montserrat', size: 13, weight: 'bold' },
          padding: 8,
        },
      },
    },
  };

  return (
    <div className="mx-auto w-full max-w-md aspect-square">
      <Radar data={data} options={options} />
    </div>
  );
}
