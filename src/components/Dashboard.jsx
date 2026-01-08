import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import ParetoChart from './ParetoChart';
import ComparisonTable from './ComparisonTable';
import DefectHeatmap from './DefectHeatmap';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Download, FileText, Calendar, Clock, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { fetchDashboardData, fetchComparisonData, fetchHeatmapData } from '../dataService';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

const Dashboard = ({ filter }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Date and Shift State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedShift, setSelectedShift] = useState('All');
    const [selectedHour, setSelectedHour] = useState(null);
    const [comparisonData, setComparisonData] = useState(null);
    const [heatmapData, setHeatmapData] = useState(null);

    const exportExcel = () => {
        if (!data || !data.recent) return;
        const ws = XLSX.utils.json_to_sheet(data.recent);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Records");
        XLSX.writeFile(wb, "AOI_Data_Export.xlsx");
    };

    const exportPDF = () => {
        if (!data || !data.recent) return;
        const doc = new jsPDF();
        doc.text(`AOI Report - ${selectedDate} ${selectedShift}`, 14, 15);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
        const tableData = data.recent.map(r => [
            r.id, r.camera_id, r.ng_type || 'NG', new Date(r.created_at).toLocaleString()
        ]);
        doc.autoTable({
            head: [['ID', 'Camera', 'Defect', 'Time']],
            body: tableData,
            startY: 30,
        });
        doc.save("AOI_Report.pdf");
    };

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const result = await fetchDashboardData(filter, selectedDate, selectedShift);
            if (result && !result.error) {
                setData(result);
                setSelectedHour(null);
            }

            if (filter.type === 'analysis' && filter.mode === 'comparison') {
                const compResult = await fetchComparisonData(filter.area, selectedDate);
                setComparisonData(compResult);
            }

            if (filter.type === 'analysis' && filter.mode === 'heatmap') {
                const heatResult = await fetchHeatmapData(filter.area, selectedDate);
                setHeatmapData(heatResult);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    }, [filter, selectedDate, selectedShift]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 600000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            if (window.electronAPI?.manualSync) {
                await window.electronAPI.manualSync();
            }
            await fetchData();
        } catch (err) { console.error(err); }
        finally { setSyncing(false); }
    };

    const displayedDefects = (selectedHour !== null && data?.hourlyDefects)
        ? data.hourlyDefects[selectedHour] || {}
        : data?.defects || {};

    const pieData = {
        labels: Object.keys(displayedDefects),
        datasets: [{
            data: Object.values(displayedDefects),
            backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6'],
            borderWidth: 1,
            borderColor: '#fff',
        }],
    };

    const trendData = {
        labels: data?.trend?.map(t => {
            const d = t.date.split('-');
            return `${d[1]}/${d[2]}`;
        }) || [],
        datasets: [{
            label: 'Throughput',
            data: data?.trend?.map(t => t.total) || [],
            fill: true,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            borderColor: '#6366f1',
            tension: 0.4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2,
            pointRadius: 4,
        }]
    };

    const hourlyData = data?.hourly || {};
    const sortedHours = Object.keys(hourlyData)
        .filter(h => h !== 'NaN' && !isNaN(parseInt(h)))
        .sort((a, b) => parseInt(a) - parseInt(b));

    const barData = {
        labels: sortedHours.map(h => `${h}:00`),
        datasets: [{
            label: 'NG Count',
            data: sortedHours.map(h => hourlyData[h]),
            backgroundColor: '#6366f1',
            borderRadius: 4,
        }],
    };

    if (loading && !data) return <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>;

    return (
        <div className="flex-1 bg-slate-50 overflow-y-auto">
            <header className="bg-white border-b border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {filter.type === 'all' ? 'Factory Overview' : `${filter.name}`}
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent border-none text-sm text-slate-700 focus:outline-none" />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="bg-transparent border-none text-sm text-slate-700 focus:outline-none">
                                <option value="All">All Shifts</option>
                                <option value="Shift A">Shift A (06:00-14:00)</option>
                                <option value="Shift B">Shift B (14:00-22:00)</option>
                                <option value="Shift C">Shift C (22:00-06:00)</option>
                            </select>
                        </div>
                        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium bg-blue-50 text-blue-600 border-blue-100">
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync'}
                        </button>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium"><Download className="w-4 h-4" /> Excel</button>
                    <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium"><FileText className="w-4 h-4" /> PDF</button>
                </div>
            </header>

            <div className="p-6">
                {filter.type === 'analysis' && filter.mode === 'pareto' ? (
                    <div className="space-y-6">
                        <ParetoChart data={data?.defects || {}} title={`Pareto Analysis - ${filter.area.toUpperCase()} Region`} />
                    </div>
                ) : filter.type === 'analysis' && filter.mode === 'comparison' ? (
                    <div className="space-y-6">
                        <ComparisonTable data={comparisonData} area={filter.area} />
                    </div>
                ) : filter.type === 'analysis' && filter.mode === 'heatmap' ? (
                    <div className="space-y-6">
                        <DefectHeatmap data={heatmapData} title={`Defect Distribution Heatmap - ${filter.area.toUpperCase()} Region`} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-500 text-xs font-medium uppercase">Total Input</h3>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{data?.totalInput || 0}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-500 text-xs font-medium uppercase">Total NG</h3>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{data?.total || 0}</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-500 text-xs font-medium uppercase">Yield (FPY)</h3>
                                <p className={`text-2xl font-bold mt-1 ${(data?.yield || 0) < 98 ? 'text-rose-500' : 'text-emerald-500'}`}>{data?.yield || '0.00'}%</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="text-slate-500 text-xs font-medium uppercase">Avg NG/Hr</h3>
                                <p className="text-2xl font-bold text-blue-500 mt-1">{(data?.total / (Object.keys(data?.hourly || {}).length || 1)).toFixed(1)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4">Defect Distribution</h3>
                                <div className="h-[350px]">
                                    <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' }, datalabels: { display: true, color: '#fff', formatter: (v, c) => (v / c.dataset.data.reduce((a, b) => a + b) * 100).toFixed(1) + '%' } } }} />
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4">Hourly Trend</h3>
                                <div className="h-[350px]">
                                    <Bar data={barData} options={{ maintainAspectRatio: false, onClick: (e, el, chart) => { if (el.length) setSelectedHour(sortedHours[el[0].index]); }, plugins: { legend: { display: false } } }} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4">7-Day Throughput Trend</h3>
                            <div className="h-64">
                                <Line data={trendData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
