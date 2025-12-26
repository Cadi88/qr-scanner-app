'use client';

import { Scanner } from '@yudiel/react-qr-scanner';
import { useState, useRef } from 'react';
import { X, Check, Loader2, RefreshCcw } from 'lucide-react';

export default function ScanPage() {
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message: string;
        ticket?: { attendee: string; event: string };
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [paused, setPaused] = useState(false);

    // Handle scan
    const handleScan = async (detectedCodes: any[]) => {
        // @yudiel/react-qr-scanner returns array of IDetectedBarcode
        if (paused || loading || detectedCodes.length === 0) return;

        const rawValue = detectedCodes[0].rawValue;
        if (!rawValue || rawValue === lastScan) return;

        setLastScan(rawValue);
        setPaused(true); // Stop scanning efficiently
        setLoading(true);

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: rawValue }),
            });

            const data = await res.json();
            setScanResult(data);

            // Provide sound feedback (optional) or just visual

        } catch (err) {
            setScanResult({ success: false, message: 'Network Error' });
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setLastScan(null);
        setScanResult(null);
        setPaused(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <header className="p-4 bg-slate-900 flex justify-between items-center z-10 sticky top-0">
                <h1 className="font-bold text-lg">Staff Scanner</h1>
                <div className={`px-2 py-1 rounded text-xs font-mono ${paused ? 'bg-amber-900/50 text-amber-500' : 'bg-green-900/50 text-green-500'}`}>
                    {paused ? 'PAUSED' : 'LIVE'}
                </div>
            </header>

            <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
                {!scanResult ? (
                    <div className="w-full max-w-md aspect-square relative border-2 border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                        {!paused && (
                            <Scanner
                                onScan={handleScan}
                                allowMultiple={true}
                                scanDelay={500}
                            />
                        )}
                        {paused && !scanResult && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
                            </div>
                        )}
                        <p className="absolute bottom-4 left-0 w-full text-center text-xs text-slate-500 z-10 pointer-events-none">
                            Align QR code within frame
                        </p>
                    </div>
                ) : (
                    <div className={`w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-300`}>
                        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 
                 ${scanResult.success ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}
              `}>
                            {scanResult.success ? <Check size={64} strokeWidth={4} /> : <X size={64} strokeWidth={4} />}
                        </div>

                        <h2 className={`text-4xl font-black mb-2 uppercase tracking-tighter
                 ${scanResult.success ? 'text-emerald-400' : 'text-red-500'}
              `}>
                            {scanResult.success ? 'ALLOWED' : 'DENIED'}
                        </h2>

                        <p className="text-xl font-medium text-slate-300 mb-6">{scanResult.message}</p>

                        {scanResult.ticket && (
                            <div className="bg-slate-900 rounded-xl p-4 mb-8 text-left border border-slate-800">
                                <div className="mb-2">
                                    <span className="text-xs text-slate-500 uppercase">Attendee</span>
                                    <div className="font-bold text-lg">{scanResult.ticket.attendee}</div>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500 uppercase">Event</span>
                                    <div className="text-slate-300">{scanResult.ticket.event}</div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={resetScanner}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            <RefreshCcw size={20} />
                            Scan Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
