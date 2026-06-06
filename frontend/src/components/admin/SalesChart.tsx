'use client';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import Loader from '@/components/ui/loader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ChartOptions,
} from 'chart.js';
import { ordersAPI } from '@/lib/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function getMockData() {
  const today = new Date();
  const values = [4200, 7800, 5100, 9300, 6700, 11200, 8400];
  return values.map((total, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return { date: d.toISOString().split('T')[0], total };
  });
}

function buildChartData(items: { date: string; total: number }[]) {
  return {
    labels: items.map(item =>
      new Date(item.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Ventas',
      data: items.map(item => Number(item.total)),
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 2.5,
      pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: true,
      backgroundColor: (ctx: any) => {
        const { ctx: canvasCtx, chartArea } = ctx.chart;
        if (!chartArea) return 'rgba(99, 102, 241, 0.1)';
        const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        return gradient;
      },
      tension: 0.4,
    }],
  };
}

const options: ChartOptions<'line'> = {
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 15, 25, 0.85)',
      titleColor: '#a5b4fc',
      bodyColor: '#ffffff',
      padding: 12,
      cornerRadius: 8,
      displayColors: false,
      callbacks: {
        label: (ctx) => ` $${(ctx.parsed.y ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#94a3b8', font: { size: 12 } },
    },
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      border: { display: false, dash: [4, 4] },
      ticks: {
        color: '#94a3b8',
        font: { size: 12 },
        callback: (value) => `$${Number(value).toLocaleString('es-AR')}`,
      },
    },
  },
};

export default function SalesChart() {
  const [chartData, setChartData] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    ordersAPI.getSalesData().then(res => {
      const items = res.data?.length ? res.data : getMockData();
      if (!res.data?.length) setIsMock(true);
      setTotal(items.reduce((acc: number, item: any) => acc + Number(item.total), 0));
      setChartData(buildChartData(items));
    }).catch(() => {
      const items = getMockData();
      setIsMock(true);
      setTotal(items.reduce((acc, item) => acc + item.total, 0));
      setChartData(buildChartData(items));
    });
  }, []);

  if (!chartData) return (
    <Loader />
  );

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-gray-800">
            ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-gray-400 mb-0.5">últimos 7 días</span>
        </div>
        {isMock && <span className="text-xs text-gray-300 italic">datos de ejemplo</span>}
      </div>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
