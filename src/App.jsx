import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import IdentityGenerator from './components/IdentityGenerator';
import VaultManager from './components/VaultManager';
import DidNotePublisher from './components/DidNotePublisher';
import SignedMessageStudio from './components/SignedMessageStudio';
import LiveChatClient from './components/LiveChatClient';
import RoomOwnership from './components/RoomOwnership';
import ProtocolInspector from './components/ProtocolInspector';
import { encryptVault, decryptVault } from './crypto/technocoreDid';
import { Twitter, Sparkles, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('identity');
  const [identities, setIdentities] = useState([]);
  const [activeIdentity, setActiveIdentity] = useState(null);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [encryptedVaultData, setEncryptedVaultData] = useState(null);
  const [serverOnline, setServerOnline] = useState(true);

  // Load identities from localStorage on initial load
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('technocore_identities');
      const savedVault = localStorage.getItem('technocore_encrypted_vault');

      if (savedVault) {
        setEncryptedVaultData(JSON.parse(savedVault));
        setVaultLocked(true);
      } else if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        setIdentities(parsed);
        if (parsed.length > 0) {
          setActiveIdentity(parsed[0]);
        }
      }
    } catch (err) {
      console.error('Error loading stored identities:', err);
    }
    checkServerHealth();
  }, []);

  const saveIdentities = (newIdentities) => {
    setIdentities(newIdentities);
    if (!vaultLocked) {
      localStorage.setItem('technocore_identities', JSON.stringify(newIdentities));
    }
  };

  const checkServerHealth = async () => {
    try {
      const res = await fetch('https://technocore.chat/.well-known/agent.json');
      setServerOnline(res.ok);
    } catch (err) {
      setServerOnline(false);
    }
  };

  const handleIdentityCreated = async (newIdentity, optionalPassword) => {
    const updated = [newIdentity, ...identities];
    setIdentities(updated);
    setActiveIdentity(newIdentity);

    if (optionalPassword) {
      const enc = await encryptVault(updated, optionalPassword);
      localStorage.setItem('technocore_encrypted_vault', JSON.stringify(enc));
      localStorage.removeItem('technocore_identities');
      setEncryptedVaultData(enc);
      setVaultLocked(false);
    } else {
      localStorage.setItem('technocore_identities', JSON.stringify(updated));
    }

    setActiveTab('identity');
  };

  const handleSelectIdentity = (idObj) => {
    setActiveIdentity(idObj);
  };

  const handleDeleteIdentity = (id) => {
    if (confirm('Bu kimliği Vault\'tan silmek istediğinizden emin misiniz?')) {
      const updated = identities.filter(i => i.id !== id);
      saveIdentities(updated);
      if (activeIdentity?.id === id) {
        setActiveIdentity(updated[0] || null);
      }
    }
  };

  const handleUnlockVault = async (password) => {
    if (!encryptedVaultData) return;
    const decrypted = await decryptVault(encryptedVaultData, password);
    setIdentities(decrypted);
    if (decrypted.length > 0) setActiveIdentity(decrypted[0]);
    setVaultLocked(false);
  };

  const handleLockVault = () => {
    setVaultLocked(true);
    setIdentities([]);
    setActiveIdentity(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans scanlines selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeIdentity={activeIdentity}
        vaultLocked={vaultLocked}
        setVaultLocked={setVaultLocked}
        serverOnline={serverOnline}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'identity' && (
          <div className="space-y-8">
            <VaultManager
              identities={identities}
              activeIdentity={activeIdentity}
              onSelectIdentity={handleSelectIdentity}
              onDeleteIdentity={handleDeleteIdentity}
              vaultLocked={vaultLocked}
              setVaultLocked={setVaultLocked}
              onUnlockVault={handleUnlockVault}
              onLockVault={handleLockVault}
              onNewIdentityClick={() => {
                const el = document.getElementById('generator-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <div id="generator-section">
              <IdentityGenerator
                onIdentityCreated={handleIdentityCreated}
                identities={identities}
              />
            </div>
          </div>
        )}

        {activeTab === 'publisher' && (
          <DidNotePublisher activeIdentity={activeIdentity} />
        )}

        {activeTab === 'signing' && (
          <SignedMessageStudio activeIdentity={activeIdentity} />
        )}

        {activeTab === 'chat' && (
          <LiveChatClient activeIdentity={activeIdentity} />
        )}

        {activeTab === 'ownership' && (
          <RoomOwnership activeIdentity={activeIdentity} />
        )}

        {activeTab === 'docs' && (
          <ProtocolInspector />
        )}

      </main>

      {/* Avant-Garde Designer Signature Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-sm shadow-cyan-500/20">
              ⚡
            </div>
            <div className="text-left">
              <span className="font-bold text-slate-200 block text-sm">Technocore DID Studio</span>
              <span className="text-[11px] text-slate-400">100% Client-Side Web Application • Zero Terminal Required</span>
            </div>
          </div>

          {/* Designer Card Credit */}
          <div className="flex items-center gap-2 p-2 px-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">Architected & Designed by</span>
            <a
              href="https://x.com/0xenkazweb"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40 transition group"
            >
              <Twitter className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>@0xenkazweb</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://technocore.chat/llms.txt" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">llms.txt</a>
            <span>•</span>
            <a href="https://github.com/flop-labs/technocore-chat" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition">technocore-chat</a>
          </div>

        </div>
      </footer>

    </div>
  );
}
