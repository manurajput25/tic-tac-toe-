import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ConfirmationResult } from 'firebase/auth';
import { X, Smartphone, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { sound } from '../utils/audio';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const COUNTRY_CODES = [
  { code: '+1', name: 'USA / Canada' },
  { code: '+91', name: 'India' },
  { code: '+44', name: 'UK' },
  { code: '+61', name: 'Australia' },
  { code: '+49', name: 'Germany' },
  { code: '+81', name: 'Japan' },
  { code: '+33', name: 'France' },
  { code: '+971', name: 'UAE' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { loginWithGoogle, setupRecaptcha, sendPhoneOtp, verifyPhoneOtp } = useAuth();

  const [authMethod, setAuthMethod] = useState<'options' | 'phone'>('options');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    sound.playClick();
    try {
      await loginWithGoogle();
      sound.playWin();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Google sign-in was cancelled or failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanNumber}`;
    setError(null);
    setLoading(true);
    sound.playClick();

    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const confirmation = await sendPhoneOtp(fullPhoneNumber, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setCountdown(45);
      setError(null);
      // Auto-focus first OTP input
      setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
    } catch (err: unknown) {
      console.error('Phone OTP error', err);
      setError(
        'Unable to send SMS. Ensure your phone number is valid or try Demo Verification below.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit entry
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpCode];
    updated[index] = digit;
    setOtpCode(updated);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP Code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.');
      return;
    }

    setError(null);
    setLoading(true);
    sound.playClick();

    try {
      await verifyPhoneOtp(confirmationResult, code);
      sound.playWin();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError('Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 border border-slate-700/80 rounded-[32px] shadow-2xl text-slate-100 overflow-hidden">
        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white tracking-tight">
                {authMethod === 'phone' ? 'Mobile Verification' : 'Player Account Login'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Unlock multiplayer, user profiles & win tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* MAIN OPTIONS VIEW */}
        {authMethod === 'options' && (
          <div className="space-y-4">
            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg cursor-pointer hover:shadow-cyan-500/10 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                or
              </span>
            </div>

            {/* Mobile Number Button */}
            <button
              onClick={() => {
                sound.playClick();
                setAuthMethod('phone');
              }}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-slate-950/80 hover:bg-slate-800/80 text-white font-semibold text-sm rounded-2xl border border-slate-700/80 flex items-center justify-center gap-3 transition-all cursor-pointer hover:border-cyan-500/60 active:scale-[0.98]"
            >
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <span>Continue with Mobile OTP</span>
            </button>

            {/* Value Proposers */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-left">
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="text-cyan-400 font-bold text-xs flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Custom ID</span>
                </div>
                <div className="text-[11px] text-slate-400">Personalized unique player handle & stats</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
                <div className="text-purple-400 font-bold text-xs flex items-center gap-1 mb-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Real-time PVP</span>
                </div>
                <div className="text-[11px] text-slate-400">Create private rooms & play online</div>
              </div>
            </div>
          </div>
        )}

        {/* PHONE NUMBER & OTP VIEW */}
        {authMethod === 'phone' && (
          <div>
            {!otpSent ? (
              /* Step 1: Input Phone Number */
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Enter Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-slate-950 text-white text-xs font-mono rounded-xl px-2.5 py-3 border border-slate-700 focus:outline-none focus:border-cyan-400"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.name})
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 9876543210"
                      autoFocus
                      required
                      className="flex-1 bg-slate-950 text-white text-sm rounded-xl px-3.5 py-3 border border-slate-700 focus:outline-none focus:border-cyan-400 font-mono tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    We will send a 6-digit one-time password (OTP) via SMS to verify your device.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAuthMethod('options');
                      setError(null);
                    }}
                    className="py-3 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || phoneNumber.length < 5}
                    className="flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Input 6-Digit OTP */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Enter Verification Code
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      {countryCode} {phoneNumber}
                    </span>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="flex justify-between gap-1.5 sm:gap-2">
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputsRef.current[index] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-11 sm:w-12 h-14 bg-slate-950 text-white text-center text-xl font-bold font-mono rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                      />
                    ))}
                  </div>

                  {/* Resend Timer */}
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    {countdown > 0 ? (
                      <span className="text-slate-400">Resend code in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        Resend SMS OTP
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode(['', '', '', '', '', '']);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      Change Number
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || otpCode.join('').length !== 6}
                    className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="animate-spin">⏳ Verifying...</span>
                    ) : (
                      <span>Verify & Enter Arena</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
