/**
 * CarInspection Component for Mobile
 * Allows users to mark body damage on a car diagram
 * 5 views: front, back, left, right, top
 * 13 parts with 3 damage types: spot_paint, paint, replaced
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
  ImageSourcePropType,
} from 'react-native';
import { Asset } from 'expo-asset';
import { Plus, AlertTriangle, X, Check } from 'lucide-react-native';
import { useTheme, Theme } from '../../theme';
import { Text } from '../slices';

type ViewType = 'front' | 'back' | 'left' | 'right' | 'top';

// Damage types - 3 options
export const DAMAGE_TYPES = [
  { value: 'spot_paint', label: 'دهان موضعي', color: '#3D5CB6' },  // Primary (minor)
  { value: 'paint', label: 'دهان كامل', color: '#F59E0B' },        // Orange/warning
  { value: 'replaced', label: 'مُستبدل', color: '#3B82F6' },       // Blue (severe)
] as const;

type DamageType = typeof DAMAGE_TYPES[number]['value'];

// Car parts with percentage positions for each view
export const CAR_PARTS = {
  // Front & Back - single point each
  front: { label: 'الأمام', x: 50, y: 50, view: 'front' as ViewType, sortOrder: 1 },
  back: { label: 'الخلف', x: 50, y: 50, view: 'back' as ViewType, sortOrder: 2 },

  // Left side - 4 points VERTICAL
  left_front: { label: 'الرفرف الأمامي الأيسر', x: 50, y: 12, view: 'left' as ViewType, sortOrder: 3 },
  left_front_door: { label: 'الباب الأمامي الأيسر', x: 50, y: 37, view: 'left' as ViewType, sortOrder: 4 },
  left_rear_door: { label: 'الباب الخلفي الأيسر', x: 50, y: 63, view: 'left' as ViewType, sortOrder: 5 },
  left_rear: { label: 'الرفرف الخلفي الأيسر', x: 50, y: 88, view: 'left' as ViewType, sortOrder: 6 },

  // Right side - 4 points VERTICAL
  right_front: { label: 'الرفرف الأمامي الأيمن', x: 50, y: 12, view: 'right' as ViewType, sortOrder: 7 },
  right_front_door: { label: 'الباب الأمامي الأيمن', x: 50, y: 37, view: 'right' as ViewType, sortOrder: 8 },
  right_rear_door: { label: 'الباب الخلفي الأيمن', x: 50, y: 63, view: 'right' as ViewType, sortOrder: 9 },
  right_rear: { label: 'الرفرف الخلفي الأيمن', x: 50, y: 88, view: 'right' as ViewType, sortOrder: 10 },

  // Top - 3 points VERTICAL
  hood: { label: 'غطاء المحرك', x: 50, y: 15, view: 'top' as ViewType, sortOrder: 11 },
  roof: { label: 'سقف السيارة', x: 50, y: 50, view: 'top' as ViewType, sortOrder: 12 },
  trunk: { label: 'الصندوق', x: 50, y: 85, view: 'top' as ViewType, sortOrder: 13 },
} as const;

type CarPart = keyof typeof CAR_PARTS;

export interface DamageReport {
  part: CarPart;
  damageType: DamageType;
}

// Images - require() for React Native bundler
const CAR_IMAGE_MODULES = {
  front: require('../../../assets/images/car-inspection/front.png'),
  back: require('../../../assets/images/car-inspection/back.png'),
  left: require('../../../assets/images/car-inspection/left.png'),
  right: require('../../../assets/images/car-inspection/right.png'),
  top: require('../../../assets/images/car-inspection/top.png'),
};

// Preload images on module load for production builds
Asset.loadAsync([
  CAR_IMAGE_MODULES.front,
  CAR_IMAGE_MODULES.back,
  CAR_IMAGE_MODULES.left,
  CAR_IMAGE_MODULES.right,
  CAR_IMAGE_MODULES.top,
]).catch(() => {
  // Silent fail - images will still load on demand
});

/**
 * Convert backend format (string array) to frontend format (DamageReport array)
 * Backend stores: ["front_paint", "left_front_door_replaced", ...]
 * Frontend uses: [{ part: "front", damageType: "paint" }, ...]
 */
