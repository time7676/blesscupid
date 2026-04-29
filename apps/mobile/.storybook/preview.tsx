import type { Preview } from '@storybook/react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { color, space } from '../src/lib/design-system/tokens.js';

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    backgroundColor: color.parchment.default,
    padding: space.s6,
    gap: space.s5,
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <SafeAreaProvider>
        <View style={styles.frame}>{Story()}</View>
      </SafeAreaProvider>
    ),
  ],
};

export default preview;
