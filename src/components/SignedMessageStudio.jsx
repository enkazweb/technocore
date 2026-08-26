import React, { useState, useEffect } from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Code, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  ExternalLink,
  Lock,
  Play
} from 'lucide-react';
import { signTechnocoreMessage, verifySignature, sanitizeTechnocoreText } from '../crypto/technocoreDid';

export default function SignedMessageStudio({ activeIdentity }) {
  const [room, setRoom] = useState('lobby');
  const [nonce, setNonce] = useState(Date.now().toString());
  const [text, setText] = useState('Merhaba Technocore! Bu imza tarayıcı üzerinden türetilmiştir.');
  const [signedResult, setSignedResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [serverResponse, setServerResponse] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Verifier state
  const [verifyDid, setVerifyDid] = useState('');
  const [verifySig, setVerifySig] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    if (activeIdentity) {
      handleSign();
    }
  }, [activeIdentity, room, nonce, text]);

  const handleSign = async () => {
    if (!activeIdentity) return;
    try {
      const res = await signTechnocoreMessage({
        privateKeyHex: activeIdentity.privateKeyHex,
        room,
        nonce,
        text
      });
      setSignedResult(res);
    } catch (err) {
      console.error('Signing error:', err);
    }
  };

  const handleRefreshNonce = () => {
    setNonce(Date.now().toString());
  };

  const copyToClipboard = (val, fieldName) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const sendLiveSignedMessage = async (method = 'POST') => {
    if (!signedResult) return;
    setSending(true);
    setServerResponse(null);
    try {
      let response;
      if (method === 'POST') {
        try {
          response = await fetch(`https://technocore.chat/r/${room.trim()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(signedResult.postBody)
          });
        } catch (postErr) {
          console.warn('POST failed due to CORS/Preflight, falling back to GET say-signed:', postErr);
          response = await fetch(signedResult.getSaySignedUrl);
        }
      } else {
        response = await fetch(signedResult.getSaySignedUrl);
      }

      const status = response.status;
      const responseText = await response.text();

      setServerResponse({
        success: response.ok,
        status,
        body: responseText
      });
    } catch (err) {
      setServerResponse({
        success: false,
        status: 'Error',
        body: `Ağ hatası veya CORS kısıtlaması: ${err.message}`
      });
    } finally {
      setSending(false);
    }
  };

  const handleOfflineVerify = async () => {
    if (!verifyDid || !verifySig || !verifyMessage) {
      setVerifyResult({ valid: false, error: 'Lütfen DID, İmza ve İmzalanan metni doldurun.' });
      return;
    }
    const isValid = await verifySignature(verifyDid.trim(), verifySig.trim(), verifyMessage);
    setVerifyResult({ valid: isValid });
  };

  if (!activeIdentity) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Aktif Kimlik Bulunamadı</h3>
        <p className="text-sm text-slate-400">
          İmza oluşturmak için lütfen önce bir kimlik seçin veya yeni bir kimlik türetin.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel-glow p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-slate-100">Technocore İmza Studio (Signed Message Generator)</h2>
            </div>
            <p className="text-sm text-slate-300">
              Technocore protokolünde imzalar Ed25519 algoritması ile strictly swept <code className="text-cyan-300 font-mono">&lt;room&gt;|&lt;nonce&gt;|&lt;text&gt;</code> string'i üzerinden üretilir ve 86 karakterlik unpadded base64url olarak gönderilir.
            </p>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Input Controls */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>İmza Parametreleri</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Oda Adı (Room Name)</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="lobby, meta, mb-p-..., d-..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Nonce (Tekil Sayaç / Zaman Damgası)</label>
              <button
                onClick={handleRefreshNonce}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Yenile (Date.now)</span>
              </button>
            </div>
            <input
              type="text"
              value={nonce}
              onChange={(e) => setNonce(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">Nonce, aynı key'in o odada kullandığı en son nonce'tan büyük olmalıdır.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mesaj Metni (Text)</label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Gönderilecek mesaj..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Test Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => sendLiveSignedMessage('POST')}
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
              <span>POST ile Sunucuya Gönder</span>
            </button>

            <button
              onClick={() => sendLiveSignedMessage('GET')}
              disabled={sending}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1 transition"
            >
              <span>GET say-signed</span>
            </button>
          </div>

        </div>

        {/* Right Output & Signature Inspector */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Kriptografik İmza Çıktısı</span>
          </h3>

          {signedResult ? (
            <div className="space-y-3 text-xs">
              
              {/* String to Sign */}
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>İmzalanan Raw Payload String:</span>
                  <button onClick={() => copyToClipboard(signedResult.payloadSigned, 'payload')} className="text-cyan-400">
                    {copiedField === 'payload' ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300 select-all break-all">
                  {signedResult.payloadSigned}
                </div>
              </div>

              {/* Signature Base64URL */}
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Ed25519 Signature (86 Karakter Base64URL):</span>
                  <button onClick={() => copyToClipboard(signedResult.sig, 'sig')} className="text-cyan-400">
                    {copiedField === 'sig' ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-900/60 font-mono text-purple-300 select-all break-all">
                  {signedResult.sig}
                </div>
              </div>

              {/* GET URL Preview */}
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Generated GET URL:</span>
                  <button onClick={() => copyToClipboard(signedResult.getSaySignedUrl, 'url')} className="text-cyan-400">
                    {copiedField === 'url' ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 select-all break-all">
                  {signedResult.getSaySignedUrl}
                </div>
              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-500">İmza hesaplanıyor...</p>
          )}

          {/* Live Server Response Box */}
          {serverResponse && (
            <div className={`mt-4 p-4 rounded-xl border text-xs space-y-1 ${
              serverResponse.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {serverResponse.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>Sunucu Yanıtı</span>
                </span>
                <span className="font-mono">HTTP {serverResponse.status}</span>
              </div>
              <div className="font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 max-h-28 overflow-y-auto whitespace-pre-wrap select-all">
                {serverResponse.body}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Offline Signature Verifier Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <span>Offline İmza Doğrulayıcı (Signature Verifier)</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="DID (did:key:z6Mk...)"
            value={verifyDid}
            onChange={(e) => setVerifyDid(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
          />
          <input
            type="text"
            placeholder="Signature (86 chars)"
            value={verifySig}
            onChange={(e) => setVerifySig(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400"
          />
          <input
            type="text"
            placeholder="Signed Payload (room|nonce|text)"
            value={verifyMessage}
            onChange={(e) => setVerifyMessage(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleOfflineVerify}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition"
          >
            İmzayı Doğrula
          </button>

          {verifyResult && (
            <div className={`flex items-center gap-2 text-xs font-bold ${verifyResult.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
              {verifyResult.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{verifyResult.valid ? 'İmza GEÇERLİ! (Verified)' : 'İmza GEÇERSİZ!'}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
