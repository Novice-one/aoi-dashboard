import React from 'react';
import { CheckCircle, AlertTriangle, TrendingUp, Target } from 'lucide-react';

const ComparisonTable = ({ data, area }) => {
    // Mock processing for comparison if backend isn't fully ready for side-by-side
    // In a real scenario, we'd aggregate stats per machine name
    const machines = area === 'front' ? ['Front 1', 'Front 2', 'Front 3', 'Front 4'] : ['Rear 1', 'Rear 2', 'Rear 3', 'Rear 4'];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Machine Performance Comparison ({area.toUpperCase()})</h3>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" /> High Yield
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" /> Needs Calibration
                    </span>
                </div>
            </div>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                        <th className="p-4">Machine Name</th>
                        <th className="p-4">Total Input</th>
                        <th className="p-4">NG Count</th>
                        <th className="p-4">Yield (FPY)</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data ? Object.entries(data).map(([id, stats]) => (
                        <tr key={id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-700">{stats.name}</td>
                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                    <span>{stats.input.toLocaleString()}</span>
                                </div>
                            </td>
                            <td className="p-4 text-slate-600">
                                <div className="flex flex-col">
                                    <span className="font-medium text-rose-600">{stats.ng.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400">DPPM: {stats.dppm.toLocaleString()}</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-full bg-slate-100 rounded-full h-2 max-w-[80px]">
                                        <div className={`h-2 rounded-full ${stats.yield < 98 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(stats.yield, 100)}%` }}></div>
                                    </div>
                                    <span className={`font-bold ${stats.yield < 98 ? 'text-rose-600' : 'text-emerald-600'}`}>{stats.yield}%</span>
                                </div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${stats.status === 'Healthy' ? 'bg-emerald-100 text-emerald-700' :
                                        stats.status === 'Warning' ? 'bg-rose-100 text-rose-700' :
                                            'bg-slate-100 text-slate-400'
                                    }`}>
                                    {stats.status}
                                </span>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="5" className="p-10 text-center text-slate-400">Loading comparison metrics...</td></tr>
                    )}
                </tbody>
            </table>
            <div className="p-6 bg-blue-50/50 border-t border-blue-100">
                <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-blue-900">Efficiency Insights</h4>
                        <p className="text-xs text-blue-700 mt-1">
                            Identify "Bad Actors" quickly. Machines with yield consistently below 98% (Target) will be highlighted for maintenance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonTable;
