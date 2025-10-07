import { useState, useEffect } from 'react';
import { Check, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';

// Mailcheck-like functionality
const emailDomains = ['gmail.com', 'outlook.com', 'icloud.com', 'hotmail.com', 'yahoo.com', 'aol.com', 'live.com'];

const suggestDomain = (email: string): string | null => {
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  
  const domain = parts[1].toLowerCase();
  if (!domain) return null;
  
  for (let suggested of emailDomains) {
    if (domain === suggested) return null;
    
    const distance = levenshteinDistance(domain, suggested);
    if (distance <= 2 && domain.length > 2) {
      return suggested;
    }
  }
  return null;
};

const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const getAutocompleteSuggestions = (input: string): string[] => {
  const parts = input.split('@');
  if (parts.length !== 2) return [];
  
  const domain = parts[1].toLowerCase();
  if (domain.length < 3) return [];
  
  return emailDomains.filter(d => d.startsWith(domain));
};

const SignUpFlow = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verificationCode, setVerificationCode] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [verificationError, setVerificationError] = useState(false);

  const passwordRequirements = {
    length: password.length >= 8 && password.length <= 100,
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    special: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (step === 5 && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 5 && redirectCountdown === 0) {
      window.location.href = 'https://www.pamperedchef.com';
    }
  }, [step, redirectCountdown]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    
    // Show all domains after typing @
    if (value.includes('@') && value.split('@')[1].length === 0) {
      const username = value.split('@')[0];
      setSuggestions(emailDomains.map(d => `${username}@${d}`));
    } else {
      const autocompleteSuggestions = getAutocompleteSuggestions(value);
      if (autocompleteSuggestions.length > 0) {
        const username = value.split('@')[0];
        setSuggestions(autocompleteSuggestions.map(d => `${username}@${d}`));
      } else {
        setSuggestions([]);
      }
    }
  };

  const handleEmailContinue = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    const suggestedDomain = suggestDomain(email);
    if (suggestedDomain) {
      const parts = email.split('@');
      setEmailError(`Did you mean ${parts[0]}@${suggestedDomain}?`);
      return;
    }

    if (email === 'fvdsgn@gmail.com') {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
    setPhoneError('');
  };

  const handleAccountCreate = () => {
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError('First name is required.');
      hasError = true;
    } else {
      setFirstNameError('');
    }

    if (!lastName.trim()) {
      setLastNameError('Last name is required.');
      hasError = true;
    } else {
      setLastNameError('');
    }
    
    if (!phone.trim()) {
      setPhoneError('Phone number is required.');
      hasError = true;
    } else {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        setPhoneError('Please enter a valid 10-digit phone number.');
        hasError = true;
      } else {
        setPhoneError('');
      }
    }

    if (!password.trim()) {
      setPasswordError('Create a password is required.');
      hasError = true;
    } else if (!isPasswordValid) {
      setPasswordError('Password does not meet all requirements.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    setStep(4);
  };

  const handleVerificationInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setVerificationError(false);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleVerify = () => {
    const code = verificationCode.join('');
    if (code === '123456') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setStep(5);
      }, 1500);
    } else {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setVerificationError(true);
      }, 1500);
    }
  };

  const formatPhoneDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        {step > 1 && step < 5 && (
          <button 
            onClick={() => setStep(step === 2 ? 1 : step === 4 ? 3 : step - 1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Previous</span>
          </button>
        )}
        {step === 1 && (
          <a href="#" className="text-sm text-teal-700 hover:underline">Back to Home</a>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="https://www.pamperedchef.com/iceberg/images/tpclogo_us.png" 
              alt="Pampered Chef" 
              className="mx-auto h-12"
            />
          </div>

          {/* Step 1: Email Entry */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl text-center mb-3" style={{ fontFamily: 'Questa, Georgia, serif' }}>
                Sign in or Create Your Account
              </h1>
              <p className="text-center text-gray-600 mb-6 text-sm">
                Not sure if you have a Pampered Chef Account? Type your email and we'll check it for you.
              </p>

              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-700'
                  }`}
                  placeholder="Email Address"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setEmail(suggestion);
                          setSuggestions([]);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <button
                onClick={handleEmailContinue}
                style={{ backgroundColor: '#1A5962' }}
                className="w-full text-white py-3 rounded-md hover:opacity-90 font-medium"
              >
                Continue
              </button>

              <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
                By creating or signing in to your account, you agree to receive recurring automated marketing texts or emails from Pampered Chef, consultants, or approved third parties. See our{' '}
                <a href="#" className="text-teal-700 hover:underline">Terms of Use</a> &{' '}
                <a href="#" className="text-teal-700 hover:underline">Privacy Policy</a>.
              </p>
            </div>
          )}

          {/* Step 2: Sign In */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl text-center mb-6" style={{ fontFamily: 'Questa, Georgia, serif' }}>
                Welcome Back!
              </h1>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold">{email}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-700"
                    placeholder="Enter your password"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <button className="text-sm text-teal-700 hover:underline mt-2">
                  Forgot password?
                </button>
              </div>

              <button
                style={{ backgroundColor: '#1A5962' }}
                className="w-full text-white py-3 rounded-md hover:opacity-90 font-medium"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Step 3: Account Creation */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-2xl text-center mb-4" style={{ fontFamily: 'Questa, Georgia, serif' }}>
                Create your Pampered Chef Account
              </h1>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600">Email</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{email}</p>
                  <button 
                    onClick={() => setStep(1)}
                    className="text-sm text-teal-700 hover:underline"
                  >
                    Change
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">* Required field</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (firstNameError) setFirstNameError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      firstNameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-700'
                    }`}
                  />
                  {firstNameError && (
                    <p className="text-red-500 text-sm mt-1">{firstNameError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (lastNameError) setLastNameError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      lastNameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-700'
                    }`}
                  />
                  {lastNameError && (
                    <p className="text-red-500 text-sm mt-1">{lastNameError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formatPhoneDisplay(phone)}
                    onChange={(e) => {
                      handlePhoneChange(e);
                      if (phoneError) setPhoneError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-700'
                    }`}
                    placeholder="(555) 555-5555"
                  />
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Create a password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-700'
                      }`}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>
              </div>

              <div className="mb-6 space-y-2 text-sm">
                <p className="text-gray-700">Your password must include the following:</p>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                    passwordRequirements.length ? 'bg-green-500' : 'bg-white border-2 border-gray-300'
                  }`}>
                    {passwordRequirements.length && <Check size={12} className="text-white" />}
                  </div>
                  <span className={passwordRequirements.length ? 'text-gray-900' : 'text-gray-600'}>
                    8-100 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                    passwordRequirements.case ? 'bg-green-500' : 'bg-white border-2 border-gray-300'
                  }`}>
                    {passwordRequirements.case && <Check size={12} className="text-white" />}
                  </div>
                  <span className={passwordRequirements.case ? 'text-gray-900' : 'text-gray-600'}>
                    Upper & lowercase letters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                    passwordRequirements.special ? 'bg-green-500' : 'bg-white border-2 border-gray-300'
                  }`}>
                    {passwordRequirements.special && <Check size={12} className="text-white" />}
                  </div>
                  <span className={passwordRequirements.special ? 'text-gray-900' : 'text-gray-600'}>
                    At least one number or special character
                  </span>
                </div>
              </div>

              <button
                onClick={handleAccountCreate}
                style={{ backgroundColor: '#1A5962' }}
                className="w-full text-white py-3 rounded-md hover:opacity-90 font-medium"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 4: Verification */}
          {step === 4 && (
            <div className="bg-white rounded-lg shadow-sm p-8">


              <h1 className="text-2xl text-center mb-4 font-bold">
                Enter verification code
              </h1>
              
              {verificationError && (
                <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm text-red-700">
                      The entered code is incorrect, please check your email and re-enter it.
                    </p>
                  </div>
                </div>
              )}


              <p className="text-center text-gray-700 mb-6 text-sm">
                Please enter the 6-digit verification code we sent to{' '}
                <strong>{email}</strong>.
                <button 
                  onClick={() => setStep(3)}
                  className="text-gray-600 hover:underline font-normal"
                >
                  Change
                </button>
              </p>

              <div className="flex justify-center gap-2 mb-6">
                {verificationCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`code-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleVerificationInput(idx, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !digit && idx > 0) {
                        document.getElementById(`code-${idx - 1}`)?.focus();
                      }
                    }}
                    className={`w-12 h-12 text-center text-xl border-2 rounded-md focus:outline-none focus:ring-2 ${
                      verificationError 
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-teal-700 focus:border-teal-700'
                    }`}
                  />
                ))}
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-700">
                  Didn't receive it?{' '}
                  <button
                    onClick={() => setCountdown(30)}
                    disabled={countdown > 0}
                    className="text-gray-700 hover:underline font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Get another code {countdown > 0 && `(${countdown}s)`}
                  </button>
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={verificationCode.join('').length !== 6 || isLoading}
                style={{ backgroundColor: '#1A5962' }}
                className="w-full text-white py-3 rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Verifying...
                  </>
                ) : (
                  'Verify and create account'
                )}
              </button>

              {/* Removed 'Keep me signed in' section as requested */}
            </div>
          )}

          {/* Step 5: Success */}
          {step === 5 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-white" />
              </div>
              
              <h1 className="text-2xl mb-4" style={{ fontFamily: 'Questa, Georgia, serif' }}>
                Welcome to Pampered Chef
              </h1>
              
              <p className="text-gray-600 mb-8">
                We're so happy to have you here!
              </p>

              <button
                style={{ backgroundColor: '#1A5962' }}
                className="w-full text-white py-3 rounded-md hover:opacity-90 font-medium"
              >
                Continue ({redirectCountdown}s)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-6">
        <div className="text-center mb-4">
          <img 
            src="https://www.pamperedchef.com/iceberg/images/Favicon.png" 
            alt="Pampered Chef" 
            className="mx-auto h-12 w-12"
          />
        </div>
        <p className="text-center text-xs text-gray-600 mb-4">
          A proud member of the Berkshire Hathaway Family of Companies.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 px-4">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">California Supply Chain</a>
          <a href="#" className="hover:underline">Terms of Use</a>
          <a href="#" className="hover:underline">Accessibility Statement</a>
          <a href="#" className="hover:underline">About BPA</a>
          <a href="#" className="hover:underline">Cookie Preferences</a>
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">
          © 2025 Pampered Chef used under license. All Rights Reserved.
        </p>
      </div>
    </div>
  );
};

export default SignUpFlow;