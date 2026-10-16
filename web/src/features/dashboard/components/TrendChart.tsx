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
            if (!chartArea) return '#0d9488';
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, '#064e3b');
            gradient.addColorStop(0.5, '#0d9488');
            gradient.addColorStop(1, '#14b8a6');
            return gradient;
          },
          borderColor: '#0d9488',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
          stack: 'emissions',
          hoverBackgroundColor: '#2dd4bf',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
        },
        {
          label: isBangla ? 'অনুমিত অংশ (Estimated)' : 'Proxy Estimated',
          data: estimatedValues,
          backgroundColor: hatch,
          borderColor: '#f59e0b',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          stack: 'emissions',
          hoverBackgroundColor: '#fde68a',
          hoverBorderColor: '#ffffff',
          hoverBorderWidth: 3,
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
          borderColor: '#0d9488',
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 9,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#0d9488',
          pointBorderWidth: 2,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: '#14b8a6',
          fill: true,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(13, 148, 136, 0.15)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(20, 184, 166, 0.45)');
            gradient.addColorStop(0.6, 'rgba(13, 148, 136, 0.15)');
            gradient.addColorStop(1, 'rgba(13, 148, 136, 0.0)');
            return gradient;
          },
        },
        {
          label: isBangla ? 'শুধুমাত্র যাচাইকৃত (Verified Only)' : 'Verified Only',
          data: verifiedValues,
          borderColor: '#0284c7',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#0284c7',
          pointBorderWidth: 2,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: '#0284c7',
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
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-teal-100/40 via-emerald-50/20 to-transparent pointer-events-none rounded-tr-3xl" />

      {/* Header with Title and Mode Switcher */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 shadow-sm">
              <Sparkles size={16} />
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
              </span>
            </span>
            <h3 className="font-bold text-slate-900 text-base md:text-lg tracking-tight">
              {isBangla ? 'মাসিক নির্গমন ট্রেন্ড ও গতিপথ' : 'Carbon Footprint Trajectory'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-9">
            {isBangla
              ? 'স্কোপ ১, ২ ও ৩ এর সম্মিলিত বিশ্লেষণ (যাচাইকৃত প্রমাণ বনাম প্রক্সি অনুমিত)'
              : 'Multi-period Scope 1, 2 & 3 trajectory (verified vs estimated proxy)'}
          </p>
        </div>

        {/* View Toggle Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/70 shadow-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                chartType === 'bar'
                  ? 'bg-white text-teal-900 shadow-sm scale-102 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>{isBangla ? 'বার চার্ট' : 'Stacked'}</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                chartType === 'area'
                  ? 'bg-white text-teal-900 shadow-sm scale-102 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LineChart size={13} />
              <span>{isBangla ? 'কার্ভ ভিউ' : 'Spline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Hover Inspector or Micro KPI Bar */}
      {hoveredData ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl shadow-md border border-teal-500/30 transition-all duration-300">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="font-bold text-xs text-teal-300 tracking-wide">
              {isBangla ? hoveredData.periodLabelBn : hoveredData.periodLabelEn}
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-xs text-slate-300">
              {isBangla ? 'যাচাইকৃত' : 'Verified'}:{' '}
              <strong className="text-white font-mono">
                {isBangla ? toBanglaDigits(hoveredData.verifiedEmissions.toFixed(2)) : hoveredData.verifiedEmissions.toFixed(2)}
              </strong>{' '}
              tCO₂e
            </span>
            {hoveredData.estimatedEmissions > 0 && (
              <>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-xs text-amber-300">
                  {isBangla ? 'অনুমিত' : 'Estimated'}:{' '}
                  <strong className="font-mono">
                    {isBangla ? toBanglaDigits(hoveredData.estimatedEmissions.toFixed(2)) : hoveredData.estimatedEmissions.toFixed(2)}
                  </strong>{' '}
                  tCO₂e
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-mono self-end sm:self-auto">
            <span className="text-[11px] text-slate-400">{isBangla ? 'মোট' : 'Total'}:</span>
            <span className="text-sm font-black text-teal-300">
              {isBangla ? toBanglaDigits(hoveredData.totalEmissions.toFixed(2)) : hoveredData.totalEmissions.toFixed(2)} tCO₂e
            </span>
          </div>
        </div>
      ) : (
        /* Micro KPI Bar */
        <div className="grid grid-cols-3 gap-2 py-1">
          <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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

          <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
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

          <div className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
              {isBangla ? 'চলতি প্রবণতা' : 'Period Shift'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {stats.momDiff <= 0 ? (
                <span className="inline-flex items-center text-xs font-bold text-emerald-600">
                  <TrendingDown size={14} className="mr-0.5" />
                  {isBangla ? toBanglaDigits(Math.abs(stats.momDiff).toFixed(1)) : Math.abs(stats.momDiff).toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-bold text-rose-600">
                  <TrendingUp size={14} className="mr-0.5" />
                  +{isBangla ? toBanglaDigits(stats.momDiff.toFixed(1)) : stats.momDiff.toFixed(1)}%
                </span>
              )}
              <span className="text-[10px] text-slate-400">MoM</span>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
          <span>
            {isBangla
              ? 'রসিদ আপলোড অনুযায়ী চার্টের ডেটা স্বয়ংক্রিয়ভাবে রিক্যালকুলেট হয়।'
              : 'Interactive real-time model updated dynamically from verified receipts.'}
          </span>
        </div>
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
