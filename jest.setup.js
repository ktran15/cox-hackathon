// Jest setup — mock AsyncStorage so the persisted Zustand stores can hydrate
// during tests without a native module. The store logic runs synchronously in
// memory; persistence is fire-and-forget against this in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
