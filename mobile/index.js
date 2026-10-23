// Import Expo's helper that registers the root component with the native app.
import { registerRootComponent } from 'expo';

// Import the App component that contains the whole dashboard screen.
import App from './App';

// Register App as the first component React Native should render.
registerRootComponent(App);
