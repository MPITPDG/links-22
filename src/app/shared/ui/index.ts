export * from './cn';
export * from './button';
export * from './input';
export * from './card';
export * from './badge';
export * from './progress';
export * from './skeleton';
export * from './stat';
export * from './page-header';
export * from './breadcrumb';
export * from './toaster';
export * from './sheet';
export * from './steps';

import { UiButton } from './button';
import { UiInput, UiLabel, UiField } from './input';
import { UiCard, UiCardHeader } from './card';
import { UiBadge } from './badge';
import { UiProgress } from './progress';
import { UiSkeleton } from './skeleton';
import { UiStat } from './stat';
import { UiPageHeader } from './page-header';
import { UiSheet } from './sheet';
import { UiSteps } from './steps';
import { UiBreadcrumbs, UiBreadcrumbNav, UiBreadcrumbList, UiBreadcrumbItem, UiBreadcrumbLink, UiBreadcrumbPage, UiBreadcrumbSeparator } from './breadcrumb';

/** Import this array into any NgModule (or standalone component) to use the kit. */
export const UI_KIT = [
  UiButton, UiInput, UiLabel, UiField, UiCard, UiCardHeader, UiBadge, UiProgress, UiSkeleton, UiStat, UiPageHeader,
  UiBreadcrumbs, UiBreadcrumbNav, UiBreadcrumbList, UiBreadcrumbItem, UiBreadcrumbLink, UiBreadcrumbPage, UiBreadcrumbSeparator,
  UiSheet, UiSteps,
] as const;
