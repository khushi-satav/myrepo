import React from 'react'
import { checkEmail, register } from '../api'

export default class Register extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      email: '',
      password: '',
      errors: null,
      checkingEmail: false,
      emailAvailable: null,
      loading: false,
      infoMessage: ''
    }
    this.emailTimer = null
    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  componentWillUnmount() {
    if (this.emailTimer) clearTimeout(this.emailTimer)
  }

  onChange(e) {
    const { name, value } = e.target
    this.setState({ [name]: value, errors: null, infoMessage: '' })

    if (name === 'email') {
      // debounce email availability check
      this.setState({ emailAvailable: null })
      if (this.emailTimer) clearTimeout(this.emailTimer)
      const email = value.trim()
      if (!email) {
        return
      }
      this.emailTimer = setTimeout(async () => {
        this.setState({ checkingEmail: true })
        try {
          const res = await checkEmail(email)
          this.setState({ emailAvailable: !!res.available })
        } catch (err) {
          this.setState({ emailAvailable: false })
        } finally {
          this.setState({ checkingEmail: false })
        }
      }, 600)
    }
  }

  async onSubmit(e) {
    e.preventDefault()
    this.setState({ errors: null, loading: true, infoMessage: '' })
    const { username, email, password } = this.state

    // small client-side check
    if (!username || !email || !password) {
      this.setState({
        errors: { _global: ['Please fill all fields'] },
        loading: false
      })
      return
    }

    try {
      const data = await register({ username, email, password })
      // expect redirectUrl or message
      if (data.redirectUrl) {
        try {
          const u = new URL(data.redirectUrl)
          const token = u.searchParams.get('token')
          if (token && this.props.navigate) {
            this.props.navigate('verify', { token })
            return
          }
        } catch (e) {
          // ignore URL parse errors
        }
        // fallback: show info and let user follow
        this.setState({ infoMessage: 'OTP sent — follow the link from your email.' })
        // optionally redirect directly to returned URL
        // window.location.href = data.redirectUrl
      } else {
        this.setState({ infoMessage: data.message || 'OTP sent. Check your email.' })
      }
    } catch (err) {
      // err may have shape { status, body } or body.message.fieldErrors
      const body = (err && err.body) ? err.body : err
      if (body && body.message && body.message.fieldErrors) {
        this.setState({ errors: body.message.fieldErrors })
      } else if (body && body.message) {
        this.setState({ errors: { _global: [body.message] } })
      } else {
        this.setState({ errors: { _global: ['Registration failed. Try again.'] } })
      }
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const {
      username,
      email,
      password,
      checkingEmail,
      emailAvailable,
      errors,
      loading,
      infoMessage
    } = this.state

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-sky-600 to-indigo-600">
            <h2 className="text-2xl font-extrabold text-white">Create your account</h2>
            <p className="text-sky-100 mt-1">Join and start research queries with smart summarization.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  name="username"
                  value={username}
                  onChange={this.onChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="john_doe"
                  autoComplete="username"
                />
                {errors && errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.join(', ')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input
                    name="email"
                    value={email}
                    onChange={this.onChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <div className="absolute right-3 top-2.5">
                    {checkingEmail ? (
                      <svg className="w-5 h-5 text-gray-400 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8z"/>
                      </svg>
                    ) : emailAvailable === true ? (
                      <span className="text-green-600 text-sm font-medium">Available</span>
                    ) : emailAvailable === false ? (
                      <span className="text-red-600 text-sm font-medium">Taken</span>
                    ) : null}
                  </div>
                </div>
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
                  className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                {errors && errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.join(', ')}</p>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  <p>Password should include:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li>At least 6 characters</li>
                    <li>One uppercase letter</li>
                    <li>One number or symbol recommended</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={
                    'w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white ' +
                    (loading ? 'bg-sky-400 cursor-wait' : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-95')
                  }
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8z"/>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={() => this.props.navigate && this.props.navigate('signin')} className="text-sky-600 hover:underline">
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }
}