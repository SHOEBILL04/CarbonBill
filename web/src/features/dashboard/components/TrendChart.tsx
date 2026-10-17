import React, { useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { TrendDataPoint } from '../types';
import { ensureChartRegistered, createHatchPattern } from './ChartSetup';
import { toBanglaDigits } from '../../../shared';
import { TrendingDown, TrendingUp, BarChart3, LineChart, Sparkles, AlertTriangle } from 'lucide-react';

ensureChartRegistered();

interface TrendChartProps {
  data: TrendDataPoint[];
  isBangla: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, isBangla }) => {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute key KPI metrics from the trend series
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { peak: 0, avg: 0, latest: 0, momDiff: 0 };
    const totals = data.map((d) => d.totalEmissions);
    const peak = Math.max(...totals);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const latest = totals[totals.length - 1];
    const prev = totals.length > 1 ? totals[totals.length - 2] : latest;
    const momDiff = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
    return { peak, avg, latest, momDiff };
  }, [data]);

  const labels = useMemo(
    () => data.map((d) => (isBangla ? d.periodLabelBn : d.periodLabelEn)),
    [data, isBangla]
  );

  const hoveredData = hoveredIndex !== null && data[hoveredIndex] ? data[hoveredIndex] : null;

  const barChartData = useMemo(() => {
    const verifiedValues = data.map((d) => d.verifiedEmissions);
    const estimatedValues = data.map((d) => d.estimatedEmissions);
    const hatch = createHatchPattern('#d97706', 'rgba(254, 243, 199, 0.85)');

    return {
      labels,
      datasets: [
        {
          label: isBangla ? 'যাচাইকৃত রসিদ (Verified)' : 'Verified Evidence',
          data: verifiedValues,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return '#059669';
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, '#047857');
            gradient.addColorStop(0.5, '#059669');
            gradient.addColorStop(1, '#10b981');
            return gradient;
          },
          borderColor: '#047857',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          stack: 'emissions',
          hoverBackgroundColor: '#88a788',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
        },
        {
          label: isBangla ? 'অনুমিত অংশ (Estimated)' : 'Proxy Estimated',
          data: estimatedValues,
          backgroundColor: hatch,
          borderColor: '#d97706',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          stack: 'emissions',
          hoverBackgroundColor: '#fde68a',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 2,
        },
      ],
    };
  }, [data, isBangla, labels]);

  const areaChartData = useMemo(() => {
    const totalValues = data.map((d) => d.totalEmissions);
    const verifiedValues = data.map((d) => d.verifiedEmissions);

    return {
      labels,
      datasets: [
        {
          label: isBangla ? 'মোট পদচিহ্ন (Total Trend)' : 'Total Footprint',
          data: totalValues,
          borderColor: '#059669',
          borderWidth: 2.5,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#059669',
          pointBorderWidth: 2,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          pointHoverBackgroundColor: '#047857',
          fill: true,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(5, 150, 105, 0.12)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(5, 150, 105, 0.35)');
            gradient.addColorStop(0.6, 'rgba(5, 150, 105, 0.10)');
            gradient.addColorStop(1, 'rgba(5, 150, 105, 0.0)');
            return gradient;
          },
        },
        {
          label: isBangla ? 'শুধুমাত্র যাচাইকৃত (Verified Only)' : 'Verified Only',
          data: verifiedValues,
          borderColor: '#64748b',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#64748b',
          pointBorderWidth: 2,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          pointHoverBackgroundColor: '#475569',
          fill: false,
        },
      ],
    };
  }, [data, isBangla, labels]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 12, left: 6, right: 6, bottom: 0 },
      },
      animation: {
        duration: 1100,
        easing: 'easeOutQuart' as const,
      },
      transitions: {
        active: {
          animation: {
            duration: 200,
            easing: 'easeOutQuart' as const,
          },
        },
      },
      onHover: (_evt: any, elements: any[]) => {
        if (elements && elements.length > 0) {
          setHoveredIndex(elements[0].index);
        } else {
          setHoveredIndex(null);
        }
      },
      animations: {
        y: {
          easing: 'easeOutQuart' as const,
          duration: 900,
          delay: (context: any) => {
            if (context.type === 'data' && context.mode === 'default') {
              return context.dataIndex * 90 + (context.datasetIndex || 0) * 50;
            }
            return 0;
          },
        },
      },
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            font: { family: 'inherit', size: 11, weight: 600 },
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 14,
            color: '#475569',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { family: 'inherit', size: 12, weight: 700 },
          bodyFont: { family: 'inherit', size: 11, weight: 500 },
          padding: 12,
          cornerRadius: 12,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          boxPadding: 4,
          callbacks: {
            label: (context: any) => {
              const val = context.parsed.y;
              const formatted = isBangla ? toBanglaDigits(val.toFixed(2)) : val.toFixed(2);
              return ` ${context.dataset.label}: ${formatted} tCO₂e`;
            },
            afterBody: (tooltipItems: any[]) => {
              const total = tooltipItems.reduce((acc, curr) => acc + (curr.parsed.y || 0), 0);
              const formatted = isBangla ? toBanglaDigits(total.toFixed(2)) : total.toFixed(2);
              return `\n${isBangla ? 'সর্বমোট' : 'Total'}: ${formatted} tCO₂e`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'inherit', size: 11, weight: 600 },
            color: '#64748b',
          },
          border: { display: false },
        },
        y: {
          stacked: chartType === 'bar',
          grid: {
            color: '#f1f5f9',
            lineWidth: 1,
          },
          border: { display: false },
          ticks: {
            callback: (val: any) => (isBangla ? toBanglaDigits(val) : val),
            font: { family: 'inherit', size: 10, weight: 500 },
            color: '#94a3b8',
            padding: 8,
          },
          title: {
            display: true,
            text: isBangla ? 'নির্গমন (tCO₂e)' : 'Emissions (tCO₂e)',
            font: { size: 11, weight: 600, family: 'inherit' },
            color: '#64748b',
          },
        },
      },
    };
  }, [isBangla, chartType]);

  const hasHatchedPoint = data.some((d) => d.hatchFlag);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Sparkles size={15} />
            </span>
            <h3 className="font-bold text-slate-900 text-sm md:text-base">
              {isBangla ? 'মাসিক নির্গমন ট্রেন্ড ও গতিপথ' : 'Emissions Trajectory'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isBangla
              ? 'স্কোপ ১, ২ ও ৩ এর সম্মিলিত বিশ্লেষণ (যাচাইকৃত বনাম প্রক্সি অনুমিত)'
              : 'Multi-period emissions trajectory (verified vs proxy estimated)'}
          </p>
        </div>

        {/* View Toggle Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>{isBangla ? 'বার চার্ট' : 'Stacked'}</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LineChart size={13} />
              <span>{isBangla ? 'কার্ভ ভিউ' : 'Spline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stable Micro KPI Bar */}
      <div className="grid grid-cols-3 gap-2 py-0.5">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
            {isBangla ? 'সর্বোচ্চ নির্গমন' : 'Peak Period'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-black text-slate-900">
              {isBangla ? toBanglaDigits(stats.peak.toFixed(1)) : stats.peak.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">tCO₂e</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
            {isBangla ? 'মাসিক গড়' : 'Monthly Avg'}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-black text-slate-900">
              {isBangla ? toBanglaDigits(stats.avg.toFixed(1)) : stats.avg.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">tCO₂e</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
            {isBangla ? 'চলতি প্রবণতা' : 'Period Shift'}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {stats.momDiff <= 0 ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-700">
                <TrendingDown size={14} className="mr-0.5" />
                {isBangla ? toBanglaDigits(Math.abs(stats.momDiff).toFixed(1)) : Math.abs(stats.momDiff).toFixed(1)}%
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-rose-700">
                <TrendingUp size={14} className="mr-0.5" />
                +{isBangla ? toBanglaDigits(stats.momDiff.toFixed(1)) : stats.momDiff.toFixed(1)}%
              </span>
            )}
            <span className="text-[10px] text-slate-400">MoM</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-64 w-full">
        {chartType === 'bar' ? (
          <Bar data={barChartData} options={options} />
        ) : (
          <Line data={areaChartData} options={options} />
        )}
      </div>

      {/* Footer Banner */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 gap-2">
        <span>
          {isBangla
            ? 'রসিদ আপলোড অনুযায়ী চার্টের ডেটা স্বয়ংক্রিয়ভাবে রিক্যালকুলেট হয়।'
            : 'Updated dynamically as utility receipts are verified.'}
        </span>
        {hasHatchedPoint && (
          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium text-[10px]">
            <AlertTriangle size={12} className="text-amber-600" />
            {isBangla ? 'অনুপস্থিত বিলের অংশ চিহ্নিত' : 'Proxy hatched for missing bills'}
          </span>
        )}
      </div>
    </div>
  );
};
