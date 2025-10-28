import React from 'react'
import { verifyOtp } from '../api'

export default class OTPVerify extends React.Component {
  constructor(props) {
    super(props)
    this.state = { otp: '', error: null }
    this.onChange = this.onChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onChange(e) {
    this.setState({ otp: e.target.value, error: null })
  }

  async onSubmit(e) {
    e.preventDefault()
    const token = this.props.token || (this.props.routeParams && this.props.routeParams.token)
    if (!token) {
      this.setState({ error: 'Missing token' })
      return
    }
    try {
      const res = await verifyOtp(token, this.state.otp)
      if (res.message && res.message.toLowerCase().includes('success')) {
        alert('Sign-up successful. Please sign in.')
        if (this.props.navigate) this.props.navigate('signin')
      } else {
        alert(res.message || 'Verified')
        if (this.props.navigate) this.props.navigate('signin')
      }
    } catch (err) {
      const body = err && err.body ? err.body : err
      this.setState({ error: body && body.message ? body.message : 'Invalid OTP' })
    }
  }

  render() {
    return (
      <div className="card">
        <h2>OTP Verification</h2>
        {!this.props.token && <div className="error">Missing token. Use the link sent to your email.</div>}
        <form onSubmit={this.onSubmit} className="form">
          <label>
            OTP
            <input value={this.state.otp} onChange={this.onChange} required />
          </label>
          {this.state.error && <div className="error">{this.state.error}</div>}
          <div>
            <button type="submit" disabled={!this.props.token}>Verify OTP</button>
          </div>
        </form>
      </div>
    )
  }
}