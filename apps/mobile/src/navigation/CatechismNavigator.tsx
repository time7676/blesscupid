import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatechismBeat1Tagline } from '../screens/catechism/Beat1Tagline.js';
import { CatechismBeat2Modes } from '../screens/catechism/Beat2Modes.js';
import { CatechismBeat3Preview } from '../screens/catechism/Beat3Preview.js';
import { CatechismBeat4Full } from '../screens/catechism/Beat4Full.js';
import { CatechismBeat5Photo } from '../screens/catechism/Beat5Photo.js';
import { CatechismBeat6Faith } from '../screens/catechism/Beat6Faith.js';
import { CatechismBeat7Timeline } from '../screens/catechism/Beat7Timeline.js';
import { CatechismBeat8Welcome } from '../screens/catechism/Beat8Welcome.js';
import type { CatechismStackParamList } from './types.js';

const Stack = createNativeStackNavigator<CatechismStackParamList>();

export function CatechismNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="CatechismBeat1Tagline"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDFBF6' } }}
    >
      <Stack.Screen name="CatechismBeat1Tagline" component={CatechismBeat1Tagline} />
      <Stack.Screen name="CatechismBeat2Modes" component={CatechismBeat2Modes} />
      <Stack.Screen name="CatechismBeat3Preview" component={CatechismBeat3Preview} />
      <Stack.Screen name="CatechismBeat4Full" component={CatechismBeat4Full} />
      <Stack.Screen name="CatechismBeat5Photo" component={CatechismBeat5Photo} />
      <Stack.Screen name="CatechismBeat6Faith" component={CatechismBeat6Faith} />
      <Stack.Screen name="CatechismBeat7Timeline" component={CatechismBeat7Timeline} />
      <Stack.Screen name="CatechismBeat8Welcome" component={CatechismBeat8Welcome} />
    </Stack.Navigator>
  );
}
