import React from 'react'
import { signin } from '../api'

export default class SignIn extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      email: '',
      password: '',
      loading: false,
      errors: null,
      infoMessage: ''
    }
    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    const { name, value } = e.target
    this.setState({ [name]: value, errors: null, infoMessage: '' })
  }

  async onSubmit(e) {
    e.preventDefault()
    this.setState({ errors: null, loading: true, infoMessage: '' })
    const { email, password } = this.state

    if (!email || !password) {
      this.setState({
        errors: { _global: ['Please enter both email and password'] },
        loading: false
      })
      return
    }

    try {
      const res = await signin({ email, password })
      // expected backend: { message: "Sign-in successfull" } and Set-Cookie
      if (res && (res.message && res.message.toLowerCase().includes('sign-in') || res.message.toLowerCase().includes('success'))) {
        this.setState({ infoMessage: 'Signed in successfully' })
        if (this.props.onAuth) this.props.onAuth()
        // small delay so user sees success message
        setTimeout(() => {
          if (this.props.navigate) this.props.navigate('dashboard')
        }, 300)
      } else {
        // fallback - navigate if backend didn't send exact message but sign-in worked
        if (this.props.onAuth) this.props.onAuth()
        if (this.props.navigate) this.props.navigate('dashboard')
      }
    } catch (err) {
      const body = err && err.body ? err.body : err
      if (body && body.message && body.message.fieldErrors) {
        this.setState({ errors: body.message.fieldErrors })
      } else if (body && body.message) {
        this.setState({ errors: { _global: [body.message] } })
      } else if (body && body.error) {
        this.setState({ errors: { _global: [body.error] } })
      } else {
        this.setState({ errors: { _global: ['Sign-in failed. Try again.'] } })
      }
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { email, password, loading, errors, infoMessage } = this.state

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-600 to-sky-800">
            <h2 className="text-2xl font-extrabold text-white">Welcome back</h2>
            <p className="text-sky-100 mt-1">Sign in to continue your research sessions and exports.</p>
          </div>

          <div className="p-6">
            {infoMessage && (
              <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-green-800 text-sm">
                {infoMessage}
              </div>
            )}

            {errors && errors._global && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
                {errors._global.join(' ')}
              </div>
            )}

            <form onSubmit={this.onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={this.onChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors && errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.join(', ')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={this.onChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                {errors && errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.join(', ')}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={
                    'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white ' +
                    (loading ? 'bg-indigo-400 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:opacity-95')
                  }
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8z"/>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => this.props.navigate && this.props.navigate('register')}
                  className="text-sky-600 hover:underline"
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => alert('If you forgot your password, use the password reset flow on the backend (not implemented here).')}
                  className="text-gray-500 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}