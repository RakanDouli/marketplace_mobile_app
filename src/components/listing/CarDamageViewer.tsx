/**
 * CarDamageViewer Component
 * View-only display of car damage/inspection report
 * Shows all 5 car views at once (matches web frontend layout)
 * Top row: Right, Top, Left
 * Bottom row: Front, Back
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { AlertTriangle, Check } from 'lucide-react-native';
import { Text } from '../slices/Text';
import { useTheme, Theme } from '../../theme';

// Import car images
const carImages = {
  front: require('../../../assets/images/car-inspection/front.png'),
  back: require('../../../assets/images/car-inspection/back.png'),
  left: require('../../../assets/images/car-inspection/left.png'),
  right: require('../../../assets/images/car-inspection/right.png'),
  top: require('../../../assets/images/car-inspection/top.png'),
};

type ViewType = 'front' | 'back' | 'left' | 'right' | 'top';

// Damage types with colors
export const DAMAGE_TYPES = {
  spot_paint: { label: 'دهان موضعي', color: '#10B981' },  // Green (minor)
  paint: { label: 'دهان كامل', color: '#F59E0B' },        // Amber
  replaced: { label: 'مُستبدل', color: '#3B82F6' },       // Blue (severe)
} as const;

type DamageType = keyof typeof DAMAGE_TYPES;

// Car parts with percentage positions for each view
export const CAR_PARTS = {
  // Front & Back - single point each
  front: { label: 'الأمام', x: 50, y: 50, view: 'front' as ViewType },
  back: { label: 'الخلف', x: 50, y: 50, view: 'back' as ViewType },

  // Left side - 4 points VERTICAL
  left_front: { label: 'الرفرف الأمامي الأيسر', x: 50, y: 12, view: 'left' as ViewType },
  left_front_door: { label: 'الباب الأمامي الأيسر', x: 50, y: 37, view: 'left' as ViewType },
  left_rear_door: { label: 'الباب الخلفي الأيسر', x: 50, y: 63, view: 'left' as ViewType },
  left_rear: { label: 'الرفرف الخلفي الأيسر', x: 50, y: 88, view: 'left' as ViewType },

  // Right side - 4 points VERTICAL
  right_front: { label: 'الرفرف الأمامي الأيمن', x: 50, y: 12, view: 'right' as ViewType },
  right_front_door: { label: 'الباب الأمامي الأيمن', x: 50, y: 37, view: 'right' as ViewType },
  right_rear_door: { label: 'الباب الخلفي الأيمن', x: 50, y: 63, view: 'right' as ViewType },
  right_rear: { label: 'الرفرف الخلفي الأيمن', x: 50, y: 88, view: 'right' as ViewType },

  // Top - 3 points VERTICAL
  hood: { label: 'غطاء المحرك', x: 50, y: 15, view: 'top' as ViewType },
  roof: { label: 'سقف السيارة', x: 50, y: 50, view: 'top' as ViewType },
  trunk: { label: 'الصندوق', x: 50, y: 85, view: 'top' as ViewType },
} as const;

type CarPart = keyof typeof CAR_PARTS;

export interface DamageReport {
  part: CarPart;
  damageType: DamageType;
}

/**
 * Convert backend format (string array) to frontend format (DamageReport array)
 * Backend stores: ["front_paint", "left_front_door_replaced", "hood_paint"]
 */
