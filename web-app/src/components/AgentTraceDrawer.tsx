import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Pause, 
  Play, 
  Copy, 
  Check
} from 'lucide-react';
import type { AgentTraceEvent } from '../types';

interface AgentTraceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: AgentTraceEvent[];
}

export const AgentTraceDrawer: React.FC<AgentTraceDrawerProps> = ({
  isOpen,
  onClose,
  events
}) => {
  const [isLive, setIsLive] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredEvents = selectedModule === 'ALL' 
    ? events 
    : events.filter(e => e.module === selectedModule);

  const handleCopyLogs = () => {
    const text = events.map(e => `[${e.timestamp}] [${e.module}] [${e.action}] (${e.latencyMs}ms): ${e.details}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModuleBadgeColor = (mod: string) => {
    switch (mod) {
      case 'ORCHESTRATOR': return 'badge-emerald';
      case 'PGVECTOR_RAG': return 'badge-indigo';
      case 'DOUBLE_ENTRY': return 'badge-cyan';
      case 'PII_VAULT': return 'badge-amber';
      case 'ELA_FORENSICS': return 'badge-rose';
      default: return 'badge-indigo';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '540px',
      background: 'rgba(6, 9, 17, 0.96)',
      backdropFilter: 'blur(28px)',
      borderLeft: '1px solid var(--border-glow)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-10px 0 35px rgba(0,0,0,0.8)'
    }}>
      {/* Drawer Header */}
      <div style={{
        padding: '18px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Terminal size={18} color="var(--emerald-400)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              FinOrchestrator Cognitive Trace
              <span className={`pulse-dot ${isLive ? '' : 'paused'}`} />
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Real-time Event Streaming & pgvector Cosine Audit Bus
            </span>
          </div>
        </div>

        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Controls Bar */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn btn-sm ${isLive ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setIsLive(!isLive)}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            {isLive ? <Pause size={13} /> : <Play size={13} />}
            <span>{isLive ? 'Pause Stream' : 'Resume Stream'}</span>
          </button>

          <button
            className="btn btn-sm btn-outline"
            onClick={handleCopyLogs}
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            {copied ? <Check size={13} color="var(--emerald-400)" /> : <Copy size={13} />}
            <span>{copied ? 'Tersalin' : 'Copy Log'}</span>
          </button>
        </div>

        {/* Filter dropdown */}
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            padding: '5px 10px',
            borderRadius: '6px'
          }}
        >
          <option value="ALL">Semua Modul</option>
          <option value="ORCHESTRATOR">Orchestrator</option>
          <option value="PII_VAULT">PII Vault (UU PDP)</option>
          <option value="PGVECTOR_RAG">pgvector RAG</option>
          <option value="DOUBLE_ENTRY">Double-Entry Core</option>
          <option value="ELA_FORENSICS">Forensik ELA</option>
        </select>
      </div>

      {/* Terminal Stream Feed */}
      <div style={{
        flex: 1,
        padding: '16px 24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'border-color 0.2s ease',
              borderLeft: evt.status === 'WARN' 
                ? '3px solid var(--amber-500)' 
                : '3px solid var(--emerald-500)'
            }}
          >
            {/* Top row: Timestamp, Module, Latency */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{evt.timestamp}</span>
                <span className={`badge ${getModuleBadgeColor(evt.module)}`} style={{ fontSize: '0.65rem' }}>
                  {evt.module}
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>{evt.latencyMs}ms</span>
            </div>

            {/* Action title */}
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: evt.status === 'WARN' ? 'var(--amber-400)' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {evt.status === 'WARN' ? (
                <AlertTriangle size={13} color="var(--amber-400)" />
              ) : (
                <CheckCircle2 size={13} color="var(--emerald-400)" />
              )}
              <span>{evt.action}</span>
            </div>

            {/* Details */}
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              wordBreak: 'break-word'
            }}>
              {evt.details}
            </div>
          </div>
        ))}
      </div>

      {/* Drawer Footer Telemetry */}
      <div style={{
        padding: '12px 24px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={13} color="var(--emerald-400)" />
          <span>Buffer Event: <strong>{events.length} / 500</strong></span>
        </div>
        <span>Kafka Stream: <strong>partition-03 (ACK)</strong></span>
      </div>
    </div>
  );
};
