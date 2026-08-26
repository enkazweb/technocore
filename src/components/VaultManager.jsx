import React, { useState } from 'react';
import { 
  FolderKey, 
  Lock, 
  Unlock, 
  Key, 
  PlusCircle, 
  Download, 
  Trash2, 
  Check, 
  ShieldAlert, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import IdentityCard from './IdentityCard';

export default function VaultManager({ 
  identities, 
  activeIdentity, 
  onSelectIdentity, 
  onDeleteIdentity, 
  vaultLocked, 
  setVaultLocked,
  onUnlockVault,
  onLockVault,
  onNewIdentityClick
}) {
  const [unlockPass, setUnlockPass] = useState('');
  const [unlockError, setUnlockError] = useState(null);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError(null);
    try {
      await onUnlockVault(unlockPass);
      setUnlockPass('');
    } catch (err) {
      setUnlockError('Yanlış vault parolası!');
    }
  };

  const exportEntireVault = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(identities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `technocore-vault-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (vaultLocked) {
    return (
      <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-2xl border border-amber-500/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Technocore Vault Kilitli</h3>
        <p className="text-xs text-slate-400">
          Kayıtlı kimliklerinize ve özel anahtarlarınıza erişmek için belirlediğiniz Vault parolasını girin.
        </p>

        {unlockError && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {unlockError}
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-3">
          <input
            type="password"
            value={unlockPass}
            onChange={(e) => setUnlockPass(e.target.value)}
            placeholder="Vault Parolası"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Vault Kilidini Aç</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <FolderKey className="w-5 h-5 text-cyan-400" />
            <span>Kayıtlı Technocore Kimlikleri ({identities.length})</span>
          </h2>
          <p className="text-xs text-slate-400">Tarayıcı local storage üzerinde AES-GCM ile saklanır</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewIdentityClick}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Yeni Kimlik Ekle</span>
          </button>

          {identities.length > 0 && (
            <button
              onClick={exportEntireVault}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Tüm Vault'u İndir</span>
            </button>
          )}

          <button
            onClick={onLockVault}
            className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition"
            title="Vault'u Kilitle"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Identities Cards Grid */}
      {identities.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-4 border border-slate-800">
          <Key className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">Henüz Kayıtlı Kimlik Yok</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Terminal kullanmadan ilk Technocore DID kimliğinizi saniyeler içinde oluşturmak için "Yeni Kimlik Ekle" butonuna tıklayın.
          </p>
          <button
            onClick={onNewIdentityClick}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Şimdi Kimlik Oluştur</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {identities.map((id) => (
            <IdentityCard
              key={id.id}
              identity={id}
              isActive={activeIdentity?.id === id.id}
              onSelect={onSelectIdentity}
              onDelete={onDeleteIdentity}
            />
          ))}
        </div>
      )}

    </div>
  );
}
