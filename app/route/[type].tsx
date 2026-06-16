import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  Copy,
  ExternalLink,
  Heart,
  type LucideIcon,
  MapPin,
  Recycle as RecycleIcon,
  Share2,
  ShoppingBag,
  Store,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBadgeStats } from '@/src/data/selectors/profileSelectors';
import { buildListing } from '@/src/data/services/handoffService';
import { useBadgeStore } from '@/src/data/stores/badgeStore';
import { useClosetStore } from '@/src/data/stores/closetStore';
import { useScanStore } from '@/src/data/stores/scanStore';
import { BADGES } from '@/src/domain/constants';
import { routeCopy } from '@/src/domain/grading-rules';
import { computeSaving } from '@/src/domain/impact';
import type { Route, Saving } from '@/src/domain/types';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import {
  Button,
  Card,
  Celebration,
  EmptyState,
  ListingPreviewCard,
  PaperBackground,
} from '@/src/ui/components';
import { useType } from '@/src/ui/theme/TextSizeProvider';
import { color, outline, radius, routeColor, spacing, textOn } from '@/src/ui/theme/tokens';
import { fontFamily } from '@/src/ui/theme/typography';

// Route action (Section 7.6). One screen, three real modes. Resell builds a
// copy/shareable listing and opens eBay (no public prefill exists, so we copy
// the text and open the sell page — SPEC-NOTE below). Donate and Recycle hand
// off to live Google Maps searches (no seed data, no API key). Completing a
// route computes the saving, saves the garment, evaluates badges, and
// celebrates before returning to the closet. No impact math lives here.

function isRoute(value: string | undefined): value is Route {
  return value === 'resell' || value === 'donate' || value === 'recycle';
}

const badgeTitle = (id: string): string => BADGES.find((b) => b.id === id)?.title ?? id;

// Google Maps searches — real locations, no bundled seed (Section 7.6).
const MAPS = {
  resellShops: 'https://www.google.com/maps/search/kids+consignment+store+near+me',
  donationSpots: 'https://www.google.com/maps/search/children+clothing+donation+near+me',
  shelters: 'https://www.google.com/maps/search/children+shelter+clothing+near+me',
  recyclers: 'https://www.google.com/maps/search/textile+recycling+near+me',
  takeBack: 'https://www.google.com/maps/search/clothing+take+back+program+near+me',
} as const;

// SPEC-NOTE (Section 7.6 / engagement rule 6): eBay has no public "create
// listing with prefilled data" URL scheme. We do the documented fallback —
// copy the listing to the clipboard and open the eBay sell page.
const EBAY_SELL_URL = 'https://www.ebay.com/sell';

type ActionVariant = 'filled' | 'secondary' | 'disabled';

