import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const { requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await requestOtp(email);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await verifyOtp(email, otp);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cosmic-navy px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-4xl text-cosmic-gold mb-2">Manifest</h1>
        <p className="text-cosmic-lavender-light text-sm mb-8">
          Your vision, your affirmations, your journey.
        </p>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/30 px-4 py-3 text-cosmic-star placeholder:text-cosmic-star/40 focus:outline-none focus:border-cosmic-gold"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-cosmic-gold text-cosmic-navy-deep font-medium py-3 hover:bg-cosmic-gold-light transition disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-cosmic-star/70 text-sm">Code sent to {email}</p>
            <input
              type="text"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
              maxLength={6}
              className="w-full rounded-lg bg-cosmic-navy-light border border-cosmic-lavender/30 px-4 py-3 text-cosmic-star placeholder:text-cosmic-star/40 text-center tracking-widest focus:outline-none focus:border-cosmic-gold"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-cosmic-gold text-cosmic-navy-deep font-medium py-3 hover:bg-cosmic-gold-light transition disabled:opacity-50"
            >
              {sending ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-cosmic-lavender-light text-sm underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </div>
  );
}
