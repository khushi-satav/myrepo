import React from 'react'

export default class Nav extends React.Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }

  onClick(route) {
    if (this.props.navigate) this.props.navigate(route)
  }

  render() {
    const { authed } = this.props
    return (
      <nav className="nav">
        <div className="nav-inner">
          <div className="brand" style={{ cursor: 'pointer' }} onClick={() => this.onClick('dashboard')}>
            Research App
          </div>
          <div className="links">
            <span style={{ marginRight: 12, cursor: 'pointer' }} onClick={() => this.onClick('register')}>
              Register
            </span>
            <span style={{ marginRight: 12, cursor: 'pointer' }} onClick={() => this.onClick('signin')}>
              Sign in
            </span>
            <span style={{ marginRight: 12, cursor: 'pointer' }} onClick={() => this.onClick('dashboard')}>
              Dashboard
            </span>
            {authed ? <span className="muted"> (Signed in)</span> : null}
          </div>
        </div>
      </nav>
    )
  }
}