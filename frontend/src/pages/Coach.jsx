import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

export default function Coach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const res = await api.get('/ai-coach');
      setMessages(res.data.messages);
    } catch (err) {
      setError('Could not load chat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setError('');
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, role: 'user', content: text },
    ]);
    setSending(true);

    try {
      const res = await api.post('/ai-coach', { message: text });
      setMessages((prev) => [...prev, res.data.reply]);
    } catch (err) {
      setError(err.response?.data?.message || 'Manifest Bro is unavailable right now.');
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/ai-coach');
      setMessages([]);
    } catch (err) {
      setError('Could not clear chat');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-3xl text-cosmic-gold">🤖 Manifest Bro</h2>
        {messages.length > 0 && (
          <button onClick={handleClear} className="text-xs text-cosmic-star/40 underline">
            Clear chat
          </button>
        )}
      </div>
      <p className="text-cosmic-star/60 mb-4">Your hype-bro AI coach, locked in on your goals.</p>

      <div className="flex-1 overflow-y-auto rounded-xl bg-cosmic-navy-light border border-cosmic-lavender/20 p-4 space-y-3 mb-3">
        {loading ? (
          <p className="text-cosmic-star/50 text-sm">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-cosmic-star/50 text-sm text-center mt-8">
            Say something like "I want to buy a Lamborghini" and see what happens 😏
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-cosmic-gold text-cosmic-navy-deep'
                    : 'bg-cosmic-navy text-cosmic-star border border-cosmic-lavender/20'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-cosmic-navy text-cosmic-star/50 border border-cosmic-lavender/20">
              Manifest Bro is typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell Manifest Bro what you're calling in..."
          className="flex-1 rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/30 px-4 py-3 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-cosmic-gold text-cosmic-navy-deep font-medium px-5 py-3 hover:bg-cosmic-gold-light transition disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
