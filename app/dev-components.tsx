import { Shirt } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  Card,
  EmptyState,
  GradeBadge,
  Hammie,
  ImpactStat,
  LevelPlant,
  PaperBackground,
  RouteChip,
  ScreenHeader,
  TornEdge,
} from '@/src/ui/components';
import { useTextSize, useType } from '@/src/ui/theme/TextSizeProvider';
import { color, spacing } from '@/src/ui/theme/tokens';
import type { TextSize } from '@/src/ui/theme/typography';

// Temporary design-system review route (Milestone 1).
// Deleted in Milestone 8 per the spec.

const textSizes: TextSize[] = ['normal', 'large', 'xlarge'];
const textSizeLabels: Record<TextSize, string> = {
  normal: 'Normal',
  large: 'Large',
  xlarge: 'Extra-large',
};

// Sample copy only — the real grade copy lives in the domain layer (Milestone 2).
const sampleGradeLabels = {
  A: 'Like new!',
  B: 'Gently worn',
  C: 'Still good, well-loved',
  D: 'Too worn to wear again',
} as const;

// Section headers carry color (5.8): ink title + a crayon underline swatch in
// a rotating classroom color, slightly tilted like a marker stroke.
function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  const headingType = useType('heading');
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleWrap}>
        <Text style={[headingType, styles.sectionTitle]}>{title}</Text>
        <View style={[styles.sectionUnderline, { backgroundColor: accent }]} />
      </View>
      {children}
    </View>
  );
}

// A full-bleed color-carrying divider (5.8): a strip of construction paper
// torn on both edges. Composed from TornEdge — the same way real screens will
// build header/impact band seams.
function TornDivider({ fill, seed }: { fill: string; seed: number }) {
  return (
    <View style={styles.divider}>
      <TornEdge color={fill} side="top" seed={seed} />
      <View style={[styles.dividerBody, { backgroundColor: fill }]} />
      <TornEdge color={fill} side="bottom" seed={seed + 1} />
    </View>
  );
}

