'use client';

// Product CTA Cards (spec 009, US2) — first-load capture of `?pr=` codes.
// Mounted in the root layout so any entry page (landing, assessment, deep link)
// captures campaign codes the moment it loads, before the user proceeds.
// Renders nothing.
import { useEffect } from 'react';
import { capturePrCodes } from '@/lib/products/capture';

export function PromoCapture() {
  useEffect(() => {
    capturePrCodes();
  }, []);
  return null;
}
