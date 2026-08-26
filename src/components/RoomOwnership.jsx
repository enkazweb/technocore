import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Users, 
  ExternalLink, 
  RefreshCw 
} from 'lucide-react';
import { signRoomOwnershipClaim, signTechnocoreMessage, sendTechnocoreWrite } from '../crypto/technocoreDid';

export default function RoomOwnership({ activeIdentity }) {
  const [roomName, setRoomName] = useState('d-myroom');
  const [claimNonce, setClaimNonce] = useState(Date.now().toString());
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState(null);

  // Allow list management
  const [allowDids, setAllowDids] = useState('');
  const [allowNonce, setAllowNonce] = useState((Date.now() + 1000).toString());
  const [updatingAllow, setUpdatingAllow] = useState(false);
  const [allowResult, setAllowResult] = useState(null);

  if (!activeIdentity) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Aktif Kimlik Bulunamadı</h3>
        <p className="text-sm text-slate-400">
          Oda sahipliği talep etmek için lütfen önce bir kimlik seçin.
        </p>
      </div>
    );
  }

  const handleClaimRoom = async (e) => {
    e.preventDefault();
    setClaiming(true);
    setClaimResult(null);
    try {
      let name = roomName.trim();
      if (!name.startsWith('d-')) name = `d-${name}`;

      const claimObj = await signRoomOwnershipClaim({
        privateKeyHex: activeIdentity.privateKeyHex,
        roomName: name,
        claimNonce
      });

      const res = await sendTechnocoreWrite(claimObj.claimUrl);
      const status = res.status || 200;
      const text = await res.text();

      setClaimResult({
        success: true,
        status,
        message: `${name} oda sahipliği talebi Technocore sunucusuna ulaştırıldı!`,
        body: text,
        claimObj
      });
    } catch (err) {
      setClaimResult({
        success: false,
        status: 'Error',
        message: err.message,
        body: 'Ağ hatası'
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleUpdateAllowList = async (e) => {
    e.preventDefault();
    setUpdatingAllow(true);
    setAllowResult(null);
    try {
      let name = roomName.trim();
      if (!name.startsWith('d-')) name = `d-${name}`;

      const value = allowDids.trim();
      const currentNonce = allowNonce ? String(allowNonce) : String(Date.now());

      const payloadToSign = `room-allow|${name}|${currentNonce}|${value}`;
      
      const signedObj = await signTechnocoreMessage({
        privateKeyHex: activeIdentity.privateKeyHex,
        room: `room-allow`,
        nonce: currentNonce,
        text: payloadToSign
      });

      const encodedValue = encodeURIComponent(value);
      const allowUrl = `https://technocore.chat/kv/room-allow/${name}/set-signed/${activeIdentity.did}/${signedObj.sig}/${currentNonce}/${encodedValue}`;

      const res = await sendTechnocoreWrite(allowUrl);
      const status = res.status || 200;
      const text = await res.text();

      setAllowResult({
        success: true,
        status,
        message: 'Allow-list güncellemesi Technocore sunucusuna ulaştırıldı!',
        body: text
      });
    } catch (err) {
      setAllowResult({
        success: false,
        status: 'Error',
        message: err.message
      });
    } finally {
      setUpdatingAllow(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel-glow p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-slate-100">Technocore Sahipli Odalar (d- Rooms & Allow-Lists)</h2>
        </div>
        <p className="text-sm text-slate-300">
          Technocore protokolünde sadece <code className="text-cyan-300">d-</code> prefix'li odalar (ownable rooms) bir DID key tarafından sahiplenilebilir. Sahibi siz olduğunuzda sadece sizin DID'iniz veya allow-list'e eklediğiniz DID'ler o odaya yazabilir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Claim Room Box */}
        <form onSubmit={handleClaimRoom} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>1. Oda Sahipliği Talep Et (Claim Ownership)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Oda Adı (d- Prefix Zorunlu)</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="d-myroom"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Claim Nonce</label>
            <input
              type="text"
              value={claimNonce}
              onChange={(e) => setClaimNonce(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={claiming}
            className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {claiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Oda Sahipliğini İmzala ve Talep Et</span>
          </button>

          {claimResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${
              claimResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {claimResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{claimResult.message}</span>
              </div>
              <div className="font-mono bg-slate-950 p-2 rounded text-[11px] text-slate-300">
                {claimResult.body}
              </div>
            </div>
          )}
        </form>

        {/* Allow-List Management Box */}
        <form onSubmit={handleUpdateAllowList} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>2. İzinli DID'ler Listesi (Allow-List)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">İzin Verilecek DID'ler (Boşlukla Ayrılmış)</label>
            <textarea
              rows={3}
              value={allowDids}
              onChange={(e) => setAllowDids(e.target.value)}
              placeholder="did:key:z6Mk... did:key:z6Mk..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-purple-300 focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Greater Nonce (Claim Nonce'tan Büyük Olmalı)</label>
            <input
              type="text"
              value={allowNonce}
              onChange={(e) => setAllowNonce(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-mono text-slate-200 focus:outline-none focus:border-purple-400"
            />
          </div>

          <button
            type="submit"
            disabled={updatingAllow}
            className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {updatingAllow ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            <span>Allow-List Güncellemesini Gönder</span>
          </button>

          {allowResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 ${
              allowResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {allowResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{allowResult.message}</span>
              </div>
              <div className="font-mono bg-slate-950 p-2 rounded text-[11px] text-slate-300">
                {allowResult.body}
              </div>
            </div>
          )}
        </form>

      </div>

    </div>
  );
}
