import React, { Component } from 'react';
import { Layout, Form, Input, Tabs, Button, message } from 'antd';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';
import 'antd/dist/antd.css';

class App extends Component {
  state = {
    user: null,
    activeTab: 'login',
  }

  componentDidMount = () => {
    const user = this.getUser();
    this.setState({
      user: user,
      activeTab: user ? 'logout' : 'login',
    });
  }

  render() {
    const user = this.state.user;
    return (
      <Layout className="App"
        style={{
          display: 'flex',
          height: '100%',
        }}
      >
        <Layout.Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '4em',
            flex: 1,
            background: 'white',
          }}
        >
          <Tabs
            activeKey={this.state.activeTab}
            onChange={tab => this.setState({activeTab: tab})}
            style={{
              width: '300px',
            }}
          >
            {user &&
            <Tabs.TabPane tab="Logout" key="logout">
              {this.renderUserInfo(user)}
            </Tabs.TabPane>
            }
            <Tabs.TabPane tab="Login" key="login">
              {this.renderLoginForm()}
            </Tabs.TabPane>
            {false &&
            <Tabs.TabPane tab="Register" key="register">
              {this.renderRegisterForm()}
            </Tabs.TabPane>
            }
          </Tabs>
        </Layout.Content>
      </Layout>
    );
  }

  renderUserInfo = (user) => {
    return (
      <div>
        <h1>{user.username}</h1>
        <Button type="primary" onClick={this.doLogout}>Logout</Button>
      </div>
    );
  }

  renderLoginForm = () => {
    return (
      <Form>
        <Form.Item>
          <Input placeholder="Username"
            ref={ref => this.loginUsername = ref}
          />
        </Form.Item>
        <Form.Item>
          <Input placeholder="Password" type="password"
            ref={ref => this.loginPassword = ref}
          />
        </Form.Item>
        <Form.Item
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button type="primary" onClick={this.doLogin}>Login</Button>
        </Form.Item>
      </Form>
    );
  }

  renderRegisterForm = () => {
    return (
      <Form>
        <Form.Item>
          <Input placeholder="Username"
            ref={ref => this.registerUsername = ref}
          />
        </Form.Item>
        <Form.Item>
          <Input placeholder="Password" type="password"
            ref={ref => this.registerPassword = ref}
          />
        </Form.Item>
        <Form.Item>
          <Input placeholder="Confirm password" type="password"
            ref={ref => this.registerConfirmPassword = ref}
          />
        </Form.Item>
        <Form.Item
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Button type="primary" onClick={this.doRegister}>Register</Button>
        </Form.Item>
      </Form>
    );
  }

  doLogout = () => {
    Cookies.remove('token', {
      domain: this.getDomain(),
    });
    this.setState({
      user: null,
      activeTab: 'login'
    });
  }

  doLogin = async () => {
    const username = this.loginUsername.input.value;
    const password = this.loginPassword.input.value;
    const res = await post('/api/login', {
      username: username,
      password: password,
    });
    if (res.status === 200) {
      const data = await res.json();
      Cookies.set('token', data.token, {
        domain: this.getDomain(),
      });
      message.success('Login succeed');
      this.setState({
        user: this.getUser(),
        activeTab: 'logout',
      });
    } else {
      message.error('Login failed: ' + await res.text());
    }
  }

  doRegister = async () => {
    const username = this.registerUsername.input.value;
    const password = this.registerPassword.input.value;
    const confirmPassword = this.registerConfirmPassword.input.value;
    if (password !== confirmPassword) {
      message.error('Password mismatch');
      return;
    }
    const res = await post('./api/register', {
      username: username,
      password: password,
    });
    if (res.status === 200) {
      Cookies.set('token', await res.text());
      message.success('Register succeed');
      this.setState({});
    } else {
      message.error('Register failed: ' + await res.text());
    }
  }

  getUser = () => {
    let user = null;
    const token = Cookies.get('token');
    if (token) {
      try {
        user = jwtDecode(token);
      } catch (e) {
        // no op
      }
    }
    return user;
  }

  getDomain = () => {
    const hostname = window.location.hostname;
    let parts = hostname.split('.');
    if (parts.length > 2) {
      parts = parts.splice(parts.length - 2);
    }
    return parts.join('.');
  }
}

async function post(path, data) {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');
  return await fetch(path, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data),
  });
}

export default App;