export function fromBackendFormat(backendValue: string[] | undefined | null): DamageReport[] {
  if (!backendValue || !Array.isArray(backendValue)) return [];

  const validParts = Object.keys(CAR_PARTS) as CarPart[];
  const validDamageTypes = DAMAGE_TYPES.map(d => d.value);

  return backendValue
    .map(key => {
      const damageType = validDamageTypes.find(dt => key.endsWith(`_${dt}`));
      if (!damageType) return null;

      const partKey = key.slice(0, -(damageType.length + 1));
      if (!validParts.includes(partKey as CarPart)) return null;

      return { part: partKey as CarPart, damageType };
    })
    .filter((item): item is DamageReport => item !== null);
}

/**
 * Convert frontend format (DamageReport array) to backend format (string array)
 */
export function toBackendFormat(damages: DamageReport[]): string[] {
  return damages.map(d => `${d.part}_${d.damageType}`);
}

interface CarInspectionProps {
  value?: DamageReport[];
  onChange?: (damages: DamageReport[]) => void;
  disabled?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CarInspection: React.FC<CarInspectionProps> = ({
  value = [],
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();
  const isRTL = theme.isRTL;
  const styles = useMemo(() => createStyles(theme, isRTL), [theme, isRTL]);

  const [selectedPart, setSelectedPart] = useState<CarPart | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const views: { id: ViewType; label: string }[] = [
    { id: 'front', label: 'أمام' },
    { id: 'back', label: 'خلف' },
    { id: 'left', label: 'يسار' },
    { id: 'right', label: 'يمين' },
    { id: 'top', label: 'أعلى' },
  ];

  const getPartsForView = (view: ViewType) => {
    return Object.entries(CAR_PARTS)
      .filter(([_, part]) => part.view === view)
      .map(([key, part]) => ({ key: key as CarPart, ...part }));
  };

  const getDamageForPart = (part: CarPart): DamageReport | undefined => {
    return value.find(d => d.part === part);
  };

  const handlePartPress = (part: CarPart) => {
    if (disabled) return;
    setSelectedPart(part);
    setModalVisible(true);
  };

  const handleDamageSelect = (damageType: DamageType) => {
    if (!selectedPart || !onChange) return;

    const existingIndex = value.findIndex(d => d.part === selectedPart);
    const newDamage: DamageReport = { part: selectedPart, damageType };

    if (existingIndex >= 0) {
      const newValue = [...value];
      newValue[existingIndex] = newDamage;
      onChange(newValue);
    } else {
      onChange([...value, newDamage]);
    }
    setModalVisible(false);
    setSelectedPart(null);
  };

  const handleRemoveDamage = () => {
    if (!selectedPart || !onChange) return;
    onChange(value.filter(d => d.part !== selectedPart));
    setModalVisible(false);
    setSelectedPart(null);
  };

  const getDamageColor = (damageType: DamageType) => {
    return DAMAGE_TYPES.find(d => d.value === damageType)?.color || theme.colors.primary;
  };

  const renderView = (viewId: ViewType) => {
    const view = views.find(v => v.id === viewId)!;

    return (
      <View style={styles.viewCard}>
        <Text variant="small" style={styles.viewLabel}>{view.label}</Text>
        <View style={styles.viewImageContainer}>
          <Image source={CAR_IMAGE_MODULES[viewId]} style={styles.viewImage} resizeMode="contain" />
          {getPartsForView(viewId).map(part => {
            const damage = getDamageForPart(part.key);
            const damageColor = damage ? getDamageColor(damage.damageType) : undefined;

            return (
              <TouchableOpacity
                key={part.key}
                style={[
                  styles.hotspot,
                  { left: `${part.x}%`, top: `${part.y}%` },
                  damage && { backgroundColor: damageColor, borderColor: damageColor },
                ]}
                onPress={() => handlePartPress(part.key)}
                disabled={disabled}
              >
                {damage ? (
                  <AlertTriangle size={16} color="#fff" />
                ) : (
                  <Plus size={16} color={theme.colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const selectedPartData = selectedPart ? CAR_PARTS[selectedPart] : null;
  const existingDamage = selectedPart ? getDamageForPart(selectedPart) : null;

  return (
    <View style={styles.container}>
      {/* Views Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewsScroll}>
        <View style={styles.viewsRow}>
          {renderView('right')}
          {renderView('top')}
          {renderView('left')}
        </View>
      </ScrollView>

      <View style={styles.bottomViews}>
        {renderView('front')}
        {renderView('back')}
      </View>

      {/* Summary */}
      {value.length > 0 ? (
        <View style={styles.summary}>
          <Text variant="body" style={styles.summaryTitle}>ملخص الأضرار:</Text>
          {(['front', 'back', 'left', 'right', 'top'] as ViewType[]).map(viewType => {
            const viewDamages = value
              .filter(d => CAR_PARTS[d.part].view === viewType)
              .sort((a, b) => CAR_PARTS[a.part].sortOrder - CAR_PARTS[b.part].sortOrder);

            if (viewDamages.length === 0) return null;

            const viewLabels: Record<ViewType, string> = {
              front: 'الأمام',
              back: 'الخلف',
              left: 'الجانب الأيسر',
              right: 'الجانب الأيمن',
              top: 'الأعلى',
            };

            return (
              <View key={viewType} style={styles.summaryGroup}>
                <Text variant="small" color="secondary">{viewLabels[viewType]}:</Text>
                <View style={styles.summaryItems}>
                  {viewDamages.map(d => {
                    const damageInfo = DAMAGE_TYPES.find(dt => dt.value === d.damageType);
                    return (
                      <View
                        key={d.part}
                        style={[styles.summaryItem, { borderColor: damageInfo?.color }]}
                      >
                        <Text variant="xs">
                          {CAR_PARTS[d.part].label}: {damageInfo?.label}
                        </Text>
                        {!disabled && (
                          <TouchableOpacity
                            onPress={() => onChange?.(value.filter(v => v.part !== d.part))}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <X size={12} color={theme.colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.noIssues, { backgroundColor: theme.colors.successLight }]}>
          <Check size={16} color={theme.colors.success} />
          <Text variant="small" style={{ color: theme.colors.success }}>لا توجد ملاحظات</Text>
        </View>
      )}

      {/* Damage Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text variant="h4">{selectedPartData?.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text variant="paragraph" color="secondary" style={styles.modalSubtitle}>
              اختر نوع الضرر:
            </Text>

            <View style={styles.damageOptions}>
              {DAMAGE_TYPES.map(d => (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    styles.damageOption,
                    { borderColor: d.color },
                    existingDamage?.damageType === d.value && { backgroundColor: d.color },
                  ]}
                  onPress={() => handleDamageSelect(d.value)}
                >
                  <Text
                    variant="body"
                    style={{
                      color: existingDamage?.damageType === d.value ? '#fff' : d.color,
                    }}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {existingDamage && (
              <TouchableOpacity
                style={[styles.removeButton, { borderColor: theme.colors.error }]}
                onPress={handleRemoveDamage}
              >
                <Text variant="body" style={{ color: theme.colors.error }}>
                  إزالة الضرر
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (theme: Theme, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      gap: theme.spacing.md,
    },
    viewsScroll: {
      flexGrow: 0,
    },
    viewsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: theme.spacing.sm,
      paddingStart: theme.spacing.xs,
      paddingEnd: theme.spacing.xs,
    },
    bottomViews: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'center',
      gap: theme.spacing.md,
    },
    viewCard: {
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    viewLabel: {
      textAlign: 'center',
    },
    viewImageContainer: {
      width: (SCREEN_WIDTH - 80) / 3,
      height: (SCREEN_WIDTH - 80) / 3 * 1.5,
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      overflow: 'hidden',
      position: 'relative',
    },
    viewImage: {
      width: '100%',
      height: '100%',
    },
    hotspot: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -16,
      marginTop: -16,
    },
    summary: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    summaryTitle: {
      marginBottom: theme.spacing.xs,
    },
    summaryGroup: {
      gap: theme.spacing.xs,
    },
    summaryItems: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    summaryItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingStart: theme.spacing.sm,
      paddingEnd: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.radius.full,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
    },
    noIssues: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.lg,
    },
    modalContent: {
      width: '100%',
      maxWidth: 340,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    modalHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalSubtitle: {
    },
    damageOptions: {
      gap: theme.spacing.sm,
    },
    damageOption: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 2,
      alignItems: 'center',
    },
    removeButton: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
  });

export default CarInspection;
