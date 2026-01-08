# AOI Dashboard - Professional Roadmap

This document outlines the proposed improvements to transform the AOI Dashboard into a professional industrial tool for solar cell manufacturing.

## Analytical Improvements

### 1. Pareto Analysis (Defect Segregation)
- Replace Pie Charts with Pareto Charts (Bar + Cumulative line).
- Identify the "Vital Few" (the 20% of defect types causing 80% of rejections).

### 2. Industrial KPIs
- **First Pass Yield (FPY)**: Calculate yield percentage.
- **DPPM (Defects Per Million)**: Standard semiconductor metric for quality.
- **NG Rate**: Track rejects vs. total produced.

### 3. Machine & Camera Comparison
- "Bad Actor" identification.
- side-by-side comparison of machines (e.g., F1 vs F2 vs F3).
- side-by-side comparison of cameras within a machine.

### 4. Advanced Trends
- **7-Day Rolling Average**: Compare current performance against historical baseline.
- **Shift Performance Overlay**: Identify if specific shifts have higher reject rates.

### 5. Data Depth
- Implement "Back-Sync" to pull 30+ days of historical data for long-term trend analysis.

## UI/UX Enhancements
- Switch to Doughnut charts for secondary metrics.
- Implement a more robust "Export" system including daily summary PDFs.
- Real-time alerts (Red/Green indicators) based on yield thresholds.