// A full-width Cut-Paper action button: crayon outline, paper-lift shadow, and
// a paper-press sink (instant, so it's fine under reduce-motion).
function ActionButton({
  label,
  Icon,
  onPress,
  variant = 'filled',
  fill = color.blue,
  accessibilityHint,
}: {
  label: string;
  Icon: LucideIcon;
  onPress?: () => void;
  variant?: ActionVariant;
  fill?: string;
  accessibilityHint?: string;
}) {
  const labelType = useType('label');
  const disabled = variant === 'disabled';
  const bg = variant === 'filled' ? fill : variant === 'secondary' ? color.card : color.paperDeep;
  const fg =
    variant === 'filled' ? textOn(fill) : variant === 'disabled' ? color.inkSoft : color.ink;
  const borderColor = disabled ? color.inkSoft : outline.color;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: bg, borderColor },
        !disabled && (pressed ? styles.actionPressed : outline.shadow),
        pressed && !disabled && styles.actionPressedNudge,
      ]}
    >
      <View style={styles.actionInner}>
        <Icon color={fg} size={20} strokeWidth={2.5} />
        <Text style={[labelType, styles.actionLabel, { color: fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export default function RouteActionScreen() {
  const router = useRouter();
  const { type: typeParam } = useLocalSearchParams<{ type: string }>();
  const result = useScanStore((s) => s.result);
  const resetScan = useScanStore((s) => s.reset);
  const addGarment = useClosetStore((s) => s.addGarment);
  const routeGarment = useClosetStore((s) => s.routeGarment);
  const reduceMotion = useReduceMotion();

  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState<Saving | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  // Lightweight toast for "Copied!" / the eBay fallback message.
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const titleType = useType('title');
  const headingType = useType('heading');
  const bodyType = useType('body');
  const labelType = useType('label');
  const captionType = useType('caption');

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (reduceMotion) {
        toastOpacity.setValue(1);
      } else {
        toastOpacity.setValue(0);
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
      toastTimer.current = setTimeout(() => {
        if (reduceMotion) {
          setToast(null);
        } else {
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }).start(() => setToast(null));
        }
      }, 2400);
    },
    [reduceMotion, toastOpacity],
  );

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const listing = useMemo(
    () =>
      result
        ? buildListing({ type: result.type, grade: result.grade, defects: result.defects })
        : null,
    [result],
  );

  // Unknown route param → friendly error with a way back (Section 6).
  if (!isRoute(typeParam)) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen}>
          <EmptyState
            title="That option isn’t available"
            message="Let’s head back and pick where this garment should go."
            actionLabel="Back to result"
            onAction={() => router.back()}
          />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  const route = typeParam;
  const copy = routeCopy[route];
  const tint = routeColor[route];

  // No scan to route (opened directly / already consumed).
  if (!result && !done) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen}>
          <EmptyState
            title="Nothing to route yet"
            message="Scan a garment first, then choose where it should go."
            actionLabel="Go to scan"
            onAction={() => router.dismissTo('/scan')}
          />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  const preview = result ? computeSaving(result.type, route, result.grade) : null;

  const copyListing = async () => {
    if (!listing) return;
    await Clipboard.setStringAsync(listing.text);
    showToast('Copied!');
  };

  const shareListing = async () => {
    if (!listing) return;
    try {
      await Share.share({ message: listing.text });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  const openEbay = async () => {
    if (listing) await Clipboard.setStringAsync(listing.text);
    showToast('Listing copied — paste it in eBay.');
    Linking.openURL(EBAY_SELL_URL).catch(() => undefined);
  };

  const openMaps = (url: string) => {
    Linking.openURL(url).catch(() => undefined);
  };

  const complete = () => {
    if (!result) return;
    const garment = addGarment({
      imageUri: result.imageUri,
      type: result.type,
      grade: result.grade,
      defects: result.defects,
    });
    routeGarment(garment.id, route);

    // Evaluate badges off the freshly updated closet. The donatedHighReuse flag
    // isn't knowable from a generic maps search, so it stays unset here.
    const stats = getBadgeStats(useClosetStore.getState().garments);
    const earned = useBadgeStore.getState().awardFromStats(stats);

    setSaving(useClosetStore.getState().getById(garment.id)?.saving ?? null);
    setNewBadges(earned);
    setDone(true);
    resetScan();
  };

  const backToCloset = () => router.dismissTo('/');

  // --- Success / celebration -------------------------------------------------
  if (done) {
    return (
      <PaperBackground>
        <SafeAreaView style={styles.screen} edges={['bottom']}>
          <View style={styles.successContent}>
            <View style={[styles.successBadge, outline.shadow, { backgroundColor: tint }]}>
              <Text
                style={[titleType, { color: textOn(tint), fontFamily: fontFamily.displayHeavy }]}
              >
                {copy.doneLabel}
              </Text>
            </View>

            {saving ? (
              <Card surface={color.cream} seed={2} style={styles.savingCard}>
                <Text style={[labelType, styles.savingLabel]}>You just saved</Text>
                <Text style={[headingType, styles.savingValue]}>
                  +{saving.waterL.toLocaleString()} L water
                </Text>
                <Text style={[headingType, styles.savingValue]}>+{saving.co2Kg} kg CO₂</Text>
              </Card>
            ) : null}

            {newBadges.length > 0 ? (
              <Card surface={color.sunshine} seed={7} style={styles.badgeCard}>
                <Text style={[labelType, { color: color.ink }]}>New badge unlocked</Text>
                {newBadges.map((id) => (
                  <Text key={id} style={[headingType, styles.badgeName]}>
                    {badgeTitle(id)}
                  </Text>
                ))}
              </Card>
            ) : null}

            <Button label="Back to closet" onPress={backToCloset} pill style={styles.successButton} />
          </View>
          <Celebration active={done} />
        </SafeAreaView>
      </PaperBackground>
    );
  }

  // --- Mode content ----------------------------------------------------------
  const subtitle =
    route === 'resell'
      ? copy.oneLiner
      : route === 'donate'
        ? 'We help you find places that actually put clothes on kids.'
        : 'Too worn to wear again, but its fibers can live on.';

  return (
    <PaperBackground>
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Bold route-colored header band (5.8). */}
          <View style={[styles.headerBand, { backgroundColor: tint }]}>
            <Text style={[titleType, { color: textOn(tint), fontFamily: fontFamily.display }]}>
              {copy.label}
            </Text>
            <Text style={[bodyType, { color: textOn(tint) }]}>{subtitle}</Text>
          </View>

          {preview ? (
            <Text style={[captionType, styles.previewNote]}>
              This will save about {preview.waterL.toLocaleString()} L of water and {preview.co2Kg}{' '}
              kg of CO₂.
            </Text>
          ) : null}

          {route === 'resell' && listing ? (
            <>
              <ListingPreviewCard listing={listing} />
              <View style={styles.actions}>
                <ActionButton label="Copy listing" Icon={Copy} variant="secondary" onPress={copyListing} />
                <ActionButton label="Share listing" Icon={Share2} variant="secondary" onPress={shareListing} />
                <ActionButton
                  label="Open eBay to sell"
                  Icon={ShoppingBag}
                  fill={routeColor.resell}
                  onPress={openEbay}
                  accessibilityHint="Copies your listing and opens eBay’s sell page"
                />
                <ActionButton
                  label="Facebook Marketplace — Coming soon"
                  Icon={Store}
                  variant="disabled"
                />
                <ActionButton
                  label="Find resell shops near me"
                  Icon={MapPin}
                  fill={color.blue}
                  onPress={() => openMaps(MAPS.resellShops)}
                />
              </View>
            </>
          ) : null}

          {route === 'donate' ? (
            <View style={styles.actions}>
              <View style={styles.actionGroup}>
                <ActionButton
                  label="Find donation spots near me"
                  Icon={MapPin}
                  fill={tint}
                  onPress={() => openMaps(MAPS.donationSpots)}
                />
                <Text style={[captionType, styles.actionDesc]}>
                  Goodwill, thrift stores, church drives.
                </Text>
              </View>
              <View style={styles.actionGroup}>
                <ActionButton
                  label="Find shelters near me"
                  Icon={Heart}
                  fill={tint}
                  onPress={() => openMaps(MAPS.shelters)}
                />
                <Text style={[captionType, styles.actionDesc]}>
                  Shelters and clothing closets that dress kids directly.
                </Text>
              </View>
            </View>
          ) : null}

          {route === 'recycle' ? (
            <View style={styles.actions}>
              <View style={styles.actionGroup}>
                <ActionButton
                  label="Find textile recyclers near me"
                  Icon={RecycleIcon}
                  fill={tint}
                  onPress={() => openMaps(MAPS.recyclers)}
                />
                <Text style={[captionType, styles.actionDesc]}>
                  Drop-off points that turn worn fabric into new fiber.
                </Text>
              </View>
              <View style={styles.actionGroup}>
                <ActionButton
                  label="Find retailer take-back near me"
                  Icon={ExternalLink}
                  fill={tint}
                  onPress={() => openMaps(MAPS.takeBack)}
                />
                <Text style={[captionType, styles.actionDesc]}>
                  Stores that collect old clothes for recycling.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.doneWrap}>
            <Text style={[captionType, styles.doneHint]}>
              Found a spot? Mark it done to add it to your closet.
            </Text>
            <Button
              label="Mark as done"
              onPress={complete}
              pill
              icon={<Check color="#FFFFFF" size={20} strokeWidth={2.5} />}
            />
          </View>
        </ScrollView>

        {toast ? (
          <Animated.View style={[styles.toastWrap, { opacity: toastOpacity }]} pointerEvents="none">
            <View style={[styles.toast, outline.shadow]}>
              <Text style={[labelType, styles.toastText]}>{toast}</Text>
            </View>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  headerBand: {
    borderRadius: radius.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    ...outline.shadow,
  },
  previewNote: { color: color.inkSoft, textAlign: 'center' },

  actions: { gap: spacing.md },
  actionGroup: { gap: spacing.xs },
  actionDesc: { color: color.inkSoft, paddingHorizontal: spacing.xs },

  action: {
    minHeight: 56,
    borderRadius: radius.button,
    borderWidth: outline.width,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionLabel: { textAlign: 'center' },
  actionPressed: {
    shadowColor: outline.shadow.shadowColor,
    shadowOpacity: outline.shadow.shadowOpacity,
    shadowRadius: 0,
    shadowOffset: { width: 1, height: 2 },
    elevation: 2,
  },
  actionPressedNudge: { transform: [{ translateY: 1 }] },

  doneWrap: { gap: spacing.sm, marginTop: spacing.sm },
  doneHint: { color: color.inkSoft, textAlign: 'center' },

  toastWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: color.ink,
    borderRadius: radius.chip,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  toastText: { color: '#FFFFFF' },

  successContent: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  successBadge: {
    borderRadius: radius.card,
    borderWidth: outline.width,
    borderColor: outline.color,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    transform: [{ rotate: '-1.5deg' }],
  },
  savingCard: { gap: spacing.xs, alignItems: 'center' },
  savingLabel: { color: color.inkSoft },
  savingValue: { color: color.ink },
  badgeCard: { gap: spacing.xs, alignItems: 'center' },
  badgeName: { color: color.ink },
  successButton: { alignSelf: 'stretch', marginTop: spacing.md },
});
