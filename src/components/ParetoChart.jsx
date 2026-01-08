import React from 'react';
import { Bar } from 'react-chartjs-2';

const ParetoChart = ({ data, title }) => {
    // 1. Sort defects by frequency descending
    const sortedEntries = Object.entries(data)
        .sort((a, b) => b[1] - a[1]);

    const labels = sortedEntries.map(e => e[0]);
    const counts = sortedEntries.map(e => e[1]);

    // 2. Calculate cumulative percentages
    const total = counts.reduce((a, b) => a + b, 0);
    let runningSum = 0;
    const cumulativePercentages = counts.map(count => {
        runningSum += count;
        return ((runningSum / total) * 100).toFixed(1);
    });

    const chartData = {
        labels: labels,
        datasets: [
            {
                type: 'bar',
                label: 'Defect Frequency',
                data: counts,
                backgroundColor: 'rgba(56, 189, 248, 0.6)',
                borderColor: 'rgb(56, 189, 248)',
                borderWidth: 1,
                yAxisID: 'y',
                order: 2
            },
            {
                type: 'line',
                label: 'Cumulative %',
                data: cumulativePercentages,
                borderColor: '#ef4444',
                borderWidth: 2,
                pointBackgroundColor: '#ef4444',
                fill: false,
                yAxisID: 'y1',
                order: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        if (context.dataset.type === 'line') {
                            return `Cumulative: ${context.raw}%`;
                        }
                        return `Count: ${context.raw}`;
                    }
                }
            }
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Frequency' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                max: 100,
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'Percentage (%)' }
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
            <div className="flex-1 min-h-[400px]">
                <Bar data={chartData} options={options} />
            </div>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-500 italic">
                    * Pareto Principle: 80% of rejections are often caused by only 20% of defect types. Use this to focus on machine calibration.
                </p>
            </div>
        </div>
    );
};

export default ParetoChart;
