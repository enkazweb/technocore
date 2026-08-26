import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  MessageSquare, 
  Send, 
  Lock, 
  Unlock, 
  Globe, 
  Radio, 
  Zap, 
  BookOpen,
  PlusCircle,
  Copy,
  Check,
  Twitter
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeIdentity, vaultLocked, setVaultLocked, serverOnline }) {
  const [copiedDid, setCopiedDid] = useState(false);

  const copyDid = () => {
    if (activeIdentity?.did) {
      navigator.clipboard.writeText(activeIdentity.did);
      setCopiedDid(true);
      setTimeout(() => setCopiedDid(false), 2000);
    }
  };

  const navItems = [
    { id: 'identity', label: 'Kimlik / Vault', icon: Key },
    { id: 'publisher', label: 'DID Note (Profil)', icon: Globe },
    { id: 'signing', label: 'İmza Studio', icon: Send },
    { id: 'chat', label: 'Canlı Chat & Mailbox', icon: MessageSquare },
    { id: 'ownership', label: 'Oda Sahipliği (d-)', icon: ShieldCheck },
    { id: 'docs', label: 'Protokol / API', icon: BookOpen }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-950/60 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand + Designer Credit */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('identity')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400 bg-clip-text text-transparent">
                  TECHNOCORE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 uppercase tracking-widest">
                  DID Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Architected & Designed by{' '}
                <a 
                  href="https://x.com/0xenkazweb" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-cyan-400 font-semibold hover:underline inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  @0xenkazweb
                </a>
              </p>
            </div>
          </div>

          {/* Designer Twitter Badge */}
          <a
            href="https://x.com/0xenkazweb"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 hover:border-cyan-400 transition shadow-sm shadow-cyan-500/10 group"
          >
            <Twitter className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Designed by <strong className="text-cyan-200">@0xenkazweb</strong></span>
          </a>

          {/* Active Identity Pill */}
          {activeIdentity ? (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium text-slate-300">{activeIdentity.name}:</span>
              <span className="font-mono text-cyan-400 max-w-[130px] truncate">{activeIdentity.did}</span>
              <button 
                onClick={copyDid}
                title="DID Kopyala" 
                className="ml-1 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('identity')}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs hover:bg-cyan-900/40 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Yeni Kimlik Oluştur</span>
            </button>
          )}

          {/* Status & Vault Lock */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px]">
              <Radio className={`w-3.5 h-3.5 ${serverOnline ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className="text-slate-300 font-mono hidden sm:inline">technocore.chat</span>
              <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </div>

            {vaultLocked ? (
              <button 
                onClick={() => setVaultLocked(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500/20 transition-all shadow-sm shadow-amber-500/10"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vault Kilitli</span>
              </button>
            ) : (
              <button 
                onClick={() => setVaultLocked(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-500/20 transition-all shadow-sm shadow-emerald-500/10"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Vault Açık</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/40 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
