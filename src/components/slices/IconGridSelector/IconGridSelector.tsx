/**
 * IconGridSelector Component
 * Grid-based icon selector for body type and similar attributes
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Text } from '../Text';
import { useTheme, Theme } from '../../../theme';
import { CAR_TYPE_IMAGES } from './carTypeImages';

export interface IconGridOption {
  key: string;
  label: string;
  count?: number;
}

export interface IconGridSelectorProps {
  /** Currently selected keys */
  selected: string[];
  /** Callback when selection changes */
  onChange: (selected: string[]) => void;
  /** Options to display */
  options: IconGridOption[];
  /** Type of icons to show (currently only 'car-types' supported) */
  iconType?: 'car-types';
  /** Size of the icon */
  iconSize?: number;
  /** Whether to show counts */
  showCounts?: boolean;
  /** Whether this is single select (max 1 selection) */
  singleSelect?: boolean;
}

export const IconGridSelector: React.FC<IconGridSelectorProps> = ({
  selected = [],
  onChange,
  options,
  iconType = 'car-types',
  iconSize = 36,
  showCounts = true,
  singleSelect = false,
}) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const selectedArray = Array.isArray(selected) ? selected : [];

  const isSelected = (key: string) => selectedArray.includes(key);
  const isEmpty = (count?: number) => count === 0;

  const handleToggle = (key: string) => {
    let newSelected: string[];

    if (singleSelect) {
      // Single select mode - toggle on/off
      newSelected = isSelected(key) ? [] : [key];
    } else {
      // Multi select mode
      if (isSelected(key)) {
        newSelected = selectedArray.filter((k) => k !== key);
      } else {
        newSelected = [...selectedArray, key];
      }
    }

    onChange(newSelected);
  };

  const getImageSource = (key: string) => {
    if (iconType === 'car-types') {
      return CAR_TYPE_IMAGES[key] || null;
    }
    return null;
  };

  const getIconColor = (optionSelected: boolean, optionEmpty: boolean) => {
    if (optionSelected) return theme.colors.primary;
    if (optionEmpty) return theme.colors.border;
    return theme.colors.textSecondary;
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {options.map((option) => {
          const imageSource = getImageSource(option.key);
          const optionSelected = isSelected(option.key);
          const optionEmpty = isEmpty(option.count);

          return (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.option,
                optionSelected && styles.optionSelected,
                optionEmpty && styles.optionEmpty,
              ]}
              onPress={() => !optionEmpty && handleToggle(option.key)}
              disabled={optionEmpty}
              activeOpacity={0.7}
            >
              {imageSource && (
                <View style={styles.iconContainer}>
                  <Image
                    source={imageSource}
                    style={[
                      styles.icon,
                      { width: iconSize, height: iconSize },
                      { tintColor: getIconColor(optionSelected, optionEmpty) },
                    ]}
                    resizeMode="contain"
                  />
                </View>
              )}
              <Text
                variant="xs"
                color={optionEmpty ? 'muted' : optionSelected ? 'primary' : undefined}
                style={[styles.label, optionSelected && styles.labelSelected]}
              >
                {option.label}
              </Text>
              {showCounts && option.count !== undefined && (
                <Text variant="xs" color="secondary" style={styles.count}>
                  ({option.count})
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
    },
    option: {
      width: '30%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      borderWidth: 2,
      borderColor: theme.colors.border,
      padding: theme.spacing.sm,
    },
    optionSelected: {
      borderColor: theme.colors.primary,
    },
    optionEmpty: {
      opacity: 0.4,
    },
    iconContainer: {
      marginBottom: theme.spacing.xs,
    },
    icon: {
      // tintColor applied dynamically
    },
    label: {
      textAlign: 'center',
      fontWeight: '500',
    },
    labelSelected: {
      fontWeight: '600',
    },
    count: {
      marginTop: 2,
    },
  });

export default IconGridSelector;
