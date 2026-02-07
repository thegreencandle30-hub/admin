'use client';

import { Badge } from '@/components/atoms';
import type { Call, TargetPrice } from '@/services/call-service';

interface TargetsModalProps {
  open: boolean;
  call: Call | null;
  onClose: () => void;
  onUpdateTarget?: (targetId: string, isAcheived: boolean) => void;
}

export default function TargetsModal({ open, call, onClose, onUpdateTarget }: TargetsModalProps) {
  if (!open || !call) return null;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const targets: TargetPrice[] = call.targetPrices && call.targetPrices.length > 0 
    ? [...call.targetPrices].sort((a, b) => a.order - b.order)
    : [{ label: 'Target', price: call.target || 0, order: 0, isAcheived: false }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] sm:max-h-[600px] bg-card border border-border/60 rounded-4xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        <div className="p-5 sm:p-8 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-start mb-6 sm:mb-8 shrink-0">
            <div className="space-y-1 min-w-0 flex-1">
              <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1 sm:mb-2 truncate">
                {call.commodity === 'Custom' ? call.customCommodity : call.commodity}
              </h3>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Badge variant={call.type === 'buy' ? 'success' : 'danger'} className="text-[9px] sm:text-[10px] py-0.5 px-1.5 sm:px-2 shrink-0">
                  {call.type.toUpperCase()}
                </Badge>
                <span className="text-[10px] sm:text-xs font-bold text-muted-foreground/80 truncate">Entry: {formatPrice(call.entryPrice)}</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="ml-4 p-2 sm:p-2.5 hover:bg-muted rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-border group shrink-0"
            >
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1 shrink-0">Target Prices</p>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {targets.map((t, i) => (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border transition-all ${
                    t.isAcheived 
                      ? 'bg-success/5 border-success/40 ring-1 ring-success/10' 
                      : 'bg-muted/20 border-border/60'
                  }`}
                >
                  {/* Status Icon */}
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
                    t.isAcheived 
                      ? 'bg-success text-white shadow-lg shadow-success/20 scale-105' 
                      : 'bg-card border border-border text-muted-foreground'
                  }`}>
                    {t.isAcheived ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-[10px] sm:text-xs font-bold opacity-60">T{i + 1}</span>
                    )}
                  </div>

                  {/* Target Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                      <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 opacity-70 truncate">
                        {t.label}
                      </span>
                      <span className="text-base sm:text-xl font-black text-success tabular-nums leading-none truncate">
                        {formatPrice(t.price)}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Section */}
                  <div className="flex flex-col items-end justify-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                    {t.isAcheived && (
                      <span className="text-[8px] sm:text-[9px] text-success font-black uppercase tracking-tighter leading-none mb-0.5">
                        Achieved
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        t._id && onUpdateTarget?.(t._id, !t.isAcheived);
                      }}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-all duration-300 focus:outline-none ${
                        t.isAcheived 
                          ? 'bg-success border-success' 
                          : 'bg-muted-foreground/10 border-border'
                      }`}
                      title={t.isAcheived ? "Mark as not achieved" : "Mark as achieved"}
                    >
                      <span
                        className={`pointer-events-none block h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-300 ${
                          t.isAcheived ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 shrink-0">
            {/* ... */}
          </div>
        </div>
      </div>
    </div>
  );
}
