import React, { useState } from 'react'
import { Mail, TrendingUp, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface ForgotPasswordPageProps {
  onBack: () => void
  onSwitchToLogin: () => void
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack, onSwitchToLogin }) => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await resetPassword(email)
    if (error) {
      if (error.message.includes('User not found')) {
        setMessage({ type: 'error', text: 'No account found with this email.' });
      } else if (error.message.includes('not allowed')) {
        setMessage({ type: 'error', text: 'Password reset is not allowed for this account.' });
      } else {
        setMessage({ type: 'error', text: error.message });
      }
    } else {
      setMessage({ type: 'success', text: 'Password reset link sent to your email.' });
    }
    setLoading(false)
  }

  if (message?.type === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Check Your Email</h2>
            <p className="text-slate-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>. 
              Please check your email and follow the instructions to reset your password.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center py-12 px-4">
      {/* Top-left branding */}
      <div className="fixed top-4 left-4 z-10">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={onBack}>
          <div className="p-2 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-900">SuperAI Advisor</h1>
            <p className="text-xs text-slate-600">Your AI Investment Guide</p>
          </div>
        </div>
      </div>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
          <p className="text-sm sm:text-base text-slate-600">Enter your email address and we'll send you a reset link</p>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div className={`p-3 sm:p-4 border rounded-lg ${
                message.type === 'error' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <p className={`text-xs sm:text-sm ${
                  message.type === 'error' ? 'text-red-700' : 'text-green-700'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 sm:py-3 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-slate-600">
              Remember your password?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}