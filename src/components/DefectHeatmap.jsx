import React from 'react';
import { LayoutGrid, AlertCircle } from 'lucide-react';

const DefectHeatmap = ({ data, title }) => {
    if (!data || !data.matrix) return <div className="p-10 text-center text-slate-400">Loading heatmap data...</div>;

    const { machines, defects, matrix } = data;

    // Helper to get color intensity
    const getColorClass = (count) => {
        if (count === 0) return 'bg-slate-50 text-slate-300';
        if (count < 5) return 'bg-orange-100 text-orange-700';
        if (count < 15) return 'bg-orange-300 text-orange-900 font-bold';
        if (count < 30) return 'bg-orange-500 text-white font-bold';
        return 'bg-rose-600 text-white font-bold animate-pulse';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <LayoutGrid className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-slate-800">{title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-600 rounded"></div> Critical</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-300 rounded"></div> Moderate</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-100 border border-slate-200 rounded"></div> None</span>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-white z-10">Machine</th>
                            {defects.map(d => (
                                <th key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[100px]">
                                    {d}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {machines.map(m => (
                            <tr key={m} className="border-t border-slate-50">
                                <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-50">
                                    {m === 'F1' || m === 'F2' || m === 'F3' || m === 'F4' ? `Front ${m.substring(1)}` : `Rear ${m.substring(1)}`}
                                </td>
                                {defects.map(d => {
                                    const count = matrix[m][d];
                                    return (
                                        <td key={`${m}-${d}`} className="p-2">
                                            <div
                                                className={`h-12 flex items-center justify-center rounded-lg transition-all duration-300 ${getColorClass(count)}`}
                                                title={`${m} - ${d}: ${count} defects`}
                                            >
                                                {count > 0 ? count : '-'}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-orange-50 border-t border-orange-100">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-orange-900">Heatmap Intelligence</h4>
                        <p className="text-xs text-orange-700 mt-1">
                            This view correlates specific defect types with machines. If a machine shows high intensity in one column, it likely requires mechanical calibration for that specific wafer feature.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefectHeatmap;
