import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Play, 
  CheckCircle2, 
  Sliders, 
  Sparkles, 
  AlertCircle,
  Database,
  RefreshCw
} from 'lucide-react';
import type { AutomationScheduleItem } from '../../types';
import { api } from '../../services/api';

interface AutomationScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  automations: AutomationScheduleItem[];
  onRefresh: () => void;
}

export const AutomationScheduleModal: React.FC<AutomationScheduleModalProps> = ({
  isOpen,
  onClose,
  automations,
  onRefresh
}) => {
  const [schedules, setSchedules] = useState<AutomationScheduleItem[]>(automations);
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  // Sinkronkan state saat modal dibuka
  React.useEffect(() => {
    setSchedules(automations);
    setExecutionMessage(null);
  }, [automations, isOpen]);

  if (!isOpen) return null;

  const handleTimeChange = (taskKey: string, newTime: string) => {
    setSchedules(prev => prev.map(s => 
      s.task_key === taskKey ? { ...s, time_range: newTime } : s
    ));
  };

  const handleToggleActive = (taskKey: string) => {
    setSchedules(prev => prev.map(s => 
      s.task_key === taskKey ? { ...s, is_active: !s.is_active, status: !s.is_active ? 'ACTIVE' : 'PAUSED' } : s
    ));
  };

  const handleSaveSchedule = async (schedule: AutomationScheduleItem) => {
    setSavingKey(schedule.task_key);
    try {
      await api.updateAutomation(schedule.task_key, {
        time_range: schedule.time_range,
        is_active: schedule.is_active
      });
      setExecutionMessage(`Jadwal "${schedule.title}" berhasil disimpan secara persisten ke database PostgreSQL.`);
      onRefresh();
    } catch (err: any) {
      setExecutionMessage(`Gagal menyimpan jadwal: ${err.message || 'Kesalahan koneksi'}`);
    } finally {
      setSavingKey(null);
    }
  };

  const handleRunNow = async (taskKey: string) => {
    setRunningKey(taskKey);
    try {
      const res = await api.runAutomation(taskKey);
      if (res && res.detail) {
        setExecutionMessage(`[EKSEKUSI SUKSES]: ${res.detail.message}`);
      } else {
        setExecutionMessage(`Otomasi ${taskKey} berhasil dieksekusi.`);
      }
      onRefresh();
    } catch (err: any) {
      setExecutionMessage(`Gagal mengeksekusi otomasi: ${err.message || 'Server error'}`);
    } finally {
      setRunningKey(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '24px',
        background: '#0d1520',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)'
      }}>
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sliders size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Konfigurasi Jadwal & Otomasi Tenant
                <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                  PostgreSQL ACID
                </span>
              </h3>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Konfigurasi jam operasional otonom dan preferensi eksekusi per-tenant (Real Database).
              </p>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Notifikasi feedback / execution audit */}
        {executionMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: executionMessage.includes('Gagal') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: executionMessage.includes('Gagal') ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
            color: executionMessage.includes('Gagal') ? '#fca5a5' : '#34d399',
            fontSize: '0.76rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {executionMessage.includes('Gagal') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{executionMessage}</span>
          </div>
        )}

        {/* Schedule List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {schedules.map((item) => {
            const isRunning = runningKey === item.task_key;
            const isSaving = savingKey === item.task_key;

            return (
              <div 
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: item.is_active ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                        {item.title}
                      </h4>
                      <span style={{
                        fontSize: '0.62rem',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: item.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: item.is_active ? '#34d399' : '#94a3b8',
                        fontWeight: 600
                      }}>
                        {item.is_active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '3px 0 0 0', lineHeight: 1.35 }}>
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Toggle Aktif / Nonaktif */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.72rem', color: '#cbd5e1' }}>
                    <input 
                      type="checkbox"
                      checked={item.is_active}
                      onChange={() => handleToggleActive(item.task_key)}
                      style={{ accentColor: '#10b981', cursor: 'pointer' }}
                    />
                    <span>{item.is_active ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>

                {/* Form Pengaturan Jam & Aksi */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94a3b8', fontSize: '0.72rem' }}>
                      <Clock size={13} color="#38bdf8" />
                      <span>Jam Operasional:</span>
                    </div>
                    <select
                      value={item.time_range}
                      onChange={(e) => handleTimeChange(item.task_key, e.target.value)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#f8fafc',
                        fontSize: '0.74rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="08:00 - 08:30">08:00 - 08:30 (Pagi / Buka Toko)</option>
                      <option value="12:00 - 12:30">12:00 - 12:30 (Siang Hari)</option>
                      <option value="13:00 - 13:30">13:00 - 13:30 (Default SOP Siang)</option>
                      <option value="15:00 - 16:00">15:00 - 16:00 (Sore Hari)</option>
                      <option value="16:30 - 17:00">16:30 - 17:00 (Sore Jelang Tutup)</option>
                      <option value="20:00 - 20:30">20:00 - 20:30 (Malam Tutup Kasir)</option>
                      <option value="21:00 - 21:30">21:00 - 21:30 (Rekonsiliasi Malam)</option>
                    </select>
                  </div>

                  {/* Tombol Simpan & Trigger Run Now */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleSaveSchedule(item)}
                      disabled={isSaving}
                      style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                      title="Simpan pengaturan jam ini ke database PostgreSQL"
                    >
                      {isSaving ? <RefreshCw size={12} className="spin" /> : <Database size={12} />}
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan DB'}</span>
                    </button>

                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleRunNow(item.task_key)}
                      disabled={isRunning || !item.is_active}
                      style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                      title="Jalankan otomatisasi ini sekarang juga"
                    >
                      {isRunning ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
                      <span>{isRunning ? 'Mengeksekusi...' : 'Jalankan Sekarang'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(6, 182, 212, 0.06)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color="#38bdf8" />
            <span>Setiap eksekusi jadwal diaudit otomatis oleh <strong>FinOrchestrator Cognitive Trace</strong>.</span>
          </div>
          <button 
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.74rem' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