export function fromBackendFormat(backendValue: string[] | undefined | null): DamageReport[] {
  if (!backendValue || !Array.isArray(backendValue)) return [];

  const validParts = Object.keys(CAR_PARTS) as CarPart[];
  const validDamageTypes = Object.keys(DAMAGE_TYPES) as DamageType[];

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

const VIEW_LABELS: Record<ViewType, string> = {
  front: 'أمام',
  back: 'خلف',
  left: 'يسار',
  right: 'يمين',
  top: 'أعلى',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CarDamageViewerProps {
  damages: DamageReport[];
}

export function CarDamageViewer({ damages }: CarDamageViewerProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // Get parts for a specific view
  const getPartsForView = (view: ViewType) => {
    return Object.entries(CAR_PARTS)
      .filter(([_, part]) => part.view === view)
      .map(([key, part]) => ({ key: key as CarPart, ...part }));
  };

  // Get damage for a specific part
  const getDamageForPart = (part: CarPart): DamageReport | undefined => {
    return damages.find(d => d.part === part);
  };

  // Get damages for a specific view
  const getDamagesForView = (view: ViewType) => {
    return damages.filter(d => CAR_PARTS[d.part].view === view);
  };

  // Render a single view card
  const renderViewCard = (viewId: ViewType, style?: object) => {
    const parts = getPartsForView(viewId);

    return (
      <View style={[styles.viewCard, style]}>
        <Text variant="xs" color="muted" style={styles.viewLabel}>
          {VIEW_LABELS[viewId]}
        </Text>
        <View style={styles.viewImageContainer}>
          <Image
            source={carImages[viewId]}
            style={styles.viewImage}
            resizeMode="contain"
          />
          {parts.map(part => {
            const damage = getDamageForPart(part.key);
            if (!damage) return null;

            const damageInfo = DAMAGE_TYPES[damage.damageType];

            return (
              <View
                key={part.key}
                style={[
                  styles.hotspot,
                  {
                    left: `${part.x}%`,
                    top: `${part.y}%`,
                    backgroundColor: damageInfo.color,
                  },
                ]}
              >
                <AlertTriangle size={10} color="#FFFFFF" />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Render summary
  const renderSummary = () => {
    if (damages.length === 0) {
      return (
        <View style={styles.noIssues}>
          <Check size={18} color={theme.colors.success} />
          <Text variant="body" style={styles.noIssuesText}>
            لا توجد ملاحظات
          </Text>
        </View>
      );
    }

    const views: ViewType[] = ['front', 'back', 'left', 'right', 'top'];
    const viewLabels: Record<ViewType, string> = {
      front: 'الأمام',
      back: 'الخلف',
      left: 'الجانب الأيسر',
      right: 'الجانب الأيمن',
      top: 'الأعلى',
    };

    return (
      <View style={styles.summary}>
        {views.map(view => {
          const viewDamages = getDamagesForView(view);
          if (viewDamages.length === 0) return null;

          return (
            <View key={view} style={styles.summaryGroup}>
              <Text variant="small" bold style={styles.summaryGroupTitle}>
                {viewLabels[view]}
              </Text>
              <View style={styles.summaryItems}>
                {viewDamages.map(d => {
                  const damageInfo = DAMAGE_TYPES[d.damageType];
                  return (
                    <View
                      key={d.part}
                      style={[styles.summaryItem, { borderColor: damageInfo.color }]}
                    >
                      <View
                        style={[styles.summaryDot, { backgroundColor: damageInfo.color }]}
                      />
                      <Text variant="xs" style={styles.summaryText}>
                        {`${CAR_PARTS[d.part].label}: ${damageInfo.label}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top row: Left, Top, Right (car diagram is always same regardless of RTL/LTR) */}
      <View style={[styles.topRow, { flexDirection: 'row' }]}>
        {renderViewCard('left', [styles.sideView, { order: 1 }])}
        {renderViewCard('top', [styles.topView, { order: 2 }])}
        {renderViewCard('right', [styles.sideView, { order: 3 }])}
      </View>

      {/* Bottom row: Front, Back (fixed LTR order) */}
      <View style={[styles.bottomRow, { flexDirection: 'row' }]}>
        {renderViewCard('front', [styles.frontBackView, { order: 1 }])}
        {renderViewCard('back', [styles.frontBackView, { order: 2 }])}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(DAMAGE_TYPES).map(([key, value]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: value.color }]} />
            <Text variant="xs" color="secondary">{value.label}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      {renderSummary()}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
    },

    // Layout rows
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },

    // View cards
    viewCard: {
      backgroundColor: theme.colors.bg,
      borderRadius: theme.radius.md,
      padding: theme.spacing.xs,
      alignItems: 'center',
    },
    sideView: {
      flex: 1,
    },
    topView: {
      flex: 1.2,
    },
    frontBackView: {
      flex: 1,
      maxWidth: '45%',
    },
    viewLabel: {
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    viewImageContainer: {
      width: '100%',
      aspectRatio: 0.6,
      position: 'relative',
    },
    viewImage: {
      width: '100%',
      height: '100%',
    },

    // Hotspots
    hotspot: {
      position: 'absolute',
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -10,
      marginTop: -10,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },

    // Legend
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },

    // Summary
    summary: {
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    summaryGroup: {
      marginBottom: theme.spacing.sm,
    },
    summaryGroupTitle: {
      textAlign: 'right',
      marginBottom: theme.spacing.xs,
      color: theme.colors.text,
    },
    summaryItems: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    summaryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bg,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      gap: theme.spacing.xs,
    },
    summaryDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    summaryText: {
      color: theme.colors.text,
    },

    // No Issues
    noIssues: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      backgroundColor: `${theme.colors.success}20`,
      borderRadius: theme.radius.md,
      marginTop: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    noIssuesText: {
      color: theme.colors.success,
    },
  });

export default CarDamageViewer;
