import React, { useState } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  QrCode, 
  Download, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  FileCode,
  Trash2,
  Lock,
  Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { exportToPem } from '../crypto/technocoreDid';

export default function IdentityCard({ identity, onDelete, onSelect, isActive }) {
  const [showQr, setShowQr] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!identity) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadJsonBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(identity, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${identity.name || 'technocore-identity'}-${identity.fingerprintInfo.fingerprint}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadPemBackup = () => {
    const pemStr = exportToPem(identity);
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(pemStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${identity.name || 'technocore-identity'}-${identity.fingerprintInfo.fingerprint}.pem`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const { did, fingerprintInfo, publicKeyHex, privateKeyHex, mnemonic, name, createdAt } = identity;

  return (
    <div className={`glass-panel p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
      isActive ? 'border-cyan-400/80 shadow-lg shadow-cyan-500/10' : 'border-slate-800 hover:border-slate-700'
    }`}>
      
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none" />

      {/* Card Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-100">{name || 'Technocore Agent'}</h3>
              {isActive && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/30">
                  Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Oluşturuldu: {new Date(createdAt).toLocaleString('tr-TR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isActive && onSelect && (
            <button
              onClick={() => onSelect(identity)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 transition"
            >
              Aktif Yap
            </button>
          )}

          <button
            onClick={() => setShowQr(!showQr)}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${
              showQr ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="QR Kod Göster"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={downloadJsonBackup}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 transition"
            title="JSON İndir"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={downloadPemBackup}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 transition"
            title="PEM İndir"
          >
            <FileCode className="w-4 h-4" />
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(identity.id)}
              className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-400 hover:bg-rose-900/60 transition"
              title="Kimliği Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* QR Code Modal Box */}
      {showQr && (
        <div className="my-4 p-4 rounded-xl bg-slate-950 border border-cyan-900/60 flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-white rounded-xl shadow-lg">
            <QRCodeSVG value={did} size={160} />
          </div>
          <span className="font-mono text-[11px] text-cyan-400 max-w-full truncate px-4">
            {did}
          </span>
        </div>
      )}

      {/* Main Identity Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 text-xs">
        
        {/* W3C DID String */}
        <div className="col-span-1 md:col-span-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Decentralized Identifier (DID)</span>
            <button
              onClick={() => copyToClipboard(did, 'did')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              {copiedField === 'did' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'did' ? 'Kopyalandı' : 'Kopyala'}</span>
            </button>
          </div>
          <div className="font-mono text-cyan-300 font-semibold break-all text-sm select-all">
            {did}
          </div>
        </div>

        {/* DID Fingerprint & Path */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">DID Note Sharded Path</span>
            <a
              href={fingerprintInfo.shardedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Aç</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="font-mono text-purple-300 break-all select-all font-medium">
            {fingerprintInfo.shardedPath}
          </div>
          <p className="text-[10px] text-slate-500">Fingerprint: {fingerprintInfo.fingerprint}</p>
        </div>

        {/* Public Key Hex */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Ed25519 Public Key (32 Byte Hex)</span>
            <button
              onClick={() => copyToClipboard(publicKeyHex, 'pubkey')}
              className="text-slate-400 hover:text-slate-200"
            >
              {copiedField === 'pubkey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="font-mono text-slate-300 break-all select-all">
            {publicKeyHex}
          </div>
        </div>

      </div>

      {/* Secret Keys Reveal Section */}
      <div className="pt-3 border-t border-slate-800/80">
        <button
          onClick={() => setShowSecrets(!showSecrets)}
          className="flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
        >
          {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showSecrets ? 'Özel Anahtarları Gizle' : 'Private Key & Seed Cümlesini Göster'}</span>
        </button>

        {showSecrets && (
          <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                <span className="font-semibold text-amber-400">Private Key Hex</span>
                <button
                  onClick={() => copyToClipboard(privateKeyHex, 'privkey')}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {copiedField === 'privkey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Kopyala</span>
                </button>
              </div>
              <div className="font-mono text-amber-300 text-xs break-all bg-slate-900 p-2.5 rounded border border-slate-800 select-all">
                {privateKeyHex}
              </div>
            </div>

            {mnemonic && (
              <div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span className="font-semibold text-amber-400">12 Kelimelik Seed Phrase</span>
                  <button
                    onClick={() => copyToClipboard(mnemonic, 'mnemonic')}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    {copiedField === 'mnemonic' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Kopyala</span>
                  </button>
                </div>
                <div className="font-mono text-amber-200 text-xs bg-slate-900 p-2.5 rounded border border-slate-800 select-all leading-relaxed">
                  {mnemonic}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
