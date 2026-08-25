import { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const AI_BUDDY_URL = import.meta.env.VITE_AI_BUDDY_URL || 'http://localhost:3005';

export default function ChatWidget() {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [waiting, setWaiting] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const refreshCartRef = useRef(refreshCart);

  const isShopper = user && user.role !== 'seller';

  useEffect(() => {
    refreshCartRef.current = refreshCart;
  }, [refreshCart]);

  // Connect once the widget is opened by a logged-in shopper, and tear down on close/logout.
  useEffect(() => {
    if (!open || !isShopper) return;

    const socket = io(AI_BUDDY_URL, {
      path: '/api/socket/socket.io/',
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));

    socket.on('disconnect', () => setConnected(false));

    socket.on('connect_error', () => {
      setConnected(false);
      setWaiting(false);
    });

    socket.on('message', (content) => {
      setWaiting(false);
      setMessages((prev) => [...prev, { role: 'bot', content }]);
      // The agent adds to cart via a direct backend call, bypassing CartContext —
      // resync so the navbar badge and cart page reflect it without a manual refresh.
      refreshCartRef.current?.();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [open, isShopper]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, waiting]);

  if (!isShopper) return null;

  const sendMessage = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current || !connected) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    socketRef.current.emit('message', text);
    setInput('');
    setWaiting(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 flex h-[32rem] w-[22rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border-soft bg-surface-raised shadow-2xl">
          <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full flare-gradient">
                <Bot size={16} className="text-ink" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-star">AI Buddy</p>
                <p className="font-mono-price text-[10px] uppercase tracking-widest text-muted">
                  {connected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-muted hover:text-star"
              aria-label="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Bot size={28} className="text-muted" />
                <p className="text-sm text-muted">
                  Ask me to find products or add something to your cart.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'flare-gradient text-ink'
                      : 'card-surface text-star'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {waiting && (
              <div className="flex justify-start">
                <div className="card-surface flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border-soft p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={connected ? 'Type a message...' : 'Connecting...'}
              disabled={!connected}
              className="w-full flex-1 rounded-full border border-border-soft bg-surface px-4 py-2 text-sm text-star placeholder:text-muted focus:outline-none focus:border-flare-hot/60 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!connected || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full flare-gradient text-ink disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full flare-gradient text-ink shadow-xl hover:scale-105 transition-transform"
        aria-label={open ? 'Close AI Buddy' : 'Open AI Buddy'}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>
    </div>
  );
}
