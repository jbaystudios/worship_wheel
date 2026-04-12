'use client';

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
import type { ElementScore, ElementCode } from '@/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface RadarChartProps {
  elementScores: ElementScore[];
}

const ELEMENT_ORDER: ElementCode[] = ['FB', 'HM', 'ML', 'RH', 'TO', 'TH', 'TE', 'AU'];

export function RadarChart({ elementScores }: RadarChartProps) {
  // Ensure we render in element order regardless of input order
  const orderedScores = ELEMENT_ORDER.map(
    (code) => elementScores.find((s) => s.elementCode === code)?.score ?? 0,
  );

  const data: ChartData<'radar'> = {
    labels: ELEMENT_ORDER,
    datasets: [
      {
        label: 'Your Score',
        data: orderedScores,
        backgroundColor: 'rgba(177, 155, 100, 0.4)', // accent-500 @ 40%
        borderColor: 'rgba(177, 155, 100, 1)', // accent-500
        borderWidth: 2,
        pointBackgroundColor: 'rgba(177, 155, 100, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(29, 28, 26, 0.95)', // neutral-900
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(245, 244, 244, 1)',
        padding: 12,
        titleFont: { family: 'Montserrat', weight: 'bold', size: 14 },
        bodyFont: { family: 'Montserrat', size: 14 },
        displayColors: false,
      },
    },
    scales: {
      r: {
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          display: false,
        },
        grid: {
          color: 'rgba(70, 69, 66, 0.6)', // neutral-700 @ 60%
          lineWidth: 1,
        },
        angleLines: {
          color: 'rgba(70, 69, 66, 0.6)',
          lineWidth: 1,
        },
        pointLabels: {
          color: 'rgba(190, 176, 140, 1)', // accent-400
          font: {
            family: 'Montserrat',
            size: 16,
            weight: 'bold',
          },
          padding: 12,
        },
      },
    },
  };

  return (
    <div className="mx-auto w-full max-w-[836px] aspect-square">
      <Radar data={data} options={options} />
    </div>
  );
}
