/** Demo data model of the document-workflow (EDO) module. Replaced by the real system's data once it is connected. */

export type EdoDocType = 'Kiruvchi' | 'Chiquvchi' | 'Ichki' | 'Buyruq';
export type EdoDocStatus = 'SIGN' | 'APPROVAL' | 'EXECUTION' | 'DONE' | 'REJECTED';
export type EdoRouteState = 'done' | 'current' | 'wait';

export interface EdoDocument {
  id: string;
  number: string;
  title: string;
  type: EdoDocType;
  status: EdoDocStatus;
  from: string;
  /** ISO date-time the document arrived. */
  date: string;
  due: string | null;
  unread: boolean;
  important: boolean;
  pages: number;
  heading: string;
  resolution: { author: string; text: string } | null;
  summary: string[];
  route: { who: string; state: EdoRouteState }[];
  files: { name: string; size: string }[];
}

export type EdoColumn = 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface EdoAssignment {
  id: string;
  title: string;
  source: 'Rahbar topshirigʻi' | 'Ish rejasi' | 'Shaxsiy';
  column: EdoColumn;
  due: string | null;
  who: string;
  stepsDone: number;
  stepsTotal: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  assignedBy: string | null;
  description: string;
}

export type EdoControlKind = 'assignment' | 'appeal' | 'payment';

export interface EdoControlRow {
  id: string;
  kind: EdoControlKind;
  title: string;
  sub: string;
  from: string;
  due: string;
  status: 'OVERDUE' | 'TODAY' | 'SOON' | 'PLANNED';
}

export interface EdoControl {
  discipline: {
    percent: number;
    onTime: number;
    total: number;
    deptAverage: number;
    previousMonth: number;
  };
  counters: { overdue: number; today: number; soon: number; planned: number };
  stages: { name: string; count: number; action: string }[];
  rows: EdoControlRow[];
  appeal: { number: string; due: string; received: string; applicant: string };
}

export interface EdoData {
  generatedAt: string;
  documents: EdoDocument[];
  assignments: EdoAssignment[];
  control: EdoControl;
}
