import React, { useState } from 'react';
import { 
  Key, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Download, 
  Upload, 
  FileText, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { createNewIdentity, createIdentityFromPrivateKey } from '../crypto/technocoreDid';
import confetti from 'canvas-confetti';

export default function IdentityGenerator({ onIdentityCreated, identities }) {
  const [mode, setMode] = useState('create'); // 'create', 'mnemonic', 'hex', 'file'
  const [name, setName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [privateKeyHex, setPrivateKeyHex] = useState('');
  const [password, setPassword] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);

  // Generate a random 12-word seed immediately on mount or refresh
  const generateNewSeed = async () => {
    try {
      setLoading(true);
      setError(null);
      const identity = await createNewIdentity(name || 'Technocore Agent');
      setMnemonic(identity.mnemonic);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (mode === 'create' && !mnemonic) {
      generateNewSeed();
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let identity;
      const identityName = name.trim() || `Agent-${Math.floor(1000 + Math.random() * 9000)}`;

      if (mode === 'create' || mode === 'mnemonic') {
        if (!mnemonic.trim()) throw new Error('Lütfen 12 kelimelik seed cümlesini girin.');
        identity = await createNewIdentity(identityName, mnemonic);
      } else if (mode === 'hex') {
        if (!privateKeyHex.trim()) throw new Error('Lütfen 32-byte (64 hex karakter) özel anahtarı girin.');
        identity = await createIdentityFromPrivateKey(privateKeyHex.trim(), identityName);
      }

      if (identity) {
        onIdentityCreated(identity, password);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setError(err.message || 'Kimlik oluşturulurken hata meydana geldi.');
    } finally {
      setLoading(false);
    }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (json.mnemonic) {
        setMnemonic(json.mnemonic);
        setMode('mnemonic');
        if (json.name) setName(json.name);
      } else if (json.privateKeyHex) {
        setPrivateKeyHex(json.privateKeyHex);
        setMode('hex');
        if (json.name) setName(json.name);
      } else {
        throw new Error('Geçersiz identity.json dosyası.');
      }
    } catch (err) {
      setError('Yüklenen dosya okunamadı veya formatı geçersiz.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner Header */}
      <div className="glass-panel-glow p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-slate-100 tracking-wide">
                Technocore Ed25519 DID Generator
              </h2>
            </div>
            <p className="text-sm text-slate-300">
              Terminal komutlarına ihtiyaç duymadan, %100 tarayıcı üzerinde kriptografik agent identity üreterek <code className="text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded">did:key:z6Mk...</code> formatında DID adresi elde edin.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('create')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                mode === 'create' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yeni Üret
            </button>
            <button
              onClick={() => setMode('mnemonic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                mode === 'mnemonic' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Seed/Mnemonic
            </button>
            <button
              onClick={() => setMode('hex')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                mode === 'hex' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Private Key
            </button>
          </div>
        </div>
      </div>

      {/* Main Generator Box */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6">
        
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Hata</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Agent Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Agent / Kimlik İsmi
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Nexus-AI-Bot, Flop-Agent-01"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
          />
        </div>

        {/* Mode 1: Create New */}
        {mode === 'create' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Rastgele Türetilen Mnemonic (12 Kelime Seed Cümlesi)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateNewSeed}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Yenisini Üret</span>
                </button>
                <button
                  type="button"
                  onClick={copyMnemonic}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition ml-2"
                >
                  {copiedMnemonic ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMnemonic ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
            </div>

            {/* Mnemonic Display Box */}
            <div className="relative p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm tracking-wide leading-relaxed">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {mnemonic.split(' ').map((word, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-600 text-xs select-none">{idx + 1}.</span>
                    <span className="text-cyan-300 font-semibold">{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-amber-400/90 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Bu 12 kelime private key'inizi türetir. Lütfen güvenli bir yere kopyalayıp saklayın!</span>
            </p>
          </div>
        )}

        {/* Mode 2: Import Mnemonic */}
        {mode === 'mnemonic' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              12 Kelimelik Seed Cümlesi (Boşluklarla Ayrılmış)
            </label>
            <textarea
              rows={3}
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="word1 word2 word3 word4 ..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/70 text-cyan-300 font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
          </div>
        )}

        {/* Mode 3: Import Hex */}
        {mode === 'hex' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Ed25519 Private Key Hex (64 Karakter)
            </label>
            <input
              type="text"
              value={privateKeyHex}
              onChange={(e) => setPrivateKeyHex(e.target.value)}
              placeholder="e.g. 4d6a7f8b9c..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/70 text-cyan-300 font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
          </div>
        )}

        {/* Optional Vault Master Password */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>İsteğe Bağlı Vault Parolası (Yerel Şifreleme)</span>
            </label>
            <span className="text-[11px] text-slate-500">Parola girilirse private key AES-GCM ile şifrelenir</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parola belirleyin (opsiyonel)"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <label className="cursor-pointer text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 py-2">
            <Upload className="w-4 h-4" />
            <span>Yedek Dosyası Yükle (.json)</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Hesaplanıyor...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Kimliği Oluştur ve Vault'a Kaydet</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
