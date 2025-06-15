import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Typed Redux hooks for better TypeScript integration
 * 
 * Instead of using plain useDispatch and useSelector,
 * use these typed versions throughout the app for better type safety.
 */

// Use throughout app instead of plain useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Use throughout app instead of plain useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;