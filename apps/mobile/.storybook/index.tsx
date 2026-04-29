import { view } from './storybook.requires.js';

const StorybookUIRoot = view.getStorybookUI({
  // Storybook RN 7.x persists last-viewed story across reloads via
  // AsyncStorage; we keep that behavior on so iterating on a story doesn't
  // require re-navigating after Fast Refresh.
  enableWebsockets: false,
  shouldPersistSelection: true,
});

export default StorybookUIRoot;
