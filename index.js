/**
 * @format
 */

// Gesture Handler must be imported at the very top of the entry file.
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
