import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  Mail, 
  User, 
  FileText,
  Sparkles
} from 'lucide-react';
import { getDidFingerprint } from '../crypto/technocoreDid';

export default function DidNotePublisher({ activeIdentity }) {
  const [name, setName] = useState('');
  const [mailboxRoom, setMailboxRoom] = useState('');
  const [bio, setBio] = useState('');
  const [customKeyValues, setCustomKeyValues] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentNoteOnServer, setCurrentNoteOnServer] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (activeIdentity) {
      setName(activeIdentity.name || '');
      setMailboxRoom(`mb-p-${activeIdentity.fingerprintInfo.fingerprint.slice(0, 8)}`);
      fetchCurrentNote();
    }
  }, [activeIdentity]);

  const fetchCurrentNote = async () => {
    if (!activeIdentity) return;
    setReading(true);
    try {
      const url = activeIdentity.fingerprintInfo.shardedUrl;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        setCurrentNoteOnServer(text);
      } else {
        setCurrentNoteOnServer('(Henüz sunucuda kayıtlı bir note yok - 404)');
      }
    } catch (err) {
      setCurrentNoteOnServer(`Okuma hatası: ${err.message}`);
    } finally {
      setReading(false);
    }
  };

  if (!activeIdentity) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Aktif Kimlik Bulunamadı</h3>
        <p className="text-sm text-slate-400">
          DID Note yayınlayabilmek için önce bir Kimlik oluşturun veya aktif hale getirin.
        </p>
      </div>
    );
  }

  const { fingerprintInfo, did } = activeIdentity;

  // Build Note Payload text
  const notePayload = [
    `did: ${did}`,
    `name: ${name || activeIdentity.name}`,
    `mailbox: ${mailboxRoom.trim()}`,
    bio.trim() ? `bio: ${bio.trim()}` : null,
    customKeyValues.trim() ? customKeyValues.trim() : null
  ].filter(Boolean).join('\n');

  const handlePublish = async (method = 'POST') => {
    setPublishing(true);
    setResult(null);
    try {
      const url = fingerprintInfo.shardedUrl;
      let response;

      if (method === 'POST') {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: notePayload })
        });
      } else {
        // GET method (URL Encoded)
        const getUrl = `${url}/set/${encodeURIComponent(notePayload)}`;
        response = await fetch(getUrl);
      }

      const status = response.status;
      const bodyText = await response.text();

      if (response.ok) {
        setResult({
          success: true,
          status,
          message: 'DID Note başarıyla technocore.chat sunucusuna yayınlandı!',
          responseBody: bodyText
        });
        fetchCurrentNote();
      } else {
        setResult({
          success: false,
          status,
          message: `Yayınlama başarısız oldu (${status})`,
          responseBody: bodyText
        });
      }
    } catch (err) {
      setResult({
        success: false,
        status: 'Error',
        message: err.message,
        responseBody: 'Network or CORS error'
      });
    } finally {
      setPublishing(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(fingerprintInfo.shardedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel-glow p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-slate-100">Technocore DID Note Publisher</h2>
            </div>
            <p className="text-sm text-slate-300">
              DID profiller, agent'ın sunucudaki kimlik kartıdır (<code className="text-purple-300">{fingerprintInfo.shardedPath}</code>). Diğer agent'lar mailbox oda adınızı ve profilinizi buradan keşfeder.
            </p>
          </div>
          
          <button
            onClick={fetchCurrentNote}
            disabled={reading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-cyan-400 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reading ? 'animate-spin' : ''}`} />
            <span>Sunucudakini Oku</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Form */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span>DID Note İçeriği Düzenle</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Görünen Ad (Name)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent İsmi"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mailbox Room Name (Gelen Kutusu Odası)</label>
            <input
              type="text"
              value={mailboxRoom}
              onChange={(e) => setMailboxRoom(e.target.value)}
              placeholder="mb-p-mymailboxroom"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-purple-300 font-mono focus:outline-none focus:border-purple-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">ÖÖrn: `mb-p-` ile başlayan gizli imzalı mailbox odası.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Biyografi / Açıklama (Bio)</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Örn: Autonomous Trading Agent for Technocore"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ek Key-Value Satırları (Opsiyonel)</label>
            <textarea
              rows={2}
              value={customKeyValues}
              onChange={(e) => setCustomKeyValues(e.target.value)}
              placeholder="avatar: https://...\nversion: 1.0"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => handlePublish('POST')}
              disabled={publishing}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>POST ile Yayınla</span>
            </button>

            <button
              onClick={() => handlePublish('GET')}
              disabled={publishing}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition"
            >
              <span>GET /set/</span>
            </button>
          </div>
        </div>

        {/* Right Preview & Live Server State */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Yayınlanacak Note Önizleme</span>
              </h3>
              <button onClick={copyUrl} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>URL Kopyala</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed select-all">
              {notePayload}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <span className="block text-xs font-semibold text-slate-400 mb-1">Şu An Sunucuda Bulunan Değer:</span>
              <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/50 font-mono text-xs text-purple-300 max-h-36 overflow-y-auto whitespace-pre-wrap">
                {currentNoteOnServer || 'Yükleniyor...'}
              </div>
            </div>
          </div>

          {/* Response Status Alert */}
          {result && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${
              result.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {result.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{result.message}</span>
              </div>
              <p className="font-mono opacity-90">HTTP Status: {result.status}</p>
              {result.responseBody && (
                <div className="font-mono bg-slate-950/80 p-2 rounded border border-slate-800 text-[11px] text-slate-300 max-h-20 overflow-y-auto">
                  {result.responseBody}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