export default function DevComponentsScreen() {
  const { textSize, setTextSize } = useTextSize();
  // Demo state for the LevelPlant growth moment (the spring pop only plays on
  // a level increase, so it needs a live trigger to review).
  const [demoLevel, setDemoLevel] = useState(1);
  // Hammie's one-shot motions (bounce/grow) replay when their playKey changes.
  const [bouncePlay, setBouncePlay] = useState(0);
  const [growPlay, setGrowPlay] = useState(0);
  const displayType = useType('display');
  const titleType = useType('title');
  const headingType = useType('heading');
  const bodyType = useType('body');
  const labelType = useType('label');
  const captionType = useType('caption');

  return (
    <PaperBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {/* Bold impact band (5.8): a big confident block of the anchor blue,
            torn along its bottom seam where it meets the cream. */}
        <View style={styles.heroBand}>
          <Text style={[displayType, styles.heroTitle]}>Hand-Me-Up</Text>
          <View style={styles.heroStats}>
            <ImpactStat value={1050} unit="L" label="Water saved" size="compact" tone="light" />
            <ImpactStat value={1.4} unit="kg" label="CO₂ saved" decimals={1} size="compact" tone="light" />
            <ImpactStat value={12} label="Items" size="compact" tone="light" />
          </View>
        </View>
        <TornEdge color={color.blue} side="bottom" seed={5} style={styles.heroTear} />

        <Section title="Text size (theme multiplier)" accent={color.sunshine}>
          <View style={styles.row}>
            {textSizes.map((size) => (
              <Button
                key={size}
                label={textSizeLabels[size]}
                variant={textSize === size ? 'primary' : 'secondary'}
                onPress={() => setTextSize(size)}
                style={styles.flexButton}
              />
            ))}
          </View>
        </Section>

        <Section title="Typography" accent={color.tomato}>
          <Text style={[displayType, styles.ink]}>Display 36</Text>
          <Text style={[titleType, styles.ink]}>Title 26 — Grandstander</Text>
          <Text style={[headingType, styles.ink]}>Heading 21</Text>
          <Text style={[bodyType, styles.ink]}>Body 18 — Nunito, line height 1.4</Text>
          <Text style={[labelType, styles.ink]}>Label 16</Text>
          <Text style={[captionType, styles.inkSoft]}>Caption 14 — secondary text</Text>
        </Section>

        <Section title="Button (paper press)" accent={color.grass}>
          <View style={styles.stack}>
            <Button label="Add a garment" onPress={() => undefined} pill />
            <Button label="Primary" onPress={() => undefined} />
            <Button label="Choose a different option" variant="secondary" onPress={() => undefined} />
            <Button label="Just save for now" variant="ghost" onPress={() => undefined} />
            <Button label="Disabled" onPress={() => undefined} disabled />
            <Button label="Loading" onPress={() => undefined} loading />
          </View>
        </Section>

        <TornDivider fill={color.sunshine} seed={11} />

        <Section title="Paper colors (white is one option)" accent={color.grape}>
          <View style={styles.cardPair}>
            <Card seed={1} style={styles.half}>
              <Text style={[headingType, styles.ink]}>White paper</Text>
              <Text style={[captionType, styles.inkSoft]}>For dense content.</Text>
            </Card>
            <Card seed={2} surface={color.blueSoft} style={styles.half}>
              <Text style={[headingType, styles.ink]}>Blue paper</Text>
              <Text style={[captionType, styles.ink]}>Soft fill, ink text.</Text>
            </Card>
          </View>
          <View style={[styles.cardPair, styles.cardPairSpacing]}>
            <Card seed={3} surface={color.squash} style={styles.half}>
              <Text style={[headingType, styles.ink]}>Squash paper</Text>
              <Text style={[captionType, styles.ink]}>Warm accent card.</Text>
            </Card>
            <Card seed={4} surface={color.pea} style={styles.half}>
              <Text style={[headingType, styles.ink]}>Pea paper</Text>
              <Text style={[captionType, styles.ink]}>Garden-fresh card.</Text>
            </Card>
          </View>
          <Card seed={5} surface={color.sunshine} style={styles.framingCard}>
            <Text style={[headingType, styles.ink]}>Bold framing card</Text>
            <Text style={[bodyType, styles.ink]}>
              Color lives in the framing; content stays readable in Ink.
            </Text>
          </Card>
        </Section>

        <Section title="ScreenHeader" accent={color.carrot}>
          <ScreenHeader
            title="Hi there!"
            subtitle="Grandstander title, Nunito subtitle."
            right={<RouteChip route="resell" />}
          />
        </Section>

        <Section title="GradeBadge (stickers)" accent={color.bubblegum}>
          <View style={styles.stack}>
            {(['A', 'B', 'C', 'D'] as const).map((grade) => (
              <GradeBadge key={grade} grade={grade} label={sampleGradeLabels[grade]} />
            ))}
            <GradeBadge grade="A" label="Like new!" size="large" />
          </View>
        </Section>

        <Section title="RouteChip (paper tags)" accent={color.seafoam}>
          <View style={styles.row}>
            <RouteChip route="resell" />
            <RouteChip route="donate" />
            <RouteChip route="recycle" />
          </View>
        </Section>

        <Section title="ImpactStat (on paper)" accent={color.blue}>
          <Card seed={6}>
            <View style={styles.statRow}>
              <ImpactStat value={1050} unit="L" label="Water saved" />
              <ImpactStat value={1.4} unit="kg" label="CO₂ saved" decimals={1} />
            </View>
            <View style={[styles.statRow, styles.statRowSpacing]}>
              <ImpactStat value={12} label="Items" size="compact" />
              <ImpactStat value={0.6} unit="kg" label="Diverted" size="compact" />
            </View>
          </Card>
        </Section>

        <TornDivider fill={color.grass} seed={29} />

        <Section title="LevelPlant (signature — first pass)" accent={color.pea}>
          <Card seed={7}>
            <View style={styles.plantRow}>
              <View style={styles.plantCell}>
                <LevelPlant level={1} size={92} />
                <Text style={[captionType, styles.plantLabel]}>Level 1</Text>
              </View>
              <View style={styles.plantCell}>
                <LevelPlant level={3} size={92} />
                <Text style={[captionType, styles.plantLabel]}>Level 3</Text>
              </View>
              <View style={styles.plantCell}>
                <LevelPlant level={6} size={92} />
                <Text style={[captionType, styles.plantLabel]}>Level 6</Text>
              </View>
            </View>
          </Card>
        </Section>

        <Section title="LevelPlant growth moment" accent={color.tomato}>
          <Card seed={8}>
            <View style={styles.plantCell}>
              <LevelPlant level={demoLevel} size={120} />
              <Text style={[captionType, styles.plantLabel]}>Level {demoLevel} of 6</Text>
            </View>
            <View style={[styles.row, styles.growActions]}>
              <Button
                label="Grow a level"
                onPress={() => setDemoLevel((l) => Math.min(6, l + 1))}
                disabled={demoLevel >= 6}
                style={styles.flexButton}
              />
              <Button
                label="Start over"
                variant="secondary"
                onPress={() => setDemoLevel(1)}
                style={styles.flexButton}
              />
            </View>
          </Card>
        </Section>

        <TornDivider fill={color.bubblegum} seed={41} />

        <Section title="Hammie — the mascot (sizes)" accent={color.blue}>
          <Card seed={10}>
            <View style={styles.junoRow}>
              <View style={styles.plantCell}>
                <Hammie size={40} growthStage={2} />
                <Text style={[captionType, styles.plantLabel]}>40 (icon)</Text>
              </View>
              <View style={styles.plantCell}>
                <Hammie size={72} growthStage={2} />
                <Text style={[captionType, styles.plantLabel]}>72</Text>
              </View>
              <View style={styles.plantCell}>
                <Hammie size={120} growthStage={2} />
                <Text style={[captionType, styles.plantLabel]}>120</Text>
              </View>
            </View>
          </Card>
        </Section>

        <Section title="Hammie — growth stages" accent={color.grass}>
          <Card seed={11}>
            <View style={styles.junoRow}>
              {([1, 2, 3] as const).map((stage) => (
                <View key={stage} style={styles.plantCell}>
                  <Hammie size={96} growthStage={stage} />
                  <Text style={[captionType, styles.plantLabel]}>Stage {stage}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>

        <Section title="Hammie — onesie color" accent={color.sunshine}>
          <Card seed={12}>
            <View style={styles.junoRow}>
              <View style={styles.plantCell}>
                <Hammie size={96} growthStage={3} onesieColor="blue" />
                <Text style={[captionType, styles.plantLabel]}>Gerber blue</Text>
              </View>
              <View style={styles.plantCell}>
                <Hammie size={96} growthStage={3} onesieColor="sunshine" />
                <Text style={[captionType, styles.plantLabel]}>Sunshine</Text>
              </View>
            </View>
          </Card>
        </Section>

        <Section title="Hammie — motion states" accent={color.tomato}>
          <Card seed={13}>
            <View style={styles.junoRow}>
              <View style={styles.plantCell}>
                <Hammie size={96} growthStage={2} motion="idle" />
                <Text style={[captionType, styles.plantLabel]}>Idle (calm sway)</Text>
              </View>
              <View style={styles.plantCell}>
                <Hammie size={96} growthStage={2} motion="bounce" playKey={bouncePlay} />
                <Text style={[captionType, styles.plantLabel]}>Bounce (routed)</Text>
              </View>
              <View style={styles.plantCell}>
                <Hammie size={96} growthStage={3} motion="grow" playKey={growPlay} />
                <Text style={[captionType, styles.plantLabel]}>Grow (one-shot pop)</Text>
              </View>
            </View>
            <View style={[styles.row, styles.growActions]}>
              <Button
                label="Replay bounce"
                onPress={() => setBouncePlay((n) => n + 1)}
                style={styles.flexButton}
              />
              <Button
                label="Replay grow"
                variant="secondary"
                onPress={() => setGrowPlay((n) => n + 1)}
                style={styles.flexButton}
              />
            </View>
            <Text style={[captionType, styles.inkSoft]}>
              All motion snaps to rest when reduce motion is on.
            </Text>
          </Card>
        </Section>

        <Section title="EmptyState" accent={color.grape}>
          <Card seed={9}>
            <EmptyState
              icon={<Shirt color={color.ink} size={40} strokeWidth={2.5} />}
              title="Your closet is empty"
              message="Scan your first outgrown outfit to get started."
              actionLabel="Add a garment"
              onAction={() => undefined}
            />
          </Card>
        </Section>
      </ScrollView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  heroBand: {
    backgroundColor: color.blue,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  heroTitle: {
    color: '#FFFFFF',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  heroTear: {
    // Overlap the band by a hairline so no cream seam shows through.
    marginTop: -1,
    marginBottom: spacing.xl,
  },
  divider: {
    marginBottom: spacing.xl,
  },
  dividerBody: {
    height: 10,
    // Overlap both torn edges so subpixel rounding never shows a cream line.
    marginVertical: -1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitleWrap: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: color.ink,
  },
  sectionUnderline: {
    width: 56,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    transform: [{ rotate: '-0.8deg' }],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  stack: {
    gap: spacing.lg,
  },
  flexButton: {
    flexGrow: 1,
    flexBasis: '30%',
  },
  cardPair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cardPairSpacing: {
    marginTop: spacing.md,
  },
  half: {
    flex: 1,
  },
  framingCard: {
    marginTop: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRowSpacing: {
    marginTop: spacing.md,
  },
  plantRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  junoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  plantCell: {
    alignItems: 'center',
  },
  plantLabel: {
    color: color.inkSoft,
    marginTop: spacing.xs,
  },
  growActions: {
    marginTop: spacing.lg,
  },
  ink: {
    color: color.ink,
  },
  inkSoft: {
    color: color.inkSoft,
  },
});
