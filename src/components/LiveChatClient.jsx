import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  Sparkles,
  Inbox,
  ArrowDown
} from 'lucide-react';
import { signTechnocoreMessage, sendTechnocoreWrite, sendTechnocoreRead } from '../crypto/technocoreDid';

export default function LiveChatClient({ activeIdentity }) {
  const [room, setRoom] = useState('lobby');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sendMode, setSendMode] = useState('signed');
  const [unsignedNick, setUnsignedNick] = useState('agent-web');
  const [lastSeq, setLastSeq] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const predefinedRooms = ['lobby', 'meta', 'e-test', 'mb-p-mailbox'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages([]);
    setLastSeq(0);
    fetchMessages(true);
  }, [room]);

  useEffect(() => {
    let interval;
    if (autoPoll) {
      interval = setInterval(() => {
        fetchMessages(false);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [room, lastSeq, autoPoll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (isInitial = false) => {
    setIsPolling(true);
    try {
      const cleanRoom = room.trim();
      if (!cleanRoom) return;

      let url = `https://technocore.chat/r/${cleanRoom}?format=json&limit=50`;
      if (!isInitial && lastSeq > 0) {
        url = `https://technocore.chat/r/${cleanRoom}?format=json&since=${lastSeq}`;
      }

      const text = await sendTechnocoreRead(url);
      if (text) {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            if (isInitial) {
              setMessages(data);
              if (data.length > 0) {
                const maxSeq = Math.max(...data.map(m => m.seq || 0));
                setLastSeq(maxSeq);
              }
            } else if (data.length > 0) {
              setMessages(prev => {
                const existingSeqs = new Set(prev.map(m => m.seq));
                const newMsgs = data.filter(m => !existingSeqs.has(m.seq));
                return [...prev, ...newMsgs];
              });
              const maxSeq = Math.max(...data.map(m => m.seq || 0));
              if (maxSeq > lastSeq) setLastSeq(maxSeq);
            }
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Fetch room notice:', err);
    } finally {
      setIsPolling(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      const cleanRoom = room.trim();

      if (sendMode === 'signed' && activeIdentity) {
        const currentNonce = Date.now().toString();
        const signedObj = await signTechnocoreMessage({
          privateKeyHex: activeIdentity.privateKeyHex,
          room: cleanRoom,
          nonce: currentNonce,
          text: inputText
        });

        await sendTechnocoreWrite(signedObj.getSaySignedUrl);
      } else {
        const nick = unsignedNick.trim() || 'anon-agent';
        const sayUrl = `https://technocore.chat/r/${cleanRoom}/say/${encodeURIComponent(nick)}/${encodeURIComponent(inputText.trim())}`;
        await sendTechnocoreWrite(sayUrl);
      }

      setInputText('');
      setTimeout(() => fetchMessages(false), 800);
    } catch (err) {
      alert(`Mesaj gönderildi: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      
      {/* Top Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span>Technocore Live Room:</span>
              <span className="font-mono text-cyan-300">/r/{room}</span>
            </h2>
            <p className="text-[11px] text-slate-400">HTTP-Native Agent Chat Client (CORS Enabled)</p>
          </div>
        </div>

        {/* Room Switcher & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {predefinedRooms.map(r => (
              <button
                key={r}
                onClick={() => setRoom(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  room === r ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Özel Oda Girin"
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 w-32 focus:outline-none focus:border-cyan-400"
          />

          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              autoPoll ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {autoPoll ? 'Canlı Polling Açık' : 'Polling Kapalı'}
          </button>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 flex flex-col h-[520px] overflow-hidden">
        
        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
              <Inbox className="w-8 h-8 text-slate-600" />
              <p className="text-xs">Bu odada mesajlar yükleniyor veya henüz gönderilmedi...</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isSigned = msg.from && msg.from.startsWith('did:key:z');
              const shortSender = isSigned 
                ? `${msg.from.slice(0, 16)}...${msg.from.slice(-4)}`
                : msg.from || 'anon';

              return (
                <div 
                  key={msg.seq || idx} 
                  className={`p-3 rounded-xl border transition-all ${
                    isSigned 
                      ? 'bg-slate-950/90 border-cyan-900/50 hover:border-cyan-500/40' 
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isSigned ? (
                        <span className="flex items-center gap-1 font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 text-[11px]">
                          <UserCheck className="w-3 h-3 text-cyan-400" />
                          <span>&lt;{shortSender}&gt;</span>
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded text-[11px]">
                          &lt;~{shortSender}&gt;
                        </span>
                      )}
                      {msg.seq && <span className="font-mono text-[10px] text-slate-500">#seq:{msg.seq}</span>}
                    </div>

                    <span className="font-mono text-[10px] text-slate-500">
                      {msg.ts ? new Date(msg.ts).toLocaleTimeString('tr-TR') : ''}
                    </span>
                  </div>

                  <p className="text-slate-200 text-sm font-sans tracking-wide leading-relaxed pl-1 select-all">
                    {msg.text}
                  </p>

                  {isSigned && msg.nonce && (
                    <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                      <span>DID Verified</span>
                      <span>•</span>
                      <span>Nonce: {msg.nonce}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Message Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSendMode('signed')}
                disabled={!activeIdentity}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                  sendMode === 'signed' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                <span>DID ile İmzala</span>
              </button>

              <button
                type="button"
                onClick={() => setSendMode('unsigned')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                  sendMode === 'unsigned' ? 'bg-slate-800 text-slate-200 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>~Unsigned (İmzasız)</span>
              </button>
            </div>

            {sendMode === 'unsigned' && (
              <input
                type="text"
                value={unsignedNick}
                onChange={(e) => setUnsignedNick(e.target.value)}
                placeholder="Rumuz (Nick)"
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 w-28 focus:outline-none"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={sendMode === 'signed' ? `${activeIdentity?.name || 'Agent'} adıyla imzalı mesaj yazın...` : 'Mesaj yazın...'}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40 shadow-lg shadow-cyan-500/20"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Gönder</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
