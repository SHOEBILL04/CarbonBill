import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, FileText } from 'lucide-react';
import { ReviewField } from './reviewApi';

interface DocumentImageViewerProps {
  fileName: string;
  activeField: ReviewField | null;
  fields: ReviewField[];
}

export function DocumentImageViewer({
  fileName,
  activeField,
  fields,
}: DocumentImageViewerProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  function handleZoomIn() {
    setZoom((prev) => Math.min(prev + 0.25, 2.5));
  }

  function handleZoomOut() {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  }

  function handleRotate() {
    setRotation((prev) => (prev + 90) % 360);
  }

  function handleReset() {
    setZoom(1);
    setRotation(0);
  }

  // Parse bounding box if present
  let activeBbox: { left: number; top: number; width: number; height: number } | null = null;
  if (activeField?.boundingBoxJson) {
    try {
      activeBbox = JSON.parse(activeField.boundingBoxJson);
    } catch {
      // Ignored
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
      {/* Control Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-slate-300 text-xs">
        <div className="flex items-center gap-2 truncate">
          <FileText size={16} className="text-emerald-400 shrink-0" />
          <span className="font-mono font-medium truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            title="ছোট করুন (Zoom Out)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <ZoomOut size={16} />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            title="বড় করুন (Zoom In)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleRotate}
            title="ঘুরান (Rotate 90°)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <RotateCw size={16} />
          </button>
          <button
            onClick={handleReset}
            title="রিসেট ফিট (Reset)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Document View Canvas Area */}
      <div className="flex-1 relative overflow-auto p-4 flex items-center justify-center min-h-[460px]">
        <div
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative max-w-full shadow-2xl rounded-lg overflow-hidden bg-white"
        >
          {/* Simulated High-Fidelity Bill Preview with Real Data */}
          <div className="w-[520px] min-h-[640px] bg-slate-50 p-6 text-slate-900 font-sans text-xs select-none">
            {/* Header */}
            <div className="border-b-2 border-slate-300 pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black text-slate-800 tracking-tight">
                    {fields.find((f) => f.fieldName === 'Vendor')?.normalizedValue || 'UTILITY PROVIDER'}
                  </h2>
                  <p className="text-[11px] text-slate-500">Dhaka Distribution Zone • Industrial LT-E</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-700">
                    Bill No: {fields.find((f) => f.fieldName === 'BillNumber')?.rawValue || 'N/A'}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Period: {fields.find((f) => f.fieldName === 'BillingPeriod')?.rawValue || '2026-06'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bill Meta Table */}
            <div className="grid grid-cols-2 gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Consumer Name</p>
                <p className="font-bold text-slate-800">Radiant Apparels Ltd</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Sanctioned Load</p>
                <p className="font-bold text-slate-800">450 kW</p>
              </div>
            </div>

            {/* Consumption Highlights */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">রেকর্ডকৃত মোট ব্যবহার (Consumption):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {fields.find((f) => f.fieldName === 'Quantity')?.rawValue || '0'} {fields.find((f) => f.fieldName === 'Unit')?.rawValue || ''}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">পাওয়ার ফ্যাক্টর জরিমানা (Penalty):</span>
                <span className="font-mono font-bold text-slate-700">
                  {fields.find((f) => f.fieldName === 'PowerFactorPenalty')?.rawValue || '৳ ০.০০'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-800 font-black text-sm">সর্বমোট প্রদেয় বিল (Net Payable):</span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  ৳ {fields.find((f) => f.fieldName === 'AmountBdt')?.rawValue || '0.00'}
                </span>
              </div>
            </div>

            {/* Simulated Stamp */}
            <div className="mt-8 flex justify-end">
              <div className="border-2 border-emerald-600/70 text-emerald-800 font-bold text-[10px] uppercase px-3 py-1 rounded-lg transform -rotate-12 inline-block">
                Paid / পরিশোধিত
              </div>
            </div>
          </div>

          {/* Interactive Bounding Box Highlight Overlay */}
          {activeBbox && (
            <div
              style={{
                position: 'absolute',
                left: `${activeBbox.left * 100}%`,
                top: `${activeBbox.top * 100}%`,
                width: `${activeBbox.width * 100}%`,
                height: `${activeBbox.height * 100}%`,
              }}
              className="border-3 border-amber-500 bg-amber-400/25 rounded-md pointer-events-none animate-pulse shadow-lg transition-all"
            >
              <span className="absolute -top-5 left-0 bg-amber-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                {activeField?.fieldName}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
