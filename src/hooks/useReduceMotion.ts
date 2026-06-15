import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// SPEC-NOTE: Section 2 says reduce motion is the OS setting OR the in-app
// toggle. The in-app toggle lives in settingsStore (Milestone 3); until then
// this hook reflects the OS setting only.

/** True when the OS asks for reduced motion. Animations must no-op when true. */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // If the OS query fails, keep animations on — they are enhancements only.
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
