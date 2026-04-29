import type { StyleProp, ImageStyle } from 'react-native';
import { Image } from 'react-native';
import { color } from '../design-system/index.js';
import { glyphSource, type BrandGlyphName } from './assets.js';

export type BrandGlyphProps = {
  name: BrandGlyphName;
  size?: number;
  tintColor?: string;
  style?: StyleProp<ImageStyle>;
};

export function BrandGlyph({
  name,
  size = 20,
  tintColor = color.ink.soft,
  style,
}: BrandGlyphProps) {
  return (
    <Image
      source={glyphSource(name)}
      accessibilityIgnoresInvertColors
      style={[{ width: size, height: size, tintColor }, style]}
      resizeMode="contain"
    />
  );
}
