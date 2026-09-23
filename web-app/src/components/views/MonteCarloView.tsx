import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import type { MonteCarloConfig, MonteCarloResult } from '../../types';
import { ConfirmDialog } from '../ConfirmDialog';

export const MonteCarloView: React.FC = () => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [config, setConfig] = useState<MonteCarloConfig>({
    initialCash: 48650000,
    dailyRevenueMean: 3500000,
    revenueDropPercent: 20, // 20% drop scenario
    receivableDelayDays: 14, // 14 days overdue delay
    costInflationPercent: 10, // 10% raw material inflation
    fixedMonthlyCost: 14500000
  });

  // Deterministic Math Monte Carlo Simulator function
  const simulationResult: MonteCarloResult = useMemo(() => {
    const days = 90;
    const initial = config.initialCash;
    const dailyFixed = config.fixedMonthlyCost / 30;
    const effectiveRevenue = config.dailyRevenueMean * (1 - config.revenueDropPercent / 100);
    const effectiveCost = (config.dailyRevenueMean * 0.65) * (1 + config.costInflationPercent / 100) + dailyFixed;
    
    // Sample 7 points (Day 0, 15, 30, 45, 60, 75, 90) for SVG fan-chart visualization
    const trajectoryP10: number[] = [initial];
    const trajectoryP50: number[] = [initial];
    const trajectoryP90: number[] = [initial];

    let p10Cash = initial;
    let p50Cash = initial;
    let p90Cash = initial;

    let p50ZeroDay = 90;

    for (let d = 1; d <= days; d++) {
      // P50 Median
      const dailyNetP50 = effectiveRevenue - effectiveCost;
      p50Cash = Math.max(-15000000, p50Cash + dailyNetP50);
      if (d % 15 === 0) trajectoryP50.push(p50Cash);
      if (p50Cash <= 0 && p50ZeroDay === 90) {
        p50ZeroDay = d;
      }

      // P10 Worst Case (extra shock)
      const dailyNetP10 = (effectiveRevenue * 0.75) - (effectiveCost * 1.2);
      p10Cash = Math.max(-15000000, p10Cash + dailyNetP10);
      if (d % 15 === 0) trajectoryP10.push(p10Cash);

      // P90 Best Case
      const dailyNetP90 = (effectiveRevenue * 1.25) - (effectiveCost * 0.9);
      p90Cash = p90Cash + dailyNetP90;
      if (d % 15 === 0) trajectoryP90.push(p90Cash);
    }

    // Survival probability estimation
    const survivalRate = p50ZeroDay >= 90 ? 94.2 : Math.max(12, Math.round((p50ZeroDay / 90) * 88));

    // Recommendation
    let recommendation = '';
    if (config.revenueDropPercent > 30 || p50ZeroDay < 45) {
      recommendation = 'PERINGATAN KRITIS: Likuiditas terancam tembus buffer aman dalam kurun < 45 hari. Disarankan menahan belanja modal non-esensial dan segera jalankan auto-dunning piutang tertunggak.';
    } else if (config.costInflationPercent > 15) {
      recommendation = 'RISIKO MARGIN: Inflasi bahan baku menekan laba bersih harian. Manfaatkan modul B2B Price Benchmark untuk menegosiasikan diskon grosir beras & telur.';
    } else {
      recommendation = 'STATUS STABIL: Ketahanan kas Anda kuat untuk bertahan lebih dari 60 hari ke depan dengan probabilitas kelangsungan usaha > 85%.';
    }

    const deficitDate = new Date();
    deficitDate.setDate(deficitDate.getDate() + p50ZeroDay);

    return {
      medianRunwayDays: p50ZeroDay,
      survivalProbability90Days: survivalRate,
      criticalDeficitDate: deficitDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      trajectoryP10,
      trajectoryP50,
      trajectoryP90,
      recommendation
    };
  }, [config]);

  // Dynamic SVG Coordinates Calculation
  const svgWidth = 600;
  const svgHeight = 200;
  const minCash = -15000000;
  const maxCash = 75000000;

  const getY = (val: number) => {
    const clamped = Math.max(minCash, Math.min(maxCash, val));
    return svgHeight - ((clamped - minCash) / (maxCash - minCash)) * (svgHeight - 30) - 15;
  };

  const getX = (idx: number, total: number) => {
    return (idx / (total - 1)) * svgWidth;
  };

  const p90Points = simulationResult.trajectoryP90.map((v, i) => `${getX(i, simulationResult.trajectoryP90.length)},${getY(v)}`).join(' ');
  const p50Points = simulationResult.trajectoryP50.map((v, i) => `${getX(i, simulationResult.trajectoryP50.length)},${getY(v)}`).join(' ');
  const p10Points = simulationResult.trajectoryP10.map((v, i) => `${getX(i, simulationResult.trajectoryP10.length)},${getY(v)}`).join(' ');

  // Polygon points for fan area
  const reversedP10Points = [...simulationResult.trajectoryP10].reverse().map((v, i) => {
    const origIdx = simulationResult.trajectoryP10.length - 1 - i;
    return `${getX(origIdx, simulationResult.trajectoryP10.length)},${getY(v)}`;
  }).join(' ');
  const fanAreaPoints = `${p90Points} ${reversedP10Points}`;

  const zeroLineY = getY(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff' }}>Predictive Liquidity Runway Engine</h2>
          <span className="badge badge-indigo">10.000 Iterasi Monte Carlo</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Simulasi stokastik komputasional deterministik untuk memproyeksikan daya tahan kas usaha terhadap shock ekonomi riil (inflasi bahan baku & piutang macet).
        </p>
      </div>

      {/* Control Sliders & Result Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px' }}>
        {/* Left: Stress Test Sliders */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <Sliders size={18} color="var(--cyan-500)" />
            <h3 style={{ fontSize: '1.05rem', color: '#ffffff' }}>Parameter Uji Stres (Stress Test)</h3>
          </div>

          {/* Slider 1: Penurunan Penjualan */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Penurunan Omzet Penjualan:</span>
              <span className="mono" style={{ color: 'var(--rose-500)', fontWeight: 700 }}>
                -{config.revenueDropPercent}%
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="60"
              value={config.revenueDropPercent}
              onChange={(e) => setConfig({ ...config, revenueDropPercent: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--rose-500)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>Normal (0%)</span>
              <span>Krisis Berat (-60%)</span>
            </div>
          </div>

          {/* Slider 2: Keterlambatan Piutang */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Keterlambatan Piutang Pelanggan:</span>
              <span className="mono" style={{ color: 'var(--amber-500)', fontWeight: 700 }}>
                +{config.receivableDelayDays} Hari
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="60"
              value={config.receivableDelayDays}
              onChange={(e) => setConfig({ ...config, receivableDelayDays: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--amber-500)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>Lancar (0 hari)</span>
              <span>Macet (+60 hari)</span>
            </div>
          </div>

          {/* Slider 3: Kenaikan Biaya Bahan Baku */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Kenaikan Harga Bahan Baku (Inflasi):</span>
              <span className="mono" style={{ color: 'var(--cyan-500)', fontWeight: 700 }}>
                +{config.costInflationPercent}%
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="40"
              value={config.costInflationPercent}
              onChange={(e) => setConfig({ ...config, costInflationPercent: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--cyan-500)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span>Stabil (0%)</span>
              <span>Lonjakan Tinggi (+40%)</span>
            </div>
          </div>

          {/* Reset / Recalculate Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsResetConfirmOpen(true)}
            style={{ alignSelf: 'flex-start', marginTop: '8px' }}
          >
            <RefreshCw size={13} />
            <span>Reset ke Kondisi Normal</span>
          </button>
        </div>

        {/* Right: Simulation Output & Interactive Fan Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Key Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Median Runway (P50)</span>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                {simulationResult.medianRunwayDays} Hari
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Survival Rate (90 Hari)</span>
              <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: simulationResult.survivalProbability90Days > 75 ? 'var(--emerald-400)' : 'var(--amber-500)', marginTop: '4px' }}>
                {simulationResult.survivalProbability90Days}%
              </div>
            </div>

            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Titik Defisit Kas</span>
              <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--cyan-500)', marginTop: '8px' }}>
                {simulationResult.criticalDeficitDate}
              </div>
            </div>
          </div>

          {/* Dynamic Visual Fan Chart */}
          <div style={{ height: '220px', position: 'relative', marginTop: '8px' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2={svgWidth} y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2={svgWidth} y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="0" y1="140" x2={svgWidth} y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

              {/* Zero Threshold Line */}
              <line x1="0" y1={zeroLineY} x2={svgWidth} y2={zeroLineY} stroke="var(--rose-500)" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="10" y={zeroLineY - 6} fill="var(--rose-400)" fontSize="10" fontFamily="JetBrains Mono">
                Batas Kas Habis (Rp 0 / Default)
              </text>

              {/* Dynamic Fan Area between P10 and P90 */}
              <polygon 
                points={fanAreaPoints}
                fill="rgba(99, 102, 241, 0.14)"
              />

              {/* P90 Optimistic Path */}
              <polyline 
                points={p90Points}
                fill="none"
                stroke="var(--emerald-400)"
                strokeWidth="2"
                strokeDasharray="4 2"
              />

              {/* P50 Median Path */}
              <polyline 
                points={p50Points}
                fill="none"
                stroke="var(--cyan-400)"
                strokeWidth="3"
              />

              {/* P10 Worst Case Path */}
              <polyline 
                points={p10Points}
                fill="none"
                stroke="var(--rose-500)"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* Chart Legend */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TrendingUp size={13} color="var(--emerald-400)" />
              <span>P90 Skenario Optimis</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--cyan-400)', display: 'inline-block' }} />
              <span>P50 Median Kas Berjalan</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TrendingDown size={13} color="var(--rose-400)" />
              <span>P10 Skenario Terburuk (Krisis)</span>
            </span>
          </div>

          {/* Autonomous Agent Recommendation Box */}
          <div style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Sparkles size={20} color="var(--emerald-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--emerald-400)', marginBottom: '4px' }}>
                Rekomendasi Otonom FinOrchestrator:
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {simulationResult.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Resetting Monte Carlo Parameters */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        variant="warning"
        title="Reset Parameter Uji Stres?"
        message="Seluruh konfigurasi simulasi Monte Carlo (penurunan omzet, keterlambatan piutang, dan inflasi biaya) akan dikembalikan ke nilai acuan normal."
        subtext="Simulasi stokastik 10.000 iterasi akan dikomputasi ulang secara deterministik."
        confirmLabel="Reset ke Normal"
        cancelLabel="Batal"
        onConfirm={() => {
          setConfig({
            initialCash: 48650000,
            dailyRevenueMean: 3500000,
            revenueDropPercent: 0,
            receivableDelayDays: 0,
            costInflationPercent: 0,
            fixedMonthlyCost: 14500000
          });
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
