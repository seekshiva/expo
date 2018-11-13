import { AppAuth, Google } from 'expo';
import React from 'react';
import { Alert, AsyncStorage, Button, StyleSheet, Text, View } from 'react-native';

const GUID = '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9';
const config = {
  issuer: 'https://accounts.google.com',
  clientId: `${GUID}.apps.googleusercontent.com`,
  scopes: ['openid', 'profile'],
};

const StorageKey = '@Storage:Key';

async function signInAsync() {
  const authState = await AppAuth.authorizeAsync(config);
  await cacheAuthAsync(authState);
  console.log('signInAsync', authState);
  return authState;
}

async function refreshAuthAsync({ refreshToken }) {
  const authState = await AppAuth.refreshAsync(config, refreshToken);
  console.log('refresh', authState);
  await cacheAuthAsync(authState);
  return authState;
}

async function getCachedAuthAsync() {
  const value = await AsyncStorage.getItem(StorageKey);
  const authState = JSON.parse(value);
  console.log('getCachedAuthAsync', authState);
  if (authState) {
    if (checkIfTokenExpired(authState)) {
      return refreshAuthAsync(authState);
    } else {
      return authState;
    }
  }
}

function cacheAuthAsync(authState) {
  return AsyncStorage.setItem(StorageKey, JSON.stringify(authState));
}

function checkIfTokenExpired({ accessTokenExpirationDate }) {
  return new Date(accessTokenExpirationDate) < new Date();
}

async function signOutAsync({ accessToken }) {
  try {
    await AppAuth.revokeAsync(config, {
      token: accessToken,
      isClientIdProvided: true,
    });
    await AsyncStorage.removeItem(StorageKey);
    return null;
  } catch (error) {
    alert('Failed to revoke token: ' + error.message);
  }
}

export default class AuthSessionScreen extends React.Component {
  static navigationOptions = {
    title: 'AuthSession',
  };

  state = {};

  componentDidMount() {
    this._getAuthAsync();
  }

  _getAuth = async () => {
    try {
      const authState = await getCachedAuthAsync();
      this.setState({ authState });
    } catch ({ message }) {
      alert(message);
    }
  };

  _testGoogleLogin = async () => {
    try {
      const result = await Google.logInAsync({
        behavior: 'web',
        androidStandaloneAppClientId:
          '603386649315-87mbvgc739sec2gjtptl701ha62pi98p.apps.googleusercontent.com',
        androidClientId: '603386649315-9rbv8vmv2vvftetfbvlrbufcps1fajqf.apps.googleusercontent.com',
        iosStandaloneAppClientId:
          '603386649315-1b2o2gole94qc6h4prj6lvoiueq83se4.apps.googleusercontent.com',
        iosClientId: '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
      });

      const { type } = result;

      if (type === 'success') {
        // Avoid race condition with the WebView hiding when using web-based sign in
        setTimeout(() => {
          Alert.alert('Logged in!', JSON.stringify(result), [
            {
              text: 'OK!',
              onPress: () => {
                console.log({ result });
              },
            },
          ]);
        }, 1000);
      }
    } catch (e) {
      Alert.alert('Error! ' + e.message, [{ text: 'OK :(', onPress: () => {} }]);
    }
  };

  toggleAuth = async () => {
    try {
      if (this.state.authState) {
        await signOutAsync(this.state.authState);
        this.setState({ authState: null });
      } else {
        const authState = await signInAsync();
        this.setState({ authState });
      }
    } catch ({ message }) {
      alert(message);
    }
  };

  get hasAuth() {
    return this.state.authState;
  }
  render() {
    const title = this.hasAuth ? 'Sign out' : 'Sign in';
    return (
      <View style={styles.container}>
        <Button title={title} onPress={this.toggleAuth} />
        {this.hasAuth ? (
          <Text style={styles.text}>Result: {JSON.stringify(this.state.authState)}</Text>
        ) : null}

        <Button title={'Google'} onPress={this._testGoogleLogin} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginVertical: 15,
    marginHorizontal: 10,
  },
  faintText: {
    color: '#888',
    marginHorizontal: 30,
  },
  oopsTitle: {
    fontSize: 25,
    marginBottom: 5,
    textAlign: 'center',
  },
  oopsText: {
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 30,
  },
});