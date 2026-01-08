import React, { useState } from 'react';
import { LayoutDashboard, Camera, Server, ChevronDown, ChevronRight, LogOut, CheckCircle } from 'lucide-react';

const Sidebar = ({ onSelectFilter }) => {
    const [expanded, setExpanded] = useState({ front: true, rear: false });

    const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-700">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Server className="w-6 h-6 text-blue-400" />
                <h1 className="font-bold text-xl tracking-tight">AOI Master</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div
                    onClick={() => onSelectFilter({ type: 'all' })}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                >
                    <LayoutDashboard className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium">Overview</span>
                </div>

                {/* Front Section */}
                <div>
                    <button onClick={() => toggle('front')} className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg group">
                        <div
                            className="flex items-center gap-3 flex-1"
                            onClick={(e) => { e.stopPropagation(); onSelectFilter({ type: 'front', name: 'Front Machines' }); }}
                        >
                            <Camera className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                            <span className="font-medium">Front Machines</span>
                        </div>
                        {expanded.front ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
                    </button>

                    {expanded.front && (
                        <div className="pl-9 space-y-1 mt-1">
                            {/* NEW: Analytical Sub-options */}
                            <div className="mb-2 space-y-1">
                                <div
                                    onClick={() => onSelectFilter({ type: 'analysis', area: 'front', mode: 'pareto', name: 'Front Machine Pareto' })}
                                    className="p-1.5 text-xs text-indigo-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Pareto Analysis
                                </div>
                                <div
                                    onClick={() => onSelectFilter({ type: 'analysis', area: 'front', mode: 'comparison', name: 'Front Machine Comparison' })}
                                    className="p-1.5 text-xs text-indigo-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Machine Comparison
                                </div>
                                <div
                                    onClick={() => onSelectFilter({ type: 'analysis', area: 'front', mode: 'heatmap', name: 'Front Defect Heatmap' })}
                                    className="p-1.5 text-xs text-indigo-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Defect Heatmap
                                </div>
                            </div>

                            {['Front 1', 'Front 2', 'Front 3', 'Front 4'].map((name) => (
                                <div key={name}>
                                    <div
                                        onClick={() => onSelectFilter({ type: 'machine', name })}
                                        className="p-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer flex justify-between items-center"
                                    >
                                        {name}
                                    </div>
                                    {/* Camera Sub-items */}
                                    <div className="pl-3 space-y-1 border-l-2 border-slate-800 ml-1 mb-1">
                                        <div onClick={(e) => { e.stopPropagation(); onSelectFilter({ type: 'camera', name: `${name} Cam 1` }) }} className="text-xs text-slate-500 hover:text-indigo-300 cursor-pointer px-2 py-1 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-indigo-500 rounded-full"></div> Cam 1
                                        </div>
                                        <div onClick={(e) => { e.stopPropagation(); onSelectFilter({ type: 'camera', name: `${name} Cam 2` }) }} className="text-xs text-slate-500 hover:text-indigo-300 cursor-pointer px-2 py-1 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-indigo-500 rounded-full"></div> Cam 2
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rear Section */}
                <div>
                    <button onClick={() => toggle('rear')} className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-lg group">
                        <div
                            className="flex items-center gap-3 flex-1"
                            onClick={(e) => { e.stopPropagation(); onSelectFilter({ type: 'rear', name: 'Rear Machines' }); }}
                        >
                            <Camera className="w-5 h-5 text-rose-400 group-hover:text-white" />
                            <span className="font-medium">Rear Machines</span>
                        </div>
                        {expanded.rear ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
                    </button>

                    {expanded.rear && (
                        <div className="pl-9 space-y-1 mt-1">
                            {/* NEW: Analytical Sub-options for Rear */}
                            <div className="mb-2 space-y-1">
                                <div
                                    onClick={() => onSelectFilter({ type: 'analysis', area: 'rear', mode: 'pareto', name: 'Rear Machine Pareto' })}
                                    className="p-1.5 text-xs text-rose-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Pareto Analysis
                                </div>
                                <div
                                    onClick={() => onSelectFilter({ type: 'analysis', area: 'rear', mode: 'comparison', name: 'Rear Machine Comparison' })}
                                    className="p-1.5 text-xs text-rose-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Machine Comparison
                                </div>
                                <div
                                    onClick={() => onSelectFilter({ type: 'analysis', area: 'rear', mode: 'heatmap', name: 'Rear Defect Heatmap' })}
                                    className="p-1.5 text-xs text-rose-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Defect Heatmap
                                </div>
                            </div>

                            {['Rear 1', 'Rear 2', 'Rear 3', 'Rear 4'].map((name) => (
                                <div key={name}>
                                    <div
                                        onClick={() => onSelectFilter({ type: 'machine', name })}
                                        className="p-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
                                    >
                                        {name}
                                    </div>
                                    {/* Camera Sub-items */}
                                    <div className="pl-3 space-y-1 border-l-2 border-slate-800 ml-1 mb-1">
                                        <div onClick={(e) => { e.stopPropagation(); onSelectFilter({ type: 'camera', name: `${name} Cam 1` }) }} className="text-xs text-slate-500 hover:text-rose-300 cursor-pointer px-2 py-1 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-rose-500 rounded-full"></div> Cam 1
                                        </div>
                                        <div onClick={(e) => { e.stopPropagation(); onSelectFilter({ type: 'camera', name: `${name} Cam 2` }) }} className="text-xs text-slate-500 hover:text-rose-300 cursor-pointer px-2 py-1 flex items-center gap-2">
                                            <div className="w-1 h-1 bg-rose-500 rounded-full"></div> Cam 2
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-800">
                <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full">
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
