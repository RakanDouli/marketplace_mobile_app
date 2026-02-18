/**
 * Slices - Primitive UI Components
 * Reusable building blocks with no domain logic
 */

// Typography
export { Text } from './Text';
export type { TextProps, TextVariant, TextColor } from './Text';

// Media
export { Image } from './Image';
export type { ImageProps } from './Image';

// Buttons
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// Form Controls
export { Input } from './Input';
export type { InputProps } from './Input';

export { RangeInput } from './RangeInput';
export type { RangeInputProps, RangeOption } from './RangeInput';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

export { MultiSelect } from './MultiSelect';
export type { MultiSelectProps, MultiSelectOption } from './MultiSelect';

export { Form } from './Form';
export type { FormProps } from './Form';

export { IconGridSelector } from './IconGridSelector';
export type { IconGridOption, IconGridSelectorProps } from './IconGridSelector';

// Layout
export { Container } from './Container';
export type { ContainerProps } from './Container';

export { Grid } from './Grid';
export type { GridProps } from './Grid';

export { Collapsible } from './Collapsible';
export type { CollapsibleProps } from './Collapsible';

// Feedback
export { Loading } from './Loading';
export type { default as LoadingProps } from './Loading';

export { PlaceholderScreen } from './PlaceholderScreen';

// Content
export { BulletList } from './BulletList';
export type { BulletListProps } from './BulletList';

// Marketing/Promo
export { FeatureCard } from './FeatureCard';
export { PromoCard } from './PromoCard';
export { PromoBanner } from './PromoBanner';
