# SAHA Business Suite

## Current State
All app data (pendingDeliveries, completeDeliveries, vehicles, rates) is stored in React useState only. Data is lost on page refresh.

## Requested Changes (Diff)

### Add
- localStorage persistence for all 4 data stores: pendingDeliveries, completeDeliveries, vehicles, rates
- Custom useLocalStorage hook that reads initial value from localStorage and writes on every change

### Modify
- App.tsx: replace useState with localStorage-backed state for pendingDeliveries, completeDeliveries, vehicles, rates

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/hooks/useLocalStorage.ts` — generic hook that syncs state to localStorage
2. Update App.tsx to use useLocalStorage for all 4 data arrays/objects
3. Ensure existing data shape is preserved (no migration needed since app is fresh)
