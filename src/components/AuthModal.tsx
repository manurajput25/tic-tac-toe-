import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Smartphone,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User,
  Mail,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', name: 'India' },
  { code: '+1', name: 'USA / Canada' },
  { code: '+44', name: 'UK' },
  { code: '+61', name: 'Australia' },
  { code: '+49', name: 'Germany' },
  { code: '+81', name: 'Japan' },
  { code: '+33', name: 'France' },
  { code: '+971', name: 'UAE' },
];

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const { loginWithGoogle, sendPhoneVerification, verifyPhoneOtpCode } = useAuth();

  const [authMethod, setAuthMethod] = useState<'select' | 'google_input' | 'phone'>('select');
  const [googleName, setGoogleName] = useState<string>('Manu Kirar');
  const [googleEmail, setGoogleEmail] = useState<string>('manukirar82@gmail.com');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showDomainInfo, setShowDomainInfo] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';

  // OTP Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Copy Authorized Domain to clipboard
  const handleCopyDomain = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  // 1. Google Sign-In Click -> Open Google Account view immediately
  const handleOpenGoogle = () => {
    sound.playClick();
    setErrorNotice(null);
    setAuthMethod('google_input');
  };

  // 1b. Complete Google profile and save to Firebase Firestore
  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorNotice(null);
    sound.playClick();

    try {
      const name = googleName.trim() || 'Google Challenger';
      const email = googleEmail.trim() || undefined;
      await loginWithGoogle(name, email);
      sound.playWin();
      onSuccess?.();
      onClose();
    } catch {
      setErrorNotice('Could not connect to Firebase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Send Mobile OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 8) {
      setErrorNotice('Please enter a valid mobile number (min 8 digits).');
      return;
    }

    const fullPhoneNumber = `${countryCode}${cleanNumber}`;
    setErrorNotice(null);
    setLoading(true);
    sound.playClick();

    try {
      const res = await sendPhoneVerification(fullPhoneNumber);
      setVerificationId(res.verificationId);
      if (res.simulatedOtp) {
        setSimulatedOtp(res.simulatedOtp);
      }
      setOtpSent(true);
      setCountdown(45);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
    } catch {
      setErrorNotice('Failed to send verification code. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP Code & Save to Firebase
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpCode.join('');
    if (code.length !== 6 || !verificationId) {
      setErrorNotice('Please enter the complete 6-digit OTP code.');
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
    setLoading(true);
    setErrorNotice(null);
    sound.playClick();

    try {
      await verifyPhoneOtpCode(fullPhoneNumber, verificationId, code);
      sound.playWin();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP code. Please try again.';
      setErrorNotice(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill OTP on click
  const handleAutoFillOtp = (otp: string) => {
    sound.playClick();
    const digits = otp.split('').slice(0, 6);
    setOtpCode(digits);
    otpInputsRef.current[5]?.focus();
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpCode];
    updated[index] = digit;
    setOtpCode(updated);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Invisible reCAPTCHA container for Firebase */}
        <div id="recaptcha-container" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                {authMethod === 'phone'
                  ? 'Phone OTP Sign In'
                  : authMethod === 'google_input'
                  ? 'Google Sign-In'
                  : 'Account Sign In'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Store profile & career win stats in Firebase
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

        {/* Error / Notice Notification */}
        {errorNotice && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorNotice}</span>
          </div>
        )}

        {/* VIEW 1: SELECT SIGN-IN METHOD (ONLY GOOGLE AND MOBILE NUMBER) */}
        {authMethod === 'select' && (
          <div className="space-y-3.5">
            {/* 1. Google Sign-In Button */}
            <button
              type="button"
              onClick={handleOpenGoogle}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md cursor-pointer hover:shadow-cyan-500/10 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
                or
              </span>
            </div>

            {/* 2. Mobile Number (OTP) Button */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setAuthMethod('phone');
                setErrorNotice(null);
              }}
              className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm rounded-2xl border border-slate-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:border-cyan-500/50 active:scale-[0.98]"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Continue with Mobile OTP</span>
            </button>

            {/* Firebase Authorized Domain Helper */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDomainInfo(!showDomainInfo)}
                className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-400 transition-colors py-1 cursor-pointer"
              >
                <span>🌐 Firebase Authorized Domain</span>
                {showDomainInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDomainInfo && (
                <div className="mt-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-left">
                  <div className="text-[11px] text-slate-400">
                    Add this domain to Firebase Console under <strong>Authentication → Settings → Authorized domains</strong>:
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700 font-mono text-[10px] text-cyan-300 break-all">
                    <span>{currentHostname}</span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="p-1 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                      title="Copy domain"
                    >
                      {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <a
                    href="https://console.firebase.google.com/project/apt-deployment-494007-d6/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline pt-1"
                  >
                    <span>Open Firebase Auth Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1b: GOOGLE ACCOUNT SIGN-IN FORM */}
        {authMethod === 'google_input' && (
          <form onSubmit={handleCompleteGoogleProfile} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
              <div>
                <div className="text-sm font-bold text-white">Google Profile</div>
                <div className="text-[11px] text-slate-400">Save profile & career stats to Firebase</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500 text-xs">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Manu Kirar"
                  autoFocus
                  required
                  className="w-full bg-slate-950 text-white text-sm rounded-xl pl-10 pr-3.5 py-3 border border-slate-700 focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Google Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-500 text-xs">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. manukirar82@gmail.com"
                  required
                  className="w-full bg-slate-950 text-white text-sm rounded-xl pl-10 pr-3.5 py-3 border border-slate-700 focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setAuthMethod('select');
                }}
                className="py-3 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !googleName.trim()}
                className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? <span>Connecting...</span> : <span>Sign In & Save to Firebase</span>}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: MOBILE NUMBER & OTP VERIFICATION */}
        {authMethod === 'phone' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Enter Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-slate-950 text-white text-xs font-mono rounded-xl px-2 py-3 border border-slate-700 focus:outline-none focus:border-cyan-400"
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
                    A 6-digit OTP code will be sent to verify your phone number.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAuthMethod('select');
                      setErrorNotice(null);
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
                    {loading ? <span>Sending...</span> : <span>Send OTP Code</span>}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Verification Code banner */}
                {simulatedOtp && (
                  <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                        Verification Code
                      </div>
                      <div className="text-base font-mono font-extrabold tracking-widest text-white">
                        {simulatedOtp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAutoFillOtp(simulatedOtp)}
                      className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-center gap-2">
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputsRef.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !digit && index > 0) {
                            otpInputsRef.current[index - 1]?.focus();
                          }
                        }}
                        className="w-10 h-12 text-center text-lg font-bold font-mono bg-slate-950 text-white rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 px-1">
                    <span>Sent to {countryCode} {phoneNumber}</span>
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={handleSendOtp}
                      className="text-cyan-400 hover:underline disabled:text-slate-600 disabled:no-underline cursor-pointer"
                    >
                      {countdown > 0 ? `Resend (${countdown}s)` : 'Resend'}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setOtpSent(false);
                      setOtpCode(['', '', '', '', '', '']);
                      setErrorNotice(null);
                    }}
                    className="py-3 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Change #
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otpCode.join('').length !== 6}
                    className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {loading ? <span>Verifying...</span> : <span>Verify & Save to Firebase</span>}
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
