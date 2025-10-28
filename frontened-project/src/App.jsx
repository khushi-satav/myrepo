import React from 'react'
import Nav from './components/Nav'
import Register from './pages/Register'
import OTPVerify from './pages/OTPVerify'
import SignIn from './pages/SignIn'
import Dashboard from './pages/DashBoard'
import { checkToken } from './api'

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      route: 'dashboard', // 'register' | 'verify' | 'signin' | 'dashboard'
      routeParams: {}, // e.g. { token: '...' }
      checkingAuth: true,
      authed: false
    }
    this.navigate = this.navigate.bind(this)
  }

  componentDidMount() {
    this._isMounted = true
    // check token on mount
    checkToken()
      .then((res) => {
        if (!this._isMounted) return
        if (res && res.userId) this.setState({ authed: true })
        else this.setState({ authed: false })
      })
      .catch(() => {
        if (!this._isMounted) return
        this.setState({ authed: false })
      })
      .finally(() => {
        if (!this._isMounted) return
        this.setState({ checkingAuth: false })
      })

    // If URL contains token param (OTP redirect), set verify route
    try {
      const u = new URL(window.location.href)
      const token = u.searchParams.get('token')
      if (token) {
        this.setState({ route: 'verify', routeParams: { token } })
      }
    } catch (e) {}
  }

  componentWillUnmount() {
    this._isMounted = false
  }

  navigate(route, params = {}) {
    this.setState({ route, routeParams: params })
    // update URL for OTP token if needed
    if (route === 'verify' && params.token) {
      try {
        const u = new URL(window.location.href)
        u.searchParams.set('token', params.token)
        window.history.replaceState({}, '', u.toString())
      } catch (e) {}
    } else {
      try {
        const u = new URL(window.location.href)
        u.searchParams.delete('token')
        window.history.replaceState({}, '', u.toString())
      } catch (e) {}
    }
  }

  renderContent() {
    const { route, routeParams, authed } = this.state
    if (this.state.checkingAuth) {
      return (
        <div className="py-12 flex justify-center">
          <div className="text-gray-600">Checking authentication...</div>
        </div>
      )
    }

    if (route === 'register') {
      return <Register navigate={this.navigate} />
    }
    if (route === 'verify') {
      return <OTPVerify token={routeParams.token} navigate={this.navigate} />
    }
    if (route === 'signin') {
      return <SignIn navigate={this.navigate} onAuth={() => this.setState({ authed: true, route: 'dashboard' })} />
    }
    // dashboard default
    if (route === 'dashboard') {
      if (!authed) {
        return (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">You need to sign in</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => this.navigate('signin')}
                  className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90"
                >
                  Sign in
                </button>
                <button
                  onClick={() => this.navigate('register')}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )
      }
      return <Dashboard />
    }

    return <div className="p-8">Not found</div>
  }

  render() {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="text-accent font-extrabold cursor-pointer"
                onClick={() => this.navigate('dashboard')}
              >
                Research App
              </div>
              <nav className="text-sm text-gray-700 flex gap-4">
                <button onClick={() => this.navigate('register')} className="hover:underline">Register</button>
                <button onClick={() => this.navigate('signin')} className="hover:underline">Sign in</button>
                <button onClick={() => this.navigate('dashboard')} className="hover:underline">Dashboard</button>
              </nav>
            </div>
            <div className="text-sm text-gray-500">{this.state.authed ? 'Signed in' : ''}</div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {this.renderContent()}
        </main>
      </div>
    )
  }
}