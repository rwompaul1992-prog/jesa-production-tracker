'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
    TableRow,
  TextField,
  InputBase,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import OpacityRounded from '@mui/icons-material/OpacityRounded';
import ScienceRounded from '@mui/icons-material/ScienceRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';
import CleaningServicesRounded from '@mui/icons-material/CleaningServicesRounded';
import LeaderboardRounded from '@mui/icons-material/LeaderboardRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import AssignmentTurnedInRounded from '@mui/icons-material/AssignmentTurnedInRounded';
import PendingRounded from '@mui/icons-material/PendingRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import BoltRounded from '@mui/icons-material/BoltRounded';
import FlagRounded from '@mui/icons-material/FlagRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import TimelineRounded from '@mui/icons-material/TimelineRounded';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { demoFreshMilkRecords, demoOperatorEntries, operators } from '@/app/data/demo-data';
import { FreshMilkWorkspace } from '@/app/components/fresh-milk-dashboard';
import {
  buildChartData,
  buildChemicalUsageByOperator,
  buildInsights,
  buildMonthlySummary,
  buildOperatorPerformance,
  buildOperatorRanking,
  getLossPercentage,
  getMilkLoss,
} from '@/app/lib/analytics';
import { AppUser, CipRecord, CipType, EntryStatus, FreshMilkDailyRecord, OperatorDailyEntry, OperatorPerformanceEntry, ProductionRecord, Shift } from '@/app/lib/types';

const shifts: Shift[] = ['Morning', 'Afternoon', 'Night'];
const cipTypes: CipType[] = ['Caustic wash', 'Caustic and Acid wash'];

type SectionKey =
  | 'dashboard'
  | 'intake'
  | 'cip'
  | 'operators'
  | 'operator-entry'
  | 'fresh-milk'
  | 'yoghurt-processing';

type KpiTone = 'good' | 'bad' | 'warning' | 'neutral';

type YoghurtProcessingDailyRecord = {
  id: string;
  date: string;
  operatorName: string;
  yoghurtMilkStdLitres: number;
  sugarKg: number;
  stabiliserKg: number;
  sourceGrams: number;
  freshQCulture: number;
  colourMl: number;
  flavourLitres: number;
  delvoFreshCulture: number;
};

type YoghurtProcessingDraft = {
  yoghurtMilkStdLitres: string;
  sugarKg: string;
  stabiliserKg: string;
  sourceGrams: string;
  freshQCulture: string;
  colourMl: string;
  flavourLitres: string;
  delvoFreshCulture: string;
};

const YOGHURT_OPERATORS = ['Semakula Francis', 'Opidi Lawrence'] as const;

const toneMap: Record<KpiTone, { accent: string; chip: 'success' | 'error' | 'warning' | 'primary' }> = {
  good: { accent: '#16a34a', chip: 'success' },
  bad: { accent: '#dc2626', chip: 'error' },
  warning: { accent: '#f59e0b', chip: 'warning' },
  neutral: { accent: '#2563eb', chip: 'primary' },
};

const adminSections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'dashboard', label: 'Executive control', description: 'Executive control center', icon: <DashboardRounded fontSize="small" /> },
  { key: 'intake', label: 'Production intelligence', description: 'Live production intelligence', icon: <LocalDrinkRounded fontSize="small" /> },
  { key: 'cip', label: 'Sanitation usage', description: 'CIP chemistry visibility', icon: <CleaningServicesRounded fontSize="small" /> },
  { key: 'operators', label: 'Operator ranking', description: 'Operator performance ranking', icon: <LeaderboardRounded fontSize="small" /> },
  { key: 'fresh-milk', label: 'Fresh milk ops', description: 'Pouch machine operations', icon: <AssignmentTurnedInRounded fontSize="small" /> },
  { key: 'yoghurt-processing', label: 'Yoghurt inputs', description: 'Yoghurt processing input usage', icon: <ScienceRounded fontSize="small" /> },
];

const pasteurizationOperatorSections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'operator-entry', label: 'Daily operator log', description: 'Production entry and CIP logging', icon: <AssignmentTurnedInRounded fontSize="small" /> },
];

const freshMilkOperatorSections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'fresh-milk', label: 'Fresh milk log', description: 'Pouch machine daily entry', icon: <AssignmentTurnedInRounded fontSize="small" /> },
];

const yoghurtOperatorSections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'yoghurt-processing', label: 'Yoghurt daily log', description: 'Daily yoghurt input entry', icon: <ScienceRounded fontSize="small" /> },
];

function createEmptyYoghurtRecord(operatorName: string, date: string): YoghurtProcessingDailyRecord {
  return {
    id: `yoghurt-${operatorName.toLowerCase().replace(/\s+/g, '-')}-${date}`,
    date,
    operatorName,
    yoghurtMilkStdLitres: 0,
    sugarKg: 0,
    stabiliserKg: 0,
    sourceGrams: 0,
    freshQCulture: 0,
    colourMl: 0,
    flavourLitres: 0,
    delvoFreshCulture: 0,
  };
}

function createYoghurtDraftFromRecord(record: YoghurtProcessingDailyRecord): YoghurtProcessingDraft {
  return {
    yoghurtMilkStdLitres: String(record.yoghurtMilkStdLitres),
    sugarKg: String(record.sugarKg),
    stabiliserKg: String(record.stabiliserKg),
    sourceGrams: String(record.sourceGrams),
    freshQCulture: String(record.freshQCulture),
    colourMl: String(record.colourMl),
    flavourLitres: String(record.flavourLitres),
    delvoFreshCulture: String(record.delvoFreshCulture),
  };
}

function getMonthlyYoghurtDays(
  monthKey: string,
  operatorName: string,
  records: YoghurtProcessingDailyRecord[],
): YoghurtProcessingDailyRecord[] {
  const start = dayjs(`${monthKey}-01`);
  const days = start.daysInMonth();

  return Array.from({ length: days }, (_, index) => {
    const date = start.date(index + 1).format('YYYY-MM-DD');
    const existing = records.find((record) => record.operatorName === operatorName && record.date === date);
    return existing ?? createEmptyYoghurtRecord(operatorName, date);
  });
}

function buildYoghurtMonthlyTotals(records: YoghurtProcessingDailyRecord[]) {
  return records.reduce(
    (acc, record) => {
      acc.yoghurtMilkStdLitres += record.yoghurtMilkStdLitres;
      acc.sugarKg += record.sugarKg;
      acc.stabiliserKg += record.stabiliserKg;
      acc.sourceGrams += record.sourceGrams;
      acc.freshQCulture += record.freshQCulture;
      acc.colourMl += record.colourMl;
      acc.flavourLitres += record.flavourLitres;
      acc.delvoFreshCulture += record.delvoFreshCulture;
      return acc;
    },
    {
      yoghurtMilkStdLitres: 0,
      sugarKg: 0,
      stabiliserKg: 0,
      sourceGrams: 0,
      freshQCulture: 0,
      colourMl: 0,
      flavourLitres: 0,
      delvoFreshCulture: 0,
    },
  );
}

function buildYoghurtTotalsByOperator(records: YoghurtProcessingDailyRecord[], monthKey: string) {
  const monthRecords = records.filter((record) => record.date.startsWith(monthKey));

  return YOGHURT_OPERATORS.map((operatorName) => {
    const operatorRecords = monthRecords.filter((record) => record.operatorName === operatorName);
    return {
      operatorName,
      ...buildYoghurtMonthlyTotals(operatorRecords),
    };
  });
}



const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
  tick: { fontSize: 10, fill: '#475569', fontWeight: 700 },
};

const chartGridProps = {
  stroke: 'rgba(71,85,105,0.16)',
  strokeDasharray: '2 5',
  vertical: false,
};

function getSectionAccent(title: string) {
  // EXECUTIVE / KPI
  if (/executive|control|summary/i.test(title)) {
    return {
      bar: '#1e3a8a', // deep blue
      bg: '#f0f4ff',
      border: '#c7d2fe',
      text: '#1e3a8a',
    };
  }

  // MILK RECONCILIATION
  if (/milk|reconciliation/i.test(title)) {
    return {
      bar: '#065f46', // deep green
      bg: '#ecfdf5',
      border: '#6ee7b7',
      text: '#065f46',
    };
  }

  // YOGHURT PROCESSING INPUTS
  if (/yoghurt|input/i.test(title)) {
    return {
      bar: '#7c2d12', // brown/orange
      bg: '#fff7ed',
      border: '#fdba74',
      text: '#7c2d12',
    };
  }

  // PRODUCTION / OUTPUT
  if (/production|pouch/i.test(title)) {
    return {
      bar: '#5b21b6', // purple
      bg: '#f5f3ff',
      border: '#c4b5fd',
      text: '#5b21b6',
    };
  }

  // YIELD / ANALYTICS
  if (/yield|analysis|performance/i.test(title)) {
    return {
      bar: '#92400e', // amber
      bg: '#fffbeb',
      border: '#fcd34d',
      text: '#92400e',
    };
  }

  // DEFAULT
  return {
    bar: '#334155',
    bg: '#f8fafc',
    border: '#cbd5f5',
    text: '#334155',
  };
}

function ChartTooltipCard({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <Paper
      sx={{
        p: 1,
        borderRadius: 1.5,
        border: '1px solid rgba(15,23,42,0.12)',
        minWidth: 160,
        background: 'rgba(255,255,255,0.99)',
        boxShadow: '0 10px 18px rgba(15,23,42,0.08)',
      }}
    >
      <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 900, letterSpacing: '0.06em' }}>
        {label}
      </Typography>
      <Stack spacing={0.65} sx={{ mt: 0.75 }}>
        {payload.map((item) => (
          <Stack key={item.name} direction="row" justifyContent="space-between" spacing={1.5}>
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: item.color ?? 'primary.main' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{item.name}</Typography>
            </Stack>
            <Typography variant="caption" fontWeight={900} color="text.primary">{Number(item.value ?? 0).toLocaleString()}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function getAvailableMonths(entries: OperatorDailyEntry[]) {
  return Array.from(new Set(entries.map((entry) => entry.date.slice(0, 7)))).sort();
}

function deriveProductionRecords(entries: OperatorDailyEntry[]): ProductionRecord[] {
  return entries.map((entry) => ({
    id: `prod-${entry.id}`,
    date: entry.date,
    offloadingShift: entry.offloadingShift,
    pasteurizationShift: entry.pasteurizationShift,
    offloadingOperator: entry.operatorName,
    pasteurizationOperator: entry.operatorName,
    totalMilkOffloaded: entry.milkOffloaded,
    totalMilkPasteurized: entry.milkPasteurized,
    remarks:
      entry.milkPasteurized > entry.milkOffloaded
        ? 'Possible meter variance flagged for review.'
        : entry.milkOffloaded - entry.milkPasteurized > 300
          ? 'Higher-than-normal milk loss observed.'
          : entry.cipDone
            ? 'Routine production and CIP record completed.'
            : 'Production completed; no CIP logged for this date.',
  }));
}

function deriveCipRecords(entries: OperatorDailyEntry[]): CipRecord[] {
  return entries
    .filter((entry) => entry.cipDone)
    .map((entry) => ({
      id: `cip-${entry.id}`,
      date: entry.date,
      operatorName: entry.operatorName,
      cipType: entry.cipType,
      chemicalUsed:
        entry.causticJerrycansUsed > 0 && entry.nitricJerrycansUsed > 0
          ? 'Both'
          : entry.nitricJerrycansUsed > 0
            ? 'Nitric Acid'
            : 'Caustic',
      causticJerrycansUsed: entry.causticJerrycansUsed,
      nitricAcidJerrycansUsed: entry.nitricJerrycansUsed,
    }));
}

function getMonthlyDays(monthKey: string, operatorName: string, entries: OperatorDailyEntry[]): OperatorDailyEntry[] {
  const start = dayjs(`${monthKey}-01`);
  const days = start.daysInMonth();

  return Array.from({ length: days }, (_, index) => {
    const date = start.date(index + 1).format('YYYY-MM-DD');
    const existing = entries.find((entry) => entry.operatorName === operatorName && entry.date === date);
    return (
      existing ?? {
        id: `${operatorName.toLowerCase().replace(/\s+/g, '-')}-${date}`,
        date,
        operatorName,
        offloadingShift: 'Morning' as Shift,
        pasteurizationShift: 'Afternoon' as Shift,
        milkOffloaded: 0,
        milkPasteurized: 0,
        cipDone: false,
        cipType: 'Caustic wash' as CipType,
        causticJerrycansUsed: 0,
        nitricJerrycansUsed: 0,
      }
    );
  });
}

function getEntryStatus(entry: OperatorDailyEntry, pendingIds: Set<string>, touchedIds: Set<string>): EntryStatus {
  const hasData =
    entry.milkOffloaded > 0 ||
    entry.milkPasteurized > 0 ||
    entry.causticJerrycansUsed > 0 ||
    entry.nitricJerrycansUsed > 0 ||
    entry.cipDone;

  if (!hasData && !touchedIds.has(entry.id)) return 'missing';
  if (pendingIds.has(entry.id)) return 'pending';
  return 'saved';
}

type OperatorEntryDraft = {
  offloadingShift: Shift;
  pasteurizationShift: Shift;
  milkOffloaded: string;
  milkPasteurized: string;
  cipDone: boolean;
  cipType: CipType;
  causticJerrycansUsed: string;
  nitricJerrycansUsed: string;
};

type OperatorEditableField =
  | 'offloadingShift'
  | 'pasteurizationShift'
  | 'milkOffloaded'
  | 'milkPasteurized'
  | 'cipDone'
  | 'cipType'
  | 'causticJerrycansUsed'
  | 'nitricJerrycansUsed';

const editableFieldOrder: OperatorEditableField[] = [
  'offloadingShift',
  'pasteurizationShift',
  'milkOffloaded',
  'milkPasteurized',
  'cipDone',
  'cipType',
  'causticJerrycansUsed',
  'nitricJerrycansUsed',
];

function createDraftFromEntry(entry: OperatorDailyEntry): OperatorEntryDraft {
  return {
    offloadingShift: entry.offloadingShift,
    pasteurizationShift: entry.pasteurizationShift,
    milkOffloaded: String(entry.milkOffloaded),
    milkPasteurized: String(entry.milkPasteurized),
    cipDone: entry.cipDone,
    cipType: entry.cipType,
    causticJerrycansUsed: String(entry.causticJerrycansUsed),
    nitricJerrycansUsed: String(entry.nitricJerrycansUsed),
  };
}

function parseNumberInput(value: string) {
  if (value.trim() === '' || value === '-' || value === '.') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCipDraft(draft: OperatorEntryDraft): OperatorEntryDraft {
  if (!draft.cipDone) {
    return {
      ...draft,
      cipType: 'Caustic wash',
      causticJerrycansUsed: '0',
      nitricJerrycansUsed: '0',
    };
  }

  if (draft.cipType === 'Caustic wash') {
    return {
      ...draft,
      nitricJerrycansUsed: '0',
    };
  }

  return draft;
}

function CompactMetricCard({
  title,
  value,
  helper,
  icon,
  tone,
  trend,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  tone: KpiTone;
  trend: string;
}) {
  const styles: Record<
    KpiTone,
    {
      border: string;
      headerBg: string;
      iconBg: string;
      iconColor: string;
      textColor: string;
      chipBg: string;
      chipColor: string;
    }
  > = {
    good: {
      border: '#86efac',
      headerBg: '#ecfdf5',
      iconBg: '#dcfce7',
      iconColor: '#166534',
      textColor: '#166534',
      chipBg: '#dcfce7',
      chipColor: '#166534',
    },
    bad: {
      border: '#fca5a5',
      headerBg: '#fef2f2',
      iconBg: '#fee2e2',
      iconColor: '#b91c1c',
      textColor: '#b91c1c',
      chipBg: '#fee2e2',
      chipColor: '#b91c1c',
    },
    warning: {
      border: '#fcd34d',
      headerBg: '#fffbeb',
      iconBg: '#fef3c7',
      iconColor: '#92400e',
      textColor: '#92400e',
      chipBg: '#fef3c7',
      chipColor: '#92400e',
    },
    neutral: {
      border: '#93c5fd',
      headerBg: '#eff6ff',
      iconBg: '#dbeafe',
      iconColor: '#1d4ed8',
      textColor: '#1e3a8a',
      chipBg: '#dbeafe',
      chipColor: '#1d4ed8',
    },
  };

  const current = styles[tone];

  return (
    <Box
      sx={{
        border: `1px solid ${current.border}`,
        borderRadius: 1,
        background: '#ffffff',
        overflow: 'hidden',
        minHeight: 96,
      }}
    >
      <Box
        sx={{
          px: 1.2,
          py: 0.7,
          borderBottom: `1px solid ${current.border}`,
          background: current.headerBg,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: current.textColor,
            lineHeight: 1.1,
          }}
        >
          {title}
        </Typography>

        <Avatar
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            bgcolor: current.iconBg,
            color: current.iconColor,
          }}
        >
          {icon}
        </Avatar>
      </Box>

      <Box sx={{ px: 1.2, py: 0.9 }}>
        <Typography
          sx={{
            fontSize: '1.05rem',
            fontWeight: 900,
            color: '#0f172a',
            lineHeight: 1.1,
            mb: 0.45,
          }}
        >
          {value}
        </Typography>

        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#64748b',
            mb: 0.8,
          }}
        >
          {helper}
        </Typography>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 0.9,
            py: 0.35,
            borderRadius: 999,
            bgcolor: current.chipBg,
            color: current.chipColor,
            fontSize: '0.68rem',
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {trend}
        </Box>
      </Box>
    </Box>
  );
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const accent = getSectionAccent(title);

  return (
    <Box
     sx={{
  border: `1px solid ${accent.border}`,
  borderRadius: 2,
  background: accent.bg,
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 16px 32px rgba(15, 23, 42, 0.10)',
  },
}}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 1.2,
          py: 0.6,
          borderBottom: `1px solid ${accent.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: alpha(accent.bg, 0.4),
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: accent.text,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Typography>

          {description && (
            <Typography
              sx={{
                fontSize: '0.65rem',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {action}
      </Box>

      {/* BODY */}
      <Box sx={{ p: 1.4 }}>
        {children}
      </Box>
    </Box>
  );
}
function getPerformanceBadgeMeta(badge: OperatorPerformanceEntry['badge']) {
  switch (badge) {
    case 'best':
      return { label: 'Best', color: 'success' as const, icon: <LeaderboardRounded fontSize="small" /> };
    case 'worst':
      return { label: 'Worst', color: 'error' as const, icon: <FlagRounded fontSize="small" /> };
    case 'improving':
      return { label: 'Improving', color: 'info' as const, icon: <TrendingUpRounded fontSize="small" /> };
    case 'risky':
      return { label: 'Risky', color: 'warning' as const, icon: <WarningAmberRounded fontSize="small" /> };
    default:
      return { label: 'Steady', color: 'primary' as const, icon: <BoltRounded fontSize="small" /> };
  }
}

function OperatorPerformancePage({
  performance,
  selectedOperator,
  onSelectOperator,
}: {
  performance: ReturnType<typeof buildOperatorPerformance>;
  selectedOperator: string;
  onSelectOperator: (operator: string) => void;
}) {
  const selectedEntry =
    performance.operators.find((entry) => entry.operator === selectedOperator) ??
    performance.operators[0];

  if (!selectedEntry) {
    return (
      <SectionCard
        title="Operator performance command"
        description="Performance scores will appear once operator records are available for the selected month."
      >
        <Typography variant="body2" color="text.secondary">
          No operator records are available in the current review window.
        </Typography>
      </SectionCard>
    );
  }

  return (
    <Stack spacing={1.25}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 0.95 }}>
        {performance.operators.map((entry) => {
          const badge = getPerformanceBadgeMeta(entry.badge);
          const isActive = entry.operator === selectedEntry.operator;
          return (
            <Card
              key={entry.operator}
              onClick={() => onSelectOperator(entry.operator)}
              sx={{
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isActive ? 'primary.main' : 'rgba(148,163,184,0.16)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(47,109,246,0.12), rgba(255,255,255,0.98))'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
                transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 28px rgba(15,23,42,0.08)',
                  borderColor: 'rgba(47,109,246,0.28)',
                },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1.2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="body2" fontWeight={900}>
                        {entry.operator}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        Position {entry.positionLabel}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color={badge.color}
                      icon={badge.icon}
                      label={badge.label}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1.5} alignItems="baseline">
                    <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-0.04em' }}>
                      {entry.score.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>
                      / 100 score
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={`${entry.totalMilkHandled.toLocaleString()} L handled`} />
                    <Chip size="small" color={entry.averageLossPercentage > 2.6 ? 'error' : 'success'} label={`${entry.averageLossPercentage.toFixed(2)}% avg loss`} />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={entry.score}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      bgcolor: 'rgba(148,163,184,0.16)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        background: entry.rank === 1
                          ? 'linear-gradient(90deg, #14b8a6, #2dd4bf)'
                          : entry.badge === 'risky' || entry.rank === performance.operators.length
                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                            : 'linear-gradient(90deg, #2563eb, #38bdf8)',
                      },
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.1fr 0.9fr' }, gap: 1.1 }}>
        <Stack spacing={1.1}>
          <SectionCard
            title="Operator score ranking"
            description="Weighted monthly score with fair per-1000L chemical normalization and completeness discipline."
          >
            <Stack spacing={1.1}>
              {performance.operators.map((entry) => {
                const badge = getPerformanceBadgeMeta(entry.badge);
                return (
                  <Paper
                    key={entry.operator}
                    onClick={() => onSelectOperator(entry.operator)}
                    sx={{
                      p: 1.5,
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: '1px solid rgba(148,163,184,0.14)',
                      background:
                        entry.operator === selectedEntry.operator
                          ? 'linear-gradient(135deg, rgba(47,109,246,0.12), rgba(255,255,255,0.98))'
                          : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.92))',
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#2563eb', 0.1), color: 'primary.main' }}>
                            #{entry.rank}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={900}>{entry.operator}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={700}>
                              {entry.positionLabel}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Chip size="small" color={badge.color} icon={badge.icon} label={badge.label} />
                          <Chip
                            size="small"
                            color={entry.rank === 1 ? 'success' : entry.rank === performance.operators.length ? 'error' : 'primary'}
                            label={`${entry.score.toFixed(1)} pts`}
                          />
                        </Stack>
                      </Stack>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.9 }}>
                        <Chip size="small" variant="outlined" label={`Loss ${entry.averageLossPercentage.toFixed(2)}%`} color={entry.averageLossPercentage > 2.6 ? 'error' : 'success'} />
                        <Chip size="small" variant="outlined" label={`Completeness ${entry.dataCompleteness.toFixed(0)}%`} color="primary" />
                        <Chip size="small" variant="outlined" label={`Caustic ${entry.causticPer1000Litres.toFixed(3)}/1000L`} color="warning" />
                        <Chip size="small" variant="outlined" label={`Nitric ${entry.nitricPer1000Litres.toFixed(3)}/1000L`} color="info" />
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.8 }}>
                        {[
                          { label: 'Loss', value: entry.lossPerformanceScore, color: '#14b8a6' },
                          { label: 'Chem', value: entry.chemicalEfficiencyScore, color: '#2563eb' },
                          { label: 'Data', value: entry.dataCompleteness, color: '#38bdf8' },
                          { label: 'Consistency', value: entry.consistency, color: '#f59e0b' },
                        ].map((metric) => (
                          <Box key={metric.label}>
                            <Typography variant="caption" color="text.secondary" fontWeight={800}>
                              {metric.label}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={metric.value}
                              sx={{
                                mt: 0.6,
                                height: 7,
                                borderRadius: 999,
                                bgcolor: 'rgba(148,163,184,0.16)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 999,
                                  bgcolor: metric.color,
                                },
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </SectionCard>

          <SectionCard
            title={`${selectedEntry.operator} detail`}
            description="Monthly loss trend, chemistry intensity, and anomaly watch for the selected operator."
            action={<Chip size="small" color="primary" icon={<TimelineRounded fontSize="small" />} label={`Viewing ${selectedEntry.positionLabel}`} />}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 1.6 }}>
              <Paper sx={{ p: 1.2, borderRadius: 4, border: '1px solid rgba(148,163,184,0.12)' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  Loss trend
                </Typography>
                <Box sx={{ height: 198, mt: 0.55 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedEntry.trend}>
                      <defs>
                        <linearGradient id="operatorLossFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.24} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...chartGridProps} />
                      <XAxis dataKey="date" {...chartAxisProps} />
                      <YAxis {...chartAxisProps} />
                      <Tooltip content={<ChartTooltipCard />} />
                      <Area type="monotone" dataKey="lossPercentage" name="Loss %" stroke="#ef4444" strokeWidth={3} fill="url(#operatorLossFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
              <Paper sx={{ p: 1.2, borderRadius: 4, border: '1px solid rgba(148,163,184,0.12)' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  Chemical usage trend
                </Typography>
                <Box sx={{ height: 198, mt: 0.55 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedEntry.trend}>
                      <CartesianGrid {...chartGridProps} />
                      <XAxis dataKey="date" {...chartAxisProps} />
                      <YAxis {...chartAxisProps} />
                      <Tooltip content={<ChartTooltipCard />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="causticPer1000L" name="Caustic / 1000L" stroke="#2563eb" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="nitricPer1000L" name="Nitric / 1000L" stroke="#14b8a6" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
          </SectionCard>
        </Stack>

        <Stack spacing={1.1}>
          <SectionCard title="Supervisor insights" description="Immediate flags for risky behavior, missing records, and improvement momentum.">
            <Stack spacing={1.1}>
              <Paper sx={{ p: 1.5, borderRadius: 4, background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(255,255,255,0.98))' }}>
                <Typography variant="caption" color="success.main" fontWeight={800}>Best operator</Typography>
                <Typography variant="body2" fontWeight={800}>{performance.bestOperator ?? 'N/A'}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, borderRadius: 4, background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(255,255,255,0.98))' }}>
                <Typography variant="caption" color="error.main" fontWeight={800}>Worst operator</Typography>
                <Typography variant="body2" fontWeight={800}>{performance.worstOperator ?? 'N/A'}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, borderRadius: 4, background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(255,255,255,0.98))' }}>
                <Typography variant="caption" color="warning.main" fontWeight={800}>Risk watch</Typography>
                <Typography variant="body2">{performance.riskyOperators.length ? performance.riskyOperators.join(', ') : 'No operators are currently flagged as risky.'}</Typography>
              </Paper>
              <Paper sx={{ p: 1.5, borderRadius: 4, background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(255,255,255,0.98))' }}>
                <Typography variant="caption" color="primary.main" fontWeight={800}>Improvement trend</Typography>
                <Typography variant="body2">{performance.improvingOperators.length ? performance.improvingOperators.join(', ') : 'No clear improvement trend detected in this review window.'}</Typography>
              </Paper>
            </Stack>
          </SectionCard>

          <SectionCard title="Daily performance ledger" description="Daily volume, loss, and chemical intensity for the selected operator.">
            <TableContainer component={Paper} sx={{ borderRadius: 4, maxHeight: 420, border: '1px solid rgba(148,163,184,0.16)' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Date', 'Handled', 'Loss', 'Loss %', 'Caustic / 1000L', 'Nitric / 1000L'].map((header) => (
                      <TableCell key={header} sx={{ fontWeight: 800, bgcolor: '#f8fbff', py: 1.1, fontSize: '0.72rem' }}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEntry.trend.map((point, index) => {
                    const highLoss = point.lossPercentage > 2.8;
                    return (
                      <TableRow key={`${point.date}-${index}`} hover sx={{ bgcolor: highLoss ? 'rgba(254,226,226,0.42)' : index % 2 === 0 ? 'rgba(248,250,252,0.82)' : 'white' }}>
                        <TableCell>{point.date}</TableCell>
                        <TableCell>{point.milkHandled.toLocaleString()} L</TableCell>
                        <TableCell>{point.milkLoss.toLocaleString()} L</TableCell>
                        <TableCell>
                          <Chip size="small" color={highLoss ? 'error' : 'success'} label={`${point.lossPercentage.toFixed(2)}%`} />
                        </TableCell>
                        <TableCell>{point.causticPer1000L.toFixed(3)}</TableCell>
                        <TableCell>{point.nitricPer1000L.toFixed(3)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <SectionCard title="Anomaly log" description="Auto-detected high loss, abnormal chemical usage, missing records, and unusual spikes.">
            <Stack spacing={1}>
              {selectedEntry.anomalies.length ? (
                selectedEntry.anomalies.map((anomaly, index) => (
                  <Paper
                    key={`${anomaly.date}-${anomaly.type}-${index}`}
                    sx={{
                      p: 1.35,
                      borderRadius: 4,
                      border: '1px solid rgba(148,163,184,0.12)',
                      background:
                        anomaly.severity === 'high'
                          ? 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(255,255,255,0.98))'
                          : 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(255,255,255,0.98))',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Avatar sx={{ width: 28, height: 28, bgcolor: anomaly.severity === 'high' ? 'rgba(239,68,68,0.14)' : 'rgba(245,158,11,0.16)', color: anomaly.severity === 'high' ? 'error.main' : 'warning.main' }}>
                        {anomaly.severity === 'high' ? <WarningAmberRounded fontSize="small" /> : <ShowChartRounded fontSize="small" />}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" fontWeight={900} color={anomaly.severity === 'high' ? 'error.main' : 'warning.main'}>
                          {dayjs(anomaly.date).format('DD MMM')} • {anomaly.type.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body2">{anomaly.message}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No anomalies detected for this operator in the selected month.
                </Typography>
              )}
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
}

function AdminProductionTable({
  records,
}: {
  records: ProductionRecord[];
}) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 4, maxHeight: 420, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.8)' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {['Date', 'Operator', 'Offload shift', 'Pasteurization shift', 'Offloaded', 'Pasteurized', 'Loss', 'Loss %', 'Remarks'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 800, bgcolor: '#f8fbff', py: 1.3, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record, index) => {
            const loss = getMilkLoss(record);
            const lossPercent = getLossPercentage(record);
            const tone = lossPercent > 2.6 ? 'rgba(254,226,226,0.62)' : lossPercent < 1.8 ? 'rgba(204,251,241,0.42)' : index % 2 === 0 ? 'rgba(248,250,252,0.86)' : 'rgba(255,255,255,0.96)';
            return (
              <TableRow key={record.id} hover sx={{ bgcolor: tone, transition: 'background-color 160ms ease', '& td': { py: 1 } }}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.offloadingOperator}</TableCell>
                <TableCell>{record.offloadingShift}</TableCell>
                <TableCell>{record.pasteurizationShift}</TableCell>
                <TableCell>{record.totalMilkOffloaded.toLocaleString()}</TableCell>
                <TableCell>{record.totalMilkPasteurized.toLocaleString()}</TableCell>
                <TableCell><Chip size="small" color={lossPercent > 2.6 ? 'error' : 'success'} label={`${loss.toLocaleString()} L`} /></TableCell>
                <TableCell><Chip size="small" color={lossPercent > 2.6 ? 'error' : lossPercent > 2 ? 'warning' : 'success'} label={`${lossPercent.toFixed(2)}%`} /></TableCell>
                <TableCell>{record.remarks}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const OperatorEntryRow = memo(function OperatorEntryRow({
  row,
  rowIndex,
  rowOrder,
  onCommitRow,
  onNavigate,
  registerCell,
  registerCommitter,
}: {
  row: OperatorDailyEntry;
  rowIndex: number;
  rowOrder: string[];
  onCommitRow: (row: OperatorDailyEntry) => void;
  onNavigate: (rowId: string, field: OperatorEditableField, direction: 'up' | 'down' | 'left' | 'right') => void;
  registerCell: (rowId: string, field: OperatorEditableField, element: HTMLElement | null) => void;
  registerCommitter: (rowId: string, commit: () => void, isDirty: () => boolean) => void;
}) {
  const [draft, setDraft] = useState<OperatorEntryDraft>(() => createDraftFromEntry(row));
  const [isDirty, setIsDirty] = useState(false);
  const committedMilkLoss = row.milkOffloaded - row.milkPasteurized;
  const committedLossPercentage = row.milkOffloaded === 0 ? 0 : (committedMilkLoss / row.milkOffloaded) * 100;
  const hasGain = row.milkPasteurized > row.milkOffloaded && row.milkOffloaded > 0;
  const isHighLoss = committedLossPercentage > 2.6;
  const rowColor = hasGain
    ? 'rgba(254,240,138,0.35)'
    : isHighLoss
      ? 'rgba(254,226,226,0.5)'
      : rowIndex % 2 === 0
        ? 'rgba(248,250,252,0.86)'
        : 'white';
  const statusChip =
    isDirty
      ? <Chip size="small" color="warning" icon={<PendingRounded />} label="pending" />
      : getEntryStatus(row, new Set(), new Set()) === 'saved'
      ? <Chip size="small" color="success" icon={<AssignmentTurnedInRounded />} label="saved" />
      : <Chip size="small" color="default" label="missing" />;

  useEffect(() => {
    setDraft(createDraftFromEntry(row));
    setIsDirty(false);
  }, [row]);

  const commit = useCallback(() => {
    if (!isDirty) return;
    const nextDraft = normalizeCipDraft(draft);
    onCommitRow({
      ...row,
      offloadingShift: draft.offloadingShift,
      pasteurizationShift: draft.pasteurizationShift,
      milkOffloaded: parseNumberInput(nextDraft.milkOffloaded),
      milkPasteurized: parseNumberInput(nextDraft.milkPasteurized),
      cipDone: nextDraft.cipDone,
      cipType: nextDraft.cipType,
      causticJerrycansUsed: parseNumberInput(nextDraft.causticJerrycansUsed),
      nitricJerrycansUsed: parseNumberInput(nextDraft.nitricJerrycansUsed),
    });
    setDraft(nextDraft);
    setIsDirty(false);
  }, [draft, isDirty, onCommitRow, row]);

  useEffect(() => {
    registerCommitter(row.id, commit, () => isDirty);
  }, [commit, isDirty, registerCommitter, row.id]);

  const commitOnEnter = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
        const field = (event.target as HTMLInputElement | HTMLTextAreaElement).name as OperatorEditableField;
        onNavigate(row.id, field, 'down');
      }
    },
    [commit, onNavigate, row.id],
  );

  const navigateOnArrow = useCallback(
    (field: OperatorEditableField) =>
      (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          onNavigate(row.id, field, 'up');
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          onNavigate(row.id, field, 'down');
        } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && rowOrder.length > 0) {
          const input = event.target as HTMLInputElement | HTMLTextAreaElement;
          const start = input.selectionStart ?? 0;
          const end = input.selectionEnd ?? 0;
          const atStart = start === 0 && end === 0;
          const atEnd = start === input.value.length && end === input.value.length;
          if (event.key === 'ArrowLeft' && atStart) {
            event.preventDefault();
            onNavigate(row.id, field, 'left');
          }
          if (event.key === 'ArrowRight' && atEnd) {
            event.preventDefault();
            onNavigate(row.id, field, 'right');
          }
        }
      },
    [onNavigate, row.id, rowOrder.length],
  );

  const handleTextNavigation = useCallback(
    (field: OperatorEditableField) =>
      (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter') {
          commitOnEnter(event);
          return;
        }
        navigateOnArrow(field)(event);
      },
    [commitOnEnter, navigateOnArrow],
  );

  const cipInputsDisabled = !draft.cipDone;
  const nitricDisabled = cipInputsDisabled || draft.cipType === 'Caustic wash';

  return (
    <TableRow hover sx={{ bgcolor: rowColor, '& td': { py: 0.7 } }}>
      <TableCell>{row.date}</TableCell>
      <TableCell>{statusChip}</TableCell>
      <TableCell>
        <TextField
          select
          size="small"
          name="offloadingShift"
          value={draft.offloadingShift}
          onChange={(event) => { setDraft((current) => ({ ...current, offloadingShift: event.target.value as Shift })); setIsDirty(true); }}
          onBlur={commit}
          onKeyDown={navigateOnArrow('offloadingShift')}
          inputRef={(element) => registerCell(row.id, 'offloadingShift', element)}
        >
          {shifts.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
        </TextField>
      </TableCell>
      <TableCell>
        <TextField
          select
          size="small"
          name="pasteurizationShift"
          value={draft.pasteurizationShift}
          onChange={(event) => { setDraft((current) => ({ ...current, pasteurizationShift: event.target.value as Shift })); setIsDirty(true); }}
          onBlur={commit}
          onKeyDown={navigateOnArrow('pasteurizationShift')}
          inputRef={(element) => registerCell(row.id, 'pasteurizationShift', element)}
        >
          {shifts.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
        </TextField>
      </TableCell>
      <TableCell>
        <TextField
          type="text"
          size="small"
          name="milkOffloaded"
          value={draft.milkOffloaded}
          onChange={(event) => { setDraft((current) => ({ ...current, milkOffloaded: event.target.value })); setIsDirty(true); }}
          onBlur={commit}
          onKeyDown={handleTextNavigation('milkOffloaded')}
          inputRef={(element) => registerCell(row.id, 'milkOffloaded', element)}
        />
      </TableCell>
      <TableCell>
        <TextField
          type="text"
          size="small"
          name="milkPasteurized"
          value={draft.milkPasteurized}
          onChange={(event) => { setDraft((current) => ({ ...current, milkPasteurized: event.target.value })); setIsDirty(true); }}
          onBlur={commit}
          onKeyDown={handleTextNavigation('milkPasteurized')}
          inputRef={(element) => registerCell(row.id, 'milkPasteurized', element)}
        />
      </TableCell>
      <TableCell><Chip size="small" color={hasGain ? 'warning' : isHighLoss ? 'error' : 'success'} label={`${committedMilkLoss.toLocaleString()} L`} /></TableCell>
      <TableCell><Chip size="small" color={hasGain ? 'warning' : isHighLoss ? 'error' : 'success'} label={`${committedLossPercentage.toFixed(2)}%`} /></TableCell>
      <TableCell>
        <Select
          size="small"
          value={draft.cipDone ? 'yes' : 'no'}
          onChange={(event) => {
            setDraft((current) => normalizeCipDraft({ ...current, cipDone: event.target.value === 'yes' }));
            setIsDirty(true);
          }}
          onBlur={commit}
          inputRef={(element) => registerCell(row.id, 'cipDone', element)}
          sx={{ minWidth: 110 }}
        >
          <MenuItem value="yes">Yes</MenuItem>
          <MenuItem value="no">No</MenuItem>
        </Select>
      </TableCell>
      <TableCell>
        <TextField
          select
          size="small"
          name="cipType"
          value={draft.cipType}
          onChange={(event) => {
            setDraft((current) => normalizeCipDraft({ ...current, cipType: event.target.value as CipType }));
            setIsDirty(true);
          }}
          onBlur={commit}
          onKeyDown={navigateOnArrow('cipType')}
          inputRef={(element) => registerCell(row.id, 'cipType', element)}
          disabled={cipInputsDisabled}
          sx={{ minWidth: 180 }}
        >
          {cipTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
        </TextField>
      </TableCell>
      <TableCell>
        <TextField
          type="text"
          size="small"
          name="causticJerrycansUsed"
          value={draft.causticJerrycansUsed}
          onChange={(event) => { setDraft((current) => ({ ...current, causticJerrycansUsed: event.target.value })); setIsDirty(true); }}
          onBlur={commit}
          onKeyDown={handleTextNavigation('causticJerrycansUsed')}
          inputRef={(element) => registerCell(row.id, 'causticJerrycansUsed', element)}
          disabled={cipInputsDisabled}
          sx={{ minWidth: 96 }}
        />
      </TableCell>
      <TableCell>
        <TextField
          type="text"
          size="small"
          name="nitricJerrycansUsed"
          value={draft.nitricJerrycansUsed}
          onChange={(event) => { setDraft((current) => ({ ...current, nitricJerrycansUsed: event.target.value })); setIsDirty(true); }}
          onBlur={commit}
          onKeyDown={handleTextNavigation('nitricJerrycansUsed')}
          inputRef={(element) => registerCell(row.id, 'nitricJerrycansUsed', element)}
          disabled={nitricDisabled}
          sx={{ minWidth: 96 }}
        />
      </TableCell>
    </TableRow>
  );
});

function OperatorMonthlyEntryTable({
  rows,
  onCommitRows,
  operatorName,
}: {
  rows: OperatorDailyEntry[];
  onCommitRows: (rows: OperatorDailyEntry[]) => void;
  operatorName: string;
}) {
  const cellRefs = useRef<Record<string, HTMLElement | null>>({});
  const rowCommitters = useRef<Record<string, { commit: () => void; isDirty: () => boolean }>>({});
  const rowOrder = useMemo(() => rows.map((row) => row.id), [rows]);

  const registerCell = useCallback((rowId: string, field: OperatorEditableField, element: HTMLElement | null) => {
    cellRefs.current[`${rowId}:${field}`] = element;
  }, []);

  const registerCommitter = useCallback((rowId: string, commit: () => void, isDirty: () => boolean) => {
    rowCommitters.current[rowId] = { commit, isDirty };
  }, []);

  const commitRow = useCallback((row: OperatorDailyEntry) => {
    onCommitRows([row]);
  }, [onCommitRows]);

  const commitAll = useCallback(() => {
    rowOrder.forEach((rowId) => {
      const controller = rowCommitters.current[rowId];
      if (controller?.isDirty()) {
        controller.commit();
      }
    });
  }, [rowOrder]);

  const onNavigate = useCallback(
    (rowId: string, field: OperatorEditableField, direction: 'up' | 'down' | 'left' | 'right') => {
      const rowIndex = rowOrder.indexOf(rowId);
      const fieldIndex = editableFieldOrder.indexOf(field);
      let nextRowIndex = rowIndex;
      let nextFieldIndex = fieldIndex;

      if (direction === 'up') nextRowIndex = Math.max(0, rowIndex - 1);
      if (direction === 'down') nextRowIndex = Math.min(rowOrder.length - 1, rowIndex + 1);
      if (direction === 'left') nextFieldIndex = Math.max(0, fieldIndex - 1);
      if (direction === 'right') nextFieldIndex = Math.min(editableFieldOrder.length - 1, fieldIndex + 1);

      const nextRowId = rowOrder[nextRowIndex];
      const nextField = editableFieldOrder[nextFieldIndex];
      const nextElement = cellRefs.current[`${nextRowId}:${nextField}`];
      if (nextElement) {
        requestAnimationFrame(() => {
          nextElement.focus();
          if (nextElement instanceof HTMLInputElement) {
            const input = nextElement;
            input.setSelectionRange?.(input.value.length, input.value.length);
          }
        });
      }
    },
    [rowOrder],
  );

  return (
    <SectionCard
      title="Daily operator log"
      description={`Daily production and CIP entry for ${operatorName}. Changes stay local while typing and commit on Enter, blur, or Save all.`}
      action={<Button startIcon={<SaveRounded />} onClick={commitAll}>Save all entries</Button>}
    >
      <TableContainer component={Paper} sx={{ borderRadius: 4, maxHeight: 560, border: '1px solid rgba(148,163,184,0.16)', background: 'rgba(255,255,255,0.84)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {['Date', 'Status', 'Offloading shift', 'Pasteurization shift', 'Milk offloaded', 'Milk pasteurized', 'Milk loss', 'Loss %', 'CIP done?', 'CIP type', 'Caustic', 'Nitric'].map((header) => (
                <TableCell key={header} sx={{ fontWeight: 800, bgcolor: '#f8fbff', py: 1.15, whiteSpace: 'nowrap', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.72rem' }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              return (
                <OperatorEntryRow
                  key={row.id}
                  row={row}
                  rowIndex={index}
                  rowOrder={rowOrder}
                  onCommitRow={commitRow}
                  onNavigate={onNavigate}
                  registerCell={registerCell}
                  registerCommitter={registerCommitter}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  );
}

function AdminIntakePage({
  summary,
  chartData,
  chemicalByOperator,
  ranking,
  insights,
  productionRecords,
}: {
  summary: ReturnType<typeof buildMonthlySummary>;
  chartData: ReturnType<typeof buildChartData>;
  chemicalByOperator: ReturnType<typeof buildChemicalUsageByOperator>;
  ranking: ReturnType<typeof buildOperatorRanking>;
  insights: ReturnType<typeof buildInsights>;
  productionRecords: ProductionRecord[];
}) {
  const abnormalOperators = ranking.filter((entry) => entry.lossRate > 2.5).map((entry) => entry.operator);

  return (
    <Stack spacing={1.15}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 0.8 }}>
        <CompactMetricCard title="Milk offloaded" value={`${summary.totalOffloaded.toLocaleString()} L`} helper="Monthly intake volume" icon={<OpacityRounded />} tone="neutral" trend="Flow stable" />
        <CompactMetricCard title="Milk pasteurized" value={`${summary.totalPasteurized.toLocaleString()} L`} helper="Finished output" icon={<LocalDrinkRounded />} tone="good" trend="Output healthy" />
        <CompactMetricCard title="Milk loss" value={`${summary.totalLoss.toLocaleString()} L`} helper="Variance to review" icon={<WarningAmberRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : 'warning'} trend={summary.lossPercentage > 2.6 ? 'Action needed' : 'Contained'} />
        <CompactMetricCard title="Loss rate" value={`${summary.lossPercentage.toFixed(2)}%`} helper="Process efficiency" icon={<InsightsRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : summary.lossPercentage > 2 ? 'warning' : 'good'} trend={summary.lossPercentage > 2.6 ? 'High loss' : 'Within range'} />
        <CompactMetricCard title="Caustic usage" value={`${summary.totalCaustic}`} helper="Jerrycans logged" icon={<ScienceRounded />} tone="warning" trend="Chemical watch" />
        <CompactMetricCard title="Nitric usage" value={`${summary.totalNitric}`} helper="Jerrycans logged" icon={<ScienceRounded />} tone="neutral" trend="Chemical watch" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.45fr 0.85fr' }, gap: 0.9 }}>
        <Stack spacing={0.9}>
          <SectionCard title="Throughput trend" description="Daily offloaded and pasteurized volume for the active review window.">
            <Box sx={{ height: 192 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="offloadedGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2f6df6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2f6df6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="pasteurizedGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="date" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip content={<ChartTooltipCard />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Area type="monotone" dataKey="offloaded" fill="url(#offloadedGlow)" stroke="none" />
                  <Area type="monotone" dataKey="pasteurized" fill="url(#pasteurizedGlow)" stroke="none" />
                  <Line type="monotone" dataKey="offloaded" stroke="#2563eb" strokeWidth={3.2} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#2563eb' }} />
                  <Line type="monotone" dataKey="pasteurized" stroke="#0f766e" strokeWidth={3.2} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: '#0f766e' }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>

          <SectionCard title="Loss surveillance" description="Trendline for milk loss and fast anomaly recognition.">
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="lossFillAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="date" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip content={<ChartTooltipCard />} />
                  <Area type="monotone" dataKey="loss" stroke="#dc2626" fill="url(#lossFillAdmin)" strokeWidth={3.2} activeDot={{ r: 4, fill: '#dc2626', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>

          <SectionCard title="Chemical intensity" description="Caustic and nitric consumption by operator for the selected month.">
            <Box sx={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chemicalByOperator}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="operator" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip content={<ChartTooltipCard />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <Bar dataKey="caustic" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="nitric" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Stack>

        <Stack spacing={0.9}>
          <SectionCard title="Operator performance ranking" description="Best-to-worst comparison across loss, chemistry discipline, and completeness.">
            <Stack spacing={1.2}>
              {ranking.map((entry) => (
                <Paper
                  key={entry.operator}
                  sx={{
                    p: 1.6,
                    borderRadius: 4,
                    border: '1px solid rgba(148,163,184,0.12)',
                    background: entry.rank === 1
                      ? 'linear-gradient(135deg, rgba(20,184,166,0.14), rgba(255,255,255,0.96))'
                      : entry.rank === ranking.length
                        ? 'linear-gradient(135deg, rgba(248,113,113,0.14), rgba(255,255,255,0.96))'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.9))',
                  }}
                >
                  <Stack spacing={0.9}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={900}>#{entry.rank} {entry.operator}</Typography>
                      <Chip size="small" color={entry.rank === 1 ? 'success' : entry.rank === ranking.length ? 'error' : 'primary'} label={`${entry.score.toFixed(1)} pts`} />
                    </Stack>
                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={`Loss ${entry.lossRate.toFixed(2)}%`} color={entry.lossRate > 2.5 ? 'error' : 'success'} />
                      <Chip size="small" label={`Chem ${entry.chemicalIntensity.toFixed(2)}`} color="warning" />
                      <Chip size="small" label={`Data ${entry.completeness.toFixed(0)}%`} color="primary" />
                    </Stack>
                    <LinearProgress variant="determinate" value={entry.completeness} sx={{ height: 9, borderRadius: 999, '& .MuiLinearProgress-bar': { borderRadius: 999, background: entry.rank === 1 ? 'linear-gradient(90deg, #14b8a6, #2dd4bf)' : entry.rank === ranking.length ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #2f6df6, #60a5fa)' } }} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Operational signals" description="Priority observations for review with the active filters.">
            <Stack spacing={1.2}>
              <Paper sx={{ p: 1.6, borderRadius: 4, background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(255,255,255,0.95))' }}><Typography variant="caption" color="warning.main" fontWeight={800}>High-loss days</Typography><Typography variant="body2">{insights.highMilkLoss}</Typography></Paper>
              <Paper sx={{ p: 1.6, borderRadius: 4, background: 'linear-gradient(135deg, rgba(248,113,113,0.12), rgba(255,255,255,0.95))' }}><Typography variant="caption" color="error.main" fontWeight={800}>Operators to review</Typography><Typography variant="body2">{abnormalOperators.length ? abnormalOperators.join(', ') : 'No abnormal operators in the current review scope.'}</Typography></Paper>
              <Paper sx={{ p: 1.6, borderRadius: 4, background: 'linear-gradient(135deg, rgba(148,163,184,0.12), rgba(255,255,255,0.95))' }}><Typography variant="caption" color="text.secondary" fontWeight={800}>Missing entries</Typography><Typography variant="body2">{insights.missingEntries}</Typography></Paper>
              <Paper sx={{ p: 1.6, borderRadius: 4, background: 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(255,255,255,0.95))' }}><Typography variant="caption" color="success.main" fontWeight={800}>Best operator</Typography><Typography variant="body2">{insights.bestOperator}</Typography></Paper>
              <Paper sx={{ p: 1.6, borderRadius: 4, background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(255,255,255,0.95))' }}><Typography variant="caption" color="error.main" fontWeight={800}>Lowest score</Typography><Typography variant="body2">{insights.worstOperator}</Typography></Paper>
            </Stack>
          </SectionCard>
        </Stack>
      </Box>

      <SectionCard title="Production review ledger" description="Detailed monthly production records filtered by month, operator, and shift.">
        <AdminProductionTable records={productionRecords} />
      </SectionCard>
    </Stack>
  );
}
const MILK_ACCOUNTING_STORAGE_KEY = 'jesa-milk-accounting';
const POUCH_YOGHURT_STORAGE_KEY = 'jesa-pouch-yoghurt-production';

type MilkAccountingRow = {
  date: string;
  offloaded: number;
  fresh: number;
  uht: number;
  yoghurt: number;
  cream: number;
  other: number;
  actualClosing: number;
};

type PouchYoghurtProductionRow = {
  date: string;
  vanilla200g: number;
  vanilla400g: number;
  strawberry200g: number;
  strawberry400g: number;
};

function loadMilkAccountingRows() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(MILK_ACCOUNTING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MilkAccountingRow[];
  } catch (error) {
    console.error('Failed to load milk accounting rows', error);
    return null;
  }
}

function saveMilkAccountingRows(rows: MilkAccountingRow[]) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(MILK_ACCOUNTING_STORAGE_KEY, JSON.stringify(rows));
  } catch (error) {
    console.error('Failed to save milk accounting rows', error);
  }
}

function loadPouchYoghurtMonthMap(): Record<string, PouchYoghurtProductionRow[]> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(POUCH_YOGHURT_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return {};
    }

    const normalized: Record<string, PouchYoghurtProductionRow[]> = {};

    Object.entries(parsed ?? {}).forEach(([key, value]) => {
      normalized[key] = Array.isArray(value) ? (value as PouchYoghurtProductionRow[]) : [];
    });

    return normalized;
  } catch (error) {
    console.error('Failed to load pouch yoghurt month map', error);
    return {};
  }
}

function loadPouchYoghurtRows(monthKey: string) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(POUCH_YOGHURT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed as PouchYoghurtProductionRow[];
    }

    if (parsed && typeof parsed === 'object' && Array.isArray(parsed[monthKey])) {
      return parsed[monthKey] as PouchYoghurtProductionRow[];
    }

    return null;
  } catch (error) {
    console.error('Failed to load pouch yoghurt rows', error);
    return null;
  }
}

function savePouchYoghurtRows(monthKey: string, rows: PouchYoghurtProductionRow[]) {
  if (typeof window === 'undefined') return;

  try {
    const monthMap = loadPouchYoghurtMonthMap();
    monthMap[monthKey] = rows;
    localStorage.setItem(POUCH_YOGHURT_STORAGE_KEY, JSON.stringify(monthMap));
  } catch (error) {
    console.error('Failed to save pouch yoghurt rows', error);
  }
}
function DashboardOverview({
  summary,
  selectedMonth,
  yoghurtRecords,
}: {
  summary: any;
  selectedMonth: string;
  yoghurtRecords: YoghurtProcessingDailyRecord[];
}) {
  const [monthOpeningBalance, setMonthOpeningBalance] = useState(0);
  const [rows, setRows] = useState<MilkAccountingRow[]>([]);
  const [pouchRows, setPouchRows] = useState<PouchYoghurtProductionRow[]>([]);

  useEffect(() => {
    const start = dayjs(`${selectedMonth}-01`);
    const days = start.daysInMonth();

    const savedRows = loadMilkAccountingRows();

    if (savedRows && savedRows.length === days) {
      setRows(savedRows);
    } else {
      setRows(
        Array.from({ length: days }, (_, i) => ({
          date: start.date(i + 1).format('DD MMM'),
          offloaded: 0,
          fresh: 0,
          uht: 0,
          yoghurt: 0,
          cream: 0,
          other: 0,
          actualClosing: 0,
        }))
      );
    }

    const savedPouchRows = loadPouchYoghurtRows(selectedMonth);

    if (savedPouchRows && savedPouchRows.length === days) {
      setPouchRows(savedPouchRows);
    } else {
      setPouchRows(
        Array.from({ length: days }, (_, i) => ({
          date: start.date(i + 1).format('DD MMM'),
          vanilla200g: 0,
          vanilla400g: 0,
          strawberry200g: 0,
          strawberry400g: 0,
        }))
      );
    }
  }, [selectedMonth]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      saveMilkAccountingRows(rows);
    }, 400);

    return () => clearTimeout(timeout);
  }, [rows]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      savePouchYoghurtRows(selectedMonth, pouchRows);
    }, 400);

    return () => clearTimeout(timeout);
  }, [pouchRows, selectedMonth]);

  const handleChange = (
    index: number,
    field:
      | 'offloaded'
      | 'fresh'
      | 'uht'
      | 'yoghurt'
      | 'cream'
      | 'other'
      | 'actualClosing',
    value: number
  ) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handlePouchChange = (
    index: number,
    field: 'vanilla200g' | 'vanilla400g' | 'strawberry200g' | 'strawberry400g',
    value: number
  ) => {
    setPouchRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const computed = useMemo(() => {
    return rows.map((row, index) => {
      const openingBalance =
        index === 0 ? monthOpeningBalance : rows[index - 1]?.actualClosing ?? 0;

      const milkAvailable = openingBalance + row.offloaded;
      const totalUsed = row.fresh + row.uht + row.yoghurt + row.cream + row.other;
      const expectedClosing = milkAvailable - totalUsed;
      const variance = row.actualClosing - expectedClosing;
      const variancePercent =
        expectedClosing !== 0 ? (variance / expectedClosing) * 100 : 0;

      return {
        ...row,
        openingBalance,
        milkAvailable,
        totalUsed,
        expectedClosing,
        variance,
        variancePercent,
      };
    });
  }, [rows, monthOpeningBalance]);

  const totals = useMemo(() => {
    const totalOffloaded = computed.reduce((sum, row) => sum + row.offloaded, 0);
    const totalUsed = computed.reduce((sum, row) => sum + row.totalUsed, 0);

    const finalExpectedClosing =
      computed.length > 0 ? computed[computed.length - 1].expectedClosing : 0;

    const finalActualClosing =
      computed.length > 0 ? computed[computed.length - 1].actualClosing : 0;

    const totalVariance = finalActualClosing - finalExpectedClosing;

    const variancePercent =
      finalExpectedClosing !== 0
        ? (totalVariance / finalExpectedClosing) * 100
        : 0;

    return {
      totalOffloaded,
      totalUsed,
      finalExpectedClosing,
      finalActualClosing,
      totalVariance,
      variancePercent,
    };
  }, [computed]);

  const pouchTotals = useMemo(() => {
    const vanilla200g = pouchRows.reduce((sum, row) => sum + row.vanilla200g, 0);
    const vanilla400g = pouchRows.reduce((sum, row) => sum + row.vanilla400g, 0);
    const strawberry200g = pouchRows.reduce((sum, row) => sum + row.strawberry200g, 0);
    const strawberry400g = pouchRows.reduce((sum, row) => sum + row.strawberry400g, 0);

    return {
      vanilla200g,
      vanilla400g,
      strawberry200g,
      strawberry400g,
      vanillaTotal: vanilla200g + vanilla400g,
      strawberryTotal: strawberry200g + strawberry400g,
      grandTotal: vanilla200g + vanilla400g + strawberry200g + strawberry400g,
    };
  }, [pouchRows]);

  const selectedMonthYoghurtRecords = useMemo(() => {
    return yoghurtRecords.filter((record) => record.date.startsWith(selectedMonth));
  }, [yoghurtRecords, selectedMonth]);

  const baseTotals = useMemo(() => {
    return selectedMonthYoghurtRecords.reduce(
      (acc, record) => {
        acc.milkStd += record.yoghurtMilkStdLitres;
        acc.sugar += record.sugarKg;
        acc.stabiliser += record.stabiliserKg;
        acc.source += record.sourceGrams;
        return acc;
      },
      {
        milkStd: 0,
        sugar: 0,
        stabiliser: 0,
        source: 0,
      },
    );
  }, [selectedMonthYoghurtRecords]);

  const baseTotal = useMemo(() => {
    return baseTotals.milkStd + baseTotals.sugar + baseTotals.stabiliser + baseTotals.source;
  }, [baseTotals]);

  const yieldSummary = useMemo(() => {
    const vanillaYield = baseTotal > 0 ? pouchTotals.vanillaTotal / baseTotal : 0;
    const strawberryYield = baseTotal > 0 ? pouchTotals.strawberryTotal / baseTotal : 0;

    return {
      baseTotal,
      vanillaProduced: pouchTotals.vanillaTotal,
      strawberryProduced: pouchTotals.strawberryTotal,
      vanillaYield,
      strawberryYield,
      vanillaYieldPercent: vanillaYield * 100,
      strawberryYieldPercent: strawberryYield * 100,
    };
  }, [baseTotal, pouchTotals]);

  const monthlyYieldComparison = useMemo(() => {
  const pouchMonthMap = loadPouchYoghurtMonthMap();

  const monthKeys = Array.from(
    new Set([
      
      ...Object.keys(pouchMonthMap),
      ...yoghurtRecords.map((record) => record.date.slice(0, 7)),
    ]),
  ).sort();

  return monthKeys.map((monthKey) => {
    const monthPouchRows = pouchMonthMap[monthKey] ?? [];

    const vanillaProduced = monthPouchRows.reduce(
      (sum, row) => sum + row.vanilla200g + row.vanilla400g,
      0,
    );

    const strawberryProduced = monthPouchRows.reduce(
      (sum, row) => sum + row.strawberry200g + row.strawberry400g,
      0,
    );

    const monthInputTotals = yoghurtRecords
      .filter((record) => record.date.startsWith(monthKey))
      .reduce(
        (acc, record) => {
          acc.milkStd += record.yoghurtMilkStdLitres;
          acc.sugar += record.sugarKg;
          acc.stabiliser += record.stabiliserKg;
          acc.source += record.sourceGrams;
          return acc;
        },
        {
          milkStd: 0,
          sugar: 0,
          stabiliser: 0,
          source: 0,
        },
      );

    const monthBase =
      monthInputTotals.milkStd +
      monthInputTotals.sugar +
      monthInputTotals.stabiliser +
      monthInputTotals.source;

    const vanillaYieldPercent = monthBase > 0 ? (vanillaProduced / monthBase) * 100 : 0;
    const strawberryYieldPercent = monthBase > 0 ? (strawberryProduced / monthBase) * 100 : 0;
    const averageYieldPercent = (vanillaYieldPercent + strawberryYieldPercent) / 2;

    return {
      monthKey,
      month: dayjs(`${monthKey}-01`).format('MMM YY'),
      vanillaYield: Number(vanillaYieldPercent.toFixed(2)),
      strawberryYield: Number(strawberryYieldPercent.toFixed(2)),
      averageYield: Number(averageYieldPercent.toFixed(2)),
    };
  });
}, [yoghurtRecords, selectedMonth]);

const averageYieldMonthComparison = useMemo(() => {
  const currentMonth = monthlyYieldComparison.find((item) => item.monthKey === selectedMonth);

  const previousMonthKey = dayjs(`${selectedMonth}-01`)
    .subtract(1, 'month')
    .format('YYYY-MM');

  const previousMonth = monthlyYieldComparison.find((item) => item.monthKey === previousMonthKey);

  return [
    {
      label: previousMonth ? previousMonth.month : dayjs(`${previousMonthKey}-01`).format('MMM YY'),
      averageYield: previousMonth?.averageYield ?? 0,
    },
    {
      label: currentMonth ? currentMonth.month : dayjs(`${selectedMonth}-01`).format('MMM YY'),
      averageYield: currentMonth?.averageYield ?? 0,
    },
  ];
}, [monthlyYieldComparison, selectedMonth]);
  const varianceToneColor =
    totals.totalVariance > 0 ? '#15803d' : totals.totalVariance < 0 ? '#b91c1c' : '#334155';

  const varianceBg =
    totals.totalVariance > 0
      ? 'rgba(22,163,74,0.08)'
      : totals.totalVariance < 0
        ? 'rgba(220,38,38,0.08)'
        : '#f8fafc';

  const spreadsheetInputSx = {
    width: '100%',
    fontSize: '0.82rem',
    fontWeight: 600,
    '& input': {
      px: 1,
      py: 0.8,
      textAlign: 'right' as const,
    },
  };

  const readonlyCellSx = {
    border: '1px solid #d7dee7',
    borderRadius: 0.8,
    px: 1,
    py: 0.8,
    minHeight: 34,
    minWidth: 86,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    bgcolor: '#f8fafc',
    fontWeight: 700,
    fontSize: '0.8rem',
    color: '#0f172a',
  };

  const editableCellWrapSx = {
    border: '1px solid #d7dee7',
    borderRadius: 0.8,
    minHeight: 34,
    minWidth: 86,
    display: 'flex',
    alignItems: 'center',
    bgcolor: '#ffffff',
  };

  const compactCard = (
  title: string,
  value: string,
  subtext: string,
  color: string = '#0f172a',
  bg: string = '#ffffff',
) => {
  const normalizedTitle = title.toLowerCase();

  let borderColor = '#d8dee8';
  let headerBg = '#f8fafc';
  let bodyBg = '#ffffff';
  let titleColor = '#64748b';
  let valueColor = color;
  let chipBg = '#eef2f7';
  let chipColor = '#475569';

  if (normalizedTitle.includes('offloaded')) {
    borderColor = '#93c5fd';
    headerBg = '#eff6ff';
    bodyBg = '#fafdff';
    titleColor = '#1d4ed8';
    chipBg = '#dbeafe';
    chipColor = '#1d4ed8';
  } else if (normalizedTitle.includes('used')) {
    borderColor = '#fcd34d';
    headerBg = '#fffbeb';
    bodyBg = '#fffdf5';
    titleColor = '#b45309';
    chipBg = '#fef3c7';
    chipColor = '#92400e';
  } else if (normalizedTitle.includes('variance')) {
    borderColor = '#fca5a5';
    headerBg = '#fef2f2';
    bodyBg = '#fff7f7';
    titleColor = '#b91c1c';
    chipBg = '#fee2e2';
    chipColor = '#b91c1c';
  } else if (normalizedTitle.includes('base')) {
    borderColor = '#86efac';
    headerBg = '#ecfdf5';
    bodyBg = '#f7fff9';
    titleColor = '#15803d';
    chipBg = '#dcfce7';
    chipColor = '#166534';
  } else if (normalizedTitle.includes('vanilla')) {
    borderColor = '#c4b5fd';
    headerBg = '#f5f3ff';
    bodyBg = '#faf8ff';
    titleColor = '#6d28d9';
    chipBg = '#ede9fe';
    chipColor = '#6d28d9';
  } else if (normalizedTitle.includes('strawberry')) {
    borderColor = '#f9a8d4';
    headerBg = '#fdf2f8';
    bodyBg = '#fff8fb';
    titleColor = '#be185d';
    chipBg = '#fce7f3';
    chipColor = '#be185d';
  } else if (normalizedTitle.includes('produced')) {
    borderColor = '#67e8f9';
    headerBg = '#ecfeff';
    bodyBg = '#f7feff';
    titleColor = '#0f766e';
    chipBg = '#cffafe';
    chipColor = '#0f766e';
  }

  return (
    <Box
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: bodyBg,
        minHeight: 96,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)',
      }}
    >
      <Box
        sx={{
          px: 1.2,
          py: 0.65,
          borderBottom: `1px solid ${borderColor}`,
          bgcolor: headerBg,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: titleColor,
            lineHeight: 1.1,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ px: 1.2, py: 0.95, bgcolor: bodyBg }}>
        <Typography
          sx={{
            fontSize: '1.05rem',
            fontWeight: 900,
            lineHeight: 1,
            color: valueColor,
            mb: 0.55,
          }}
        >
          {value}
        </Typography>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            px: 0.8,
            py: 0.3,
            borderRadius: 999,
            bgcolor: chipBg,
            mb: 0.35,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: chipColor,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {subtext}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
 return (
  <Box
    sx={{
      minHeight: '100vh',
      bgcolor: '#f6f3ee',
      px: 2,
      py: 2,
    }}
  >
    <Box
      sx={{
        maxWidth: 1600,
        mx: 'auto',
        bgcolor: '#ffffff',
        borderRadius: 2,
        px: 2,
        py: 2,
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      }}
    >
      <Stack spacing={1.1}>
      <Box
        sx={{
          border: '1px solid #d7dee7',
          borderRadius: 1,
          bgcolor: '#ffffff',
          px: 1.2,
          py: 1,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#334155',
              letterSpacing: '0.02em',
            }}
          >
            Month opening balance
          </Typography>

          <Box
            sx={{
              width: { xs: '100%', md: 180 },
              border: '1px solid #d7dee7',
              borderRadius: 0.8,
              bgcolor: '#f8fafc',
            }}
          >
            <InputBase
              type="number"
              value={monthOpeningBalance}
              onChange={(e) =>
                setMonthOpeningBalance(
                  e.target.value === '' ? 0 : Number(e.target.value)
                )
              }
              sx={{
                width: '100%',
                fontSize: '0.85rem',
                fontWeight: 700,
                '& input': {
                  px: 1,
                  py: 0.9,
                  textAlign: 'right',
                },
              }}
            />
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', xl: 'repeat(4, 1fr)' },
          gap: 0.8,
        }}
      >
        {compactCard('Total Offloaded', `${totals.totalOffloaded.toLocaleString()} L`, 'Monthly intake')}
        {compactCard('Total Used', `${totals.totalUsed.toLocaleString()} L`, 'All consumption')}
        {compactCard(
          'Final Variance',
          `${totals.totalVariance.toLocaleString()} L`,
          'Actual vs expected',
          varianceToneColor,
          varianceBg,
        )}
        {compactCard(
          'Variance %',
          `${totals.variancePercent.toFixed(2)}%`,
          'Month close variance',
          varianceToneColor,
          varianceBg,
        )}
      </Box>

      <Box
        sx={{
          border: '1px solid #d7dee7',
          borderRadius: 1,
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 1.2,
            py: 0.9,
            borderBottom: '1px solid #d7dee7',
            bgcolor: '#f8fafc',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 900,
              letterSpacing: '0.03em',
              color: '#0f172a',
            }}
          >
            Milk Reconciliation
          </Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  'Date',
                  'Opening',
                  'Offloaded',
                  'Fresh STD',
                  'UHT STD',
                  'Yoghurt STD',
                  'Cream',
                  'Other',
                  'Used',
                  'Expected',
                  'Actual',
                  'Variance',
                  'Var %',
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 900,
                      fontSize: '0.72rem',
                      color: '#334155',
                      bgcolor: '#eef2f7',
                      borderBottom: '1px solid #d7dee7',
                      py: 0.8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {computed.map((row, i) => (
                <TableRow
                  key={i}
                  hover
                  sx={{
                    '& td': {
                      borderBottom: '1px solid #edf2f7',
                      py: 0.55,
                    },
                  }}
                >
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {row.date}
                  </TableCell>

                  <TableCell>
                    <Box sx={readonlyCellSx}>{row.openingBalance.toLocaleString()}</Box>
                  </TableCell>

                  {(['offloaded', 'fresh', 'uht', 'yoghurt', 'cream', 'other'] as const).map((field) => (
                    <TableCell key={field}>
                      <Box sx={editableCellWrapSx}>
                        <InputBase
                          type="number"
                          defaultValue={row[field]}
                          onBlur={(e) =>
                            handleChange(
                              i,
                              field,
                              e.target.value === '' ? 0 : Number(e.target.value)
                            )
                          }
                          sx={spreadsheetInputSx}
                        />
                      </Box>
                    </TableCell>
                  ))}

                  <TableCell>
                    <Box sx={readonlyCellSx}>{row.totalUsed.toLocaleString()}</Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={readonlyCellSx}>{row.expectedClosing.toLocaleString()}</Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={editableCellWrapSx}>
                      <InputBase
                        type="number"
                        defaultValue={row.actualClosing}
                        onBlur={(e) =>
                          handleChange(
                            i,
                            'actualClosing',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                        sx={spreadsheetInputSx}
                      />
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        ...readonlyCellSx,
                        bgcolor:
                          row.variance > 0
                            ? 'rgba(22,163,74,0.08)'
                            : row.variance < 0
                              ? 'rgba(220,38,38,0.08)'
                              : '#f8fafc',
                        color:
                          row.variance > 0
                            ? '#15803d'
                            : row.variance < 0
                              ? '#b91c1c'
                              : '#0f172a',
                      }}
                    >
                      {row.variance.toLocaleString()}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        ...readonlyCellSx,
                        bgcolor:
                          row.variancePercent > 0
                            ? 'rgba(22,163,74,0.08)'
                            : row.variancePercent < 0
                              ? 'rgba(220,38,38,0.08)'
                              : '#f8fafc',
                        color:
                          row.variancePercent > 0
                            ? '#15803d'
                            : row.variancePercent < 0
                              ? '#b91c1c'
                              : '#0f172a',
                      }}
                    >
                      {row.variancePercent.toFixed(2)}%
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              <TableRow
                sx={{
                  '& td': {
                    bgcolor: '#f8fafc',
                    borderTop: '1px solid #d7dee7',
                    borderBottom: 'none',
                    py: 0.8,
                    fontWeight: 900,
                  },
                }}
              >
                <TableCell>TOTAL</TableCell>
                <TableCell />
                <TableCell>{totals.totalOffloaded.toLocaleString()}</TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell>{totals.totalUsed.toLocaleString()}</TableCell>
                <TableCell>{totals.finalExpectedClosing.toLocaleString()}</TableCell>
                <TableCell>{totals.finalActualClosing.toLocaleString()}</TableCell>
                <TableCell sx={{ color: varianceToneColor }}>{totals.totalVariance.toLocaleString()}</TableCell>
                <TableCell sx={{ color: varianceToneColor }}>{totals.variancePercent.toFixed(2)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box
        sx={{
          border: '1px solid #d7dee7',
          borderRadius: 1,
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 1.2,
            py: 0.9,
            borderBottom: '1px solid #d7dee7',
            bgcolor: '#f8fafc',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 900,
              letterSpacing: '0.03em',
              color: '#0f172a',
            }}
          >
            Pouch Yoghurt Production
          </Typography>
        </Box>

        <Box
          sx={{
            px: 1,
            py: 0.9,
            borderBottom: '1px solid #e8edf3',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', xl: 'repeat(4, 1fr)' },
            gap: 0.8,
          }}
        >
          {compactCard('Vanilla Total', pouchTotals.vanillaTotal.toLocaleString(), '200g + 400g')}
          {compactCard('Strawberry Total', pouchTotals.strawberryTotal.toLocaleString(), '200g + 400g')}
          {compactCard('Vanilla 200g', pouchTotals.vanilla200g.toLocaleString(), 'Monthly total')}
          {compactCard('Strawberry 200g', pouchTotals.strawberry200g.toLocaleString(), 'Monthly total')}
        </Box>

        <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  'Date',
                  'Vanilla 200g',
                  'Vanilla 400g',
                  'Strawberry 200g',
                  'Strawberry 400g',
                  'Vanilla Total',
                  'Strawberry Total',
                  'Daily Total',
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 900,
                      fontSize: '0.72rem',
                      color: '#334155',
                      bgcolor: '#eef2f7',
                      borderBottom: '1px solid #d7dee7',
                      py: 0.8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {pouchRows.map((row, i) => {
                const vanillaTotal = row.vanilla200g + row.vanilla400g;
                const strawberryTotal = row.strawberry200g + row.strawberry400g;
                const dailyTotal = vanillaTotal + strawberryTotal;

                return (
                  <TableRow
                    key={i}
                    hover
                    sx={{
                      '& td': {
                        borderBottom: '1px solid #edf2f7',
                        py: 0.55,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {row.date}
                    </TableCell>

                    {(['vanilla200g', 'vanilla400g', 'strawberry200g', 'strawberry400g'] as const).map((field) => (
                      <TableCell key={field}>
                        <Box sx={editableCellWrapSx}>
                          <InputBase
                            type="number"
                            defaultValue={row[field]}
                            onBlur={(e) =>
                              handlePouchChange(
                                i,
                                field,
                                e.target.value === '' ? 0 : Number(e.target.value)
                              )
                            }
                            sx={spreadsheetInputSx}
                          />
                        </Box>
                      </TableCell>
                    ))}

                    <TableCell>
                      <Box sx={readonlyCellSx}>{vanillaTotal.toLocaleString()}</Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={readonlyCellSx}>{strawberryTotal.toLocaleString()}</Box>
                    </TableCell>

                    <TableCell>
                      <Box
                        sx={{
                          ...readonlyCellSx,
                          fontWeight: 900,
                          bgcolor: '#f1f5f9',
                        }}
                      >
                        {dailyTotal.toLocaleString()}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableRow
                sx={{
                  '& td': {
                    bgcolor: '#f8fafc',
                    borderTop: '1px solid #d7dee7',
                    borderBottom: 'none',
                    py: 0.8,
                    fontWeight: 900,
                  },
                }}
              >
                <TableCell>TOTAL</TableCell>
                <TableCell>{pouchTotals.vanilla200g.toLocaleString()}</TableCell>
                <TableCell>{pouchTotals.vanilla400g.toLocaleString()}</TableCell>
                <TableCell>{pouchTotals.strawberry200g.toLocaleString()}</TableCell>
                <TableCell>{pouchTotals.strawberry400g.toLocaleString()}</TableCell>
                <TableCell>{pouchTotals.vanillaTotal.toLocaleString()}</TableCell>
                <TableCell>{pouchTotals.strawberryTotal.toLocaleString()}</TableCell>
                <TableCell>{pouchTotals.grandTotal.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box
        sx={{
          border: '1px solid #d7dee7',
          borderRadius: 1,
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 1.2,
            py: 0.9,
            borderBottom: '1px solid #d7dee7',
            bgcolor: '#f8fafc',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 900,
              letterSpacing: '0.03em',
              color: '#0f172a',
            }}
          >
            Yoghurt Yield
          </Typography>
        </Box>

        <Box
          sx={{
            px: 1,
            py: 0.9,
            borderBottom: '1px solid #e8edf3',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', xl: 'repeat(4, 1fr)' },
            gap: 0.8,
          }}
        >
          {compactCard('Base Total', yieldSummary.baseTotal.toLocaleString(), 'Milk STD + sugar + stabiliser + source')}
          {compactCard('Vanilla Yield', `${yieldSummary.vanillaYieldPercent.toFixed(2)}%`, `${yieldSummary.vanillaProduced.toLocaleString()} / ${yieldSummary.baseTotal.toLocaleString()}`)}
          {compactCard('Strawberry Yield', `${yieldSummary.strawberryYieldPercent.toFixed(2)}%`, `${yieldSummary.strawberryProduced.toLocaleString()} / ${yieldSummary.baseTotal.toLocaleString()}`)}
          {compactCard('Total Produced', pouchTotals.grandTotal.toLocaleString(), 'Vanilla + Strawberry')}
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  'Metric',
                  'Vanilla',
                  'Strawberry',
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 900,
                      fontSize: '0.72rem',
                      color: '#334155',
                      bgcolor: '#eef2f7',
                      borderBottom: '1px solid #d7dee7',
                      py: 0.8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Produced</TableCell>
                <TableCell>{yieldSummary.vanillaProduced.toLocaleString()}</TableCell>
                <TableCell>{yieldSummary.strawberryProduced.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Base</TableCell>
                <TableCell>{yieldSummary.baseTotal.toLocaleString()}</TableCell>
                <TableCell>{yieldSummary.baseTotal.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Yield Ratio</TableCell>
                <TableCell>{yieldSummary.vanillaYield.toFixed(4)}</TableCell>
                <TableCell>{yieldSummary.strawberryYield.toFixed(4)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Yield %</TableCell>
                <TableCell>{yieldSummary.vanillaYieldPercent.toFixed(2)}%</TableCell>
                <TableCell>{yieldSummary.strawberryYieldPercent.toFixed(2)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 1 }}>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyYieldComparison}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="month" {...chartAxisProps} />
                <YAxis {...chartAxisProps} />
                <Tooltip content={<ChartTooltipCard />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="vanillaYield" name="Vanilla Yield %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="strawberryYield" name="Strawberry Yield %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>
         </Stack>
    </Box>
  </Box>
);
}
export function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const YOGHURT_STORAGE_KEY = 'jesa-yoghurt-processing-records';

  const [entries, setEntries] = useState<OperatorDailyEntry[]>(demoOperatorEntries);
  const [freshMilkRecords, setFreshMilkRecords] = useState<FreshMilkDailyRecord[]>(demoFreshMilkRecords);
  const [yoghurtRecords, setYoghurtRecords] = useState<YoghurtProcessingDailyRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(YOGHURT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as YoghurtProcessingDailyRecord[]) : [];
    } catch (error) {
      console.error('Failed to load yoghurt processing records', error);
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(YOGHURT_STORAGE_KEY, JSON.stringify(yoghurtRecords));
    } catch (error) {
      console.error('Failed to save yoghurt processing records', error);
    }
  }, [yoghurtRecords]);

  const months = useMemo(() => {
    const start = dayjs('2026-01-01');
    return Array.from({ length: 12 }, (_, i) => start.add(i, 'month').format('YYYY-MM'));
  }, []);

  const isYoghurtOperator =
    user.role === 'operator' &&
    YOGHURT_OPERATORS.includes(user.name as (typeof YOGHURT_OPERATORS)[number]);

  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? '2026-03');
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
  const [shiftFilters, setShiftFilters] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<SectionKey>(
    user.role === 'admin'
      ? 'dashboard'
      : user.workspace === 'fresh-milk'
        ? 'fresh-milk'
        : isYoghurtOperator
          ? 'yoghurt-processing'
          : 'operator-entry',
  );

  const availableSections = user.role === 'admin'
    ? adminSections
    : user.workspace === 'fresh-milk'
      ? freshMilkOperatorSections
      : isYoghurtOperator
        ? yoghurtOperatorSections
        : pasteurizationOperatorSections;

  const visibleEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesMonth = entry.date.startsWith(selectedMonth);
      const matchesOperator =
        user.role === 'operator'
          ? entry.operatorName === user.name
          : operatorFilters.length === 0 || operatorFilters.includes(entry.operatorName);
      const matchesShift =
        shiftFilters.length === 0 ||
        shiftFilters.includes(entry.offloadingShift) ||
        shiftFilters.includes(entry.pasteurizationShift);

      return matchesMonth && matchesOperator && matchesShift;
    });
  }, [entries, operatorFilters, selectedMonth, shiftFilters, user.name, user.role]);

  const productionRecords = useMemo(() => deriveProductionRecords(visibleEntries), [visibleEntries]);
  const cipRecords = useMemo(() => deriveCipRecords(visibleEntries), [visibleEntries]);
  const summary = useMemo(() => buildMonthlySummary(productionRecords, cipRecords), [productionRecords, cipRecords]);
  const chartData = useMemo(() => buildChartData(productionRecords), [productionRecords]);
  const chemicalByOperator = useMemo(() => buildChemicalUsageByOperator(cipRecords), [cipRecords]);
  const ranking = useMemo(() => buildOperatorRanking(productionRecords, cipRecords), [productionRecords, cipRecords]);
  const insights = useMemo(() => buildInsights(productionRecords, cipRecords), [productionRecords, cipRecords]);
  const performance = useMemo(() => buildOperatorPerformance(entries, selectedMonth), [entries, selectedMonth]);
  const [selectedPerformanceOperator, setSelectedPerformanceOperator] = useState<string>('');

  useEffect(() => {
    if (!selectedPerformanceOperator && performance.operators.length > 0) {
      setSelectedPerformanceOperator(performance.operators[0].operator);
    }
  }, [performance, selectedPerformanceOperator]);

  const operatorRows = useMemo(
    () => getMonthlyDays(selectedMonth, user.name, entries),
    [entries, selectedMonth, user.name],
  );

  const yoghurtOperatorRows = useMemo(
    () => getMonthlyYoghurtDays(selectedMonth, user.name, yoghurtRecords),
    [selectedMonth, user.name, yoghurtRecords],
  );

  const yoghurtTotalsByOperator = useMemo(
    () => buildYoghurtTotalsByOperator(yoghurtRecords, selectedMonth),
    [yoghurtRecords, selectedMonth],
  );

  const totalYoghurtInputs = useMemo(() => {
    const monthRecords = yoghurtRecords.filter((record) => record.date.startsWith(selectedMonth));
    return buildYoghurtMonthlyTotals(monthRecords);
  }, [yoghurtRecords, selectedMonth]);

  const commitOperatorRows = useCallback((updatedRows: OperatorDailyEntry[]) => {
    setEntries((current) => {
      const next = [...current];

      updatedRows.forEach((updatedRow) => {
        const index = next.findIndex((entry) => entry.id === updatedRow.id);
        if (index >= 0) {
          next[index] = updatedRow;
        } else {
          next.push(updatedRow);
        }
      });

      return next;
    });
  }, []);

  const commitYoghurtRecord = useCallback((updatedRecord: YoghurtProcessingDailyRecord) => {
    setYoghurtRecords((current) => {
      const index = current.findIndex((record) => record.id === updatedRecord.id);
      if (index >= 0) {
        const next = [...current];
        next[index] = updatedRecord;
        return next;
      }
      return [...current, updatedRecord];
    });
  }, []);

  const addFreshMilkRecord = useCallback((record: FreshMilkDailyRecord) => {
    setFreshMilkRecords((current) => [record, ...current]);
  }, []);

      const handleExportMonthlyReport = useCallback(async () => {
    try {
      const { exportMonthlyReport } = await import('@/app/lib/report-export');

      await exportMonthlyReport({
        month: selectedMonth,
        totalOffloaded: Number(summary?.totalOffloaded ?? 0),
        totalPasteurized: Number(summary?.totalPasteurized ?? 0),
        lossRate: Number(summary?.lossPercentage ?? 0),
        topOperator: ranking?.[0]?.operator ?? 'N/A',
        chartElementId: 'milk-movement-chart',
        chartData: (chartData ?? []).map((row: any) => ({
          date: row.date ?? row.label ?? '',
          offloaded: Number(row.offloaded ?? 0),
          pasteurized: Number(row.pasteurized ?? row.used ?? 0),
        })),
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('PowerPoint export failed. Check report-export.ts.');
    }
  }, [selectedMonth, summary, ranking, chartData]);
  const YoghurtInputCell = ({
    defaultValue,
    onCommit,
  }: {
    defaultValue: number;
    onCommit: (value: number) => void;
  }) => {
    return (
      <Box
        sx={{
          border: '1px solid rgba(148,163,184,0.35)',
          borderRadius: 1.5,
          px: 1.2,
          py: 0.35,
          minHeight: 42,
          minWidth: 90,
          display: 'flex',
          alignItems: 'center',
          bgcolor: '#fff',
        }}
      >
        <InputBase
          type="number"
          defaultValue={defaultValue}
          onBlur={(event) => {
            const value = event.target.value === '' ? 0 : Number(event.target.value);
            onCommit(Number.isFinite(value) ? value : 0);
          }}
          sx={{ width: '100%', fontSize: '0.95rem' }}
        />
      </Box>
    );
  };

  const YoghurtOperatorPage = () => {
    return (
      <SectionCard
        title="Yoghurt processing daily inputs"
        description={`Daily input capture for ${user.name}. Monthly totals will flow to executive control automatically.`}
      >
        <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.16)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  'Date',
                  'Yoghurt Milk STD (L)',
                  'Sugar (kg)',
                  'Stabiliser (kg)',
                  'Source (g)',
                  'Fresh Q Culture',
                  'Colour (ml)',
                  'Flavour (L)',
                  'Delvo Fresh Culture',
                ].map((header) => (
                  <TableCell key={header} sx={{ fontWeight: 800, py: 1.1, whiteSpace: 'nowrap' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {yoghurtOperatorRows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {dayjs(row.date).format('DD MMM')}
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.yoghurtMilkStdLitres}
                      onCommit={(value) => commitYoghurtRecord({ ...row, yoghurtMilkStdLitres: value })}
                    />
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.sugarKg}
                      onCommit={(value) => commitYoghurtRecord({ ...row, sugarKg: value })}
                    />
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.stabiliserKg}
                      onCommit={(value) => commitYoghurtRecord({ ...row, stabiliserKg: value })}
                    />
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.sourceGrams}
                      onCommit={(value) => commitYoghurtRecord({ ...row, sourceGrams: value })}
                    />
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.freshQCulture}
                      onCommit={(value) => commitYoghurtRecord({ ...row, freshQCulture: value })}
                    />
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.colourMl}
                      onCommit={(value) => commitYoghurtRecord({ ...row, colourMl: value })}
                    />
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.flavourLitres}
                      onCommit={(value) => commitYoghurtRecord({ ...row, flavourLitres: value })}
                    />
                  </TableCell>

                  <TableCell>
                    <YoghurtInputCell
                      defaultValue={row.delvoFreshCulture}
                      onCommit={(value) => commitYoghurtRecord({ ...row, delvoFreshCulture: value })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            mt: 1.2,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
            gap: 1,
          }}
        >
          <CompactMetricCard
            title="Milk STD"
            value={`${buildYoghurtMonthlyTotals(yoghurtOperatorRows).yoghurtMilkStdLitres.toLocaleString()} L`}
            helper="This month"
            icon={<OpacityRounded />}
            tone="neutral"
            trend="Captured"
          />
          <CompactMetricCard
            title="Sugar"
            value={`${buildYoghurtMonthlyTotals(yoghurtOperatorRows).sugarKg.toLocaleString()} kg`}
            helper="This month"
            icon={<ScienceRounded />}
            tone="neutral"
            trend="Captured"
          />
          <CompactMetricCard
            title="Flavour"
            value={`${buildYoghurtMonthlyTotals(yoghurtOperatorRows).flavourLitres.toLocaleString()} L`}
            helper="This month"
            icon={<LocalDrinkRounded />}
            tone="neutral"
            trend="Captured"
          />
          <CompactMetricCard
            title="Colour"
            value={`${buildYoghurtMonthlyTotals(yoghurtOperatorRows).colourMl.toLocaleString()} ml`}
            helper="This month"
            icon={<InsightsRounded />}
            tone="neutral"
            trend="Captured"
          />
        </Box>
      </SectionCard>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff7ed 0%, #fffaf5 45%, #f8fbff 100%)',
        px: { xs: 1, md: 1.4 },
        py: 1.1,
      }}
    >
      <Box
        sx={{
          maxWidth: 1600,
          mx: 'auto',
        }}
      >
                <Box
  sx={{
    borderRadius: 2,
    border: '1px solid #eadfcb',
    bgcolor: '#fffaf2',
    px: 1.2,
    py: 1.1,
    boxShadow: '0 8px 24px rgba(148, 110, 58, 0.08)',
  }}
>
  <Stack spacing={1.1}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', xl: 'auto 1fr auto' },
        gap: 1,
        alignItems: 'center',
      }}
    >
      <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap" useFlexGap>
        <Box
          sx={{
            px: 1.1,
            py: 0.5,
            borderRadius: 999,
            bgcolor: '#fff1cc',
            border: '1px solid #f1d38a',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 900,
              color: '#7c5a10',
              lineHeight: 1,
              letterSpacing: '0.02em',
            }}
          >
            {user.role === 'admin' ? 'Executive control' : user.name}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '0.9rem',
            fontWeight: 900,
            color: '#3f3426',
            letterSpacing: '0.01em',
          }}
        >
          Jesa production tracker
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.55,
          alignItems: 'center',
          justifyContent: { xs: 'flex-start', xl: 'center' },
          minWidth: 0,
        }}
      >
        {availableSections.map((section) => {
          const active = section.key === activeSection;

          const sectionStyles: Record<
            SectionKey,
            {
              activeBg: string;
              activeBorder: string;
              activeColor: string;
              idleBg: string;
              idleBorder: string;
            }
          > = {
            dashboard: {
              activeBg: '#dbeafe',
              activeBorder: '#93c5fd',
              activeColor: '#1d4ed8',
              idleBg: '#f8fafc',
              idleBorder: '#d7dee7',
            },
            intake: {
              activeBg: '#dcfce7',
              activeBorder: '#86efac',
              activeColor: '#15803d',
              idleBg: '#f8fafc',
              idleBorder: '#d7dee7',
            },
            cip: {
              activeBg: '#fef3c7',
              activeBorder: '#fcd34d',
              activeColor: '#b45309',
              idleBg: '#f8fafc',
              idleBorder: '#d7dee7',
            },
            operators: {
              activeBg: '#ede9fe',
              activeBorder: '#c4b5fd',
              activeColor: '#6d28d9',
              idleBg: '#f8fafc',
              idleBorder: '#d7dee7',
            },
            'operator-entry': {
              activeBg: '#fee2e2',
              activeBorder: '#fca5a5',
              activeColor: '#b91c1c',
              idleBg: '#f8fafc',
              idleBorder: '#d7dee7',
            },
            'fresh-milk': {
              activeBg: '#cffafe',
              activeBorder: '#67e8f9',
              activeColor: '#0f766e',
              idleBg: '#f8fafc',
              idleBorder: '#d7dee7',
            },
            'yoghurt-processing': {
              activeBg: '#ffedd5',
              activeBorder: '#fdba74',
              activeColor: '#c2410c',
              idleBg: '#f8fafc',
              idleBorder: '#d7dee7',
            },
          };

          const palette = sectionStyles[section.key];

          return (
            <Button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              startIcon={section.icon}
              size="small"
              sx={{
                minHeight: 32,
                px: 1.05,
                borderRadius: 999,
                textTransform: 'none',
                color: active ? palette.activeColor : '#475569',
                bgcolor: active ? palette.activeBg : palette.idleBg,
                border: `1px solid ${active ? palette.activeBorder : palette.idleBorder}`,
                boxShadow: active ? '0 3px 10px rgba(15, 23, 42, 0.06)' : 'none',
                '&:hover': {
                  bgcolor: active ? palette.activeBg : '#f1f5f9',
                  boxShadow: 'none',
                },
                '& .MuiButton-startIcon': {
                  mr: 0.45,
                  color: active ? palette.activeColor : '#64748b',
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {section.label}
              </Typography>
            </Button>
          );
        })}
      </Box>

      <Stack
        direction="row"
        spacing={0.65}
        alignItems="center"
        justifyContent={{ xs: 'flex-start', xl: 'flex-end' }}
        flexWrap="wrap"
        useFlexGap
      >
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Month</InputLabel>
          <Select
            value={selectedMonth}
            label="Month"
            onChange={(event) => setSelectedMonth(event.target.value)}
            sx={{
              bgcolor: '#ffffff',
              borderRadius: 1.2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#d9cdb8',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#c9b89b',
              },
              '& .MuiSelect-select': {
                py: 0.82,
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#3f3426',
              },
            }}
          >
            {months.map((month) => (
              <MenuItem key={month} value={month}>
                {dayjs(`${month}-01`).format('MMMM YYYY')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {user.role === 'admin' ? (
          <Button
            onClick={handleExportMonthlyReport}
            size="small"
            sx={{
              minHeight: 36,
              px: 1.2,
              borderRadius: 999,
              color: '#ffffff',
              bgcolor: '#2563eb',
              fontWeight: 900,
              textTransform: 'none',
              boxShadow: '0 6px 14px rgba(37, 99, 235, 0.22)',
              '&:hover': {
                bgcolor: '#1d4ed8',
              },
            }}
          >
            Export report
          </Button>
        ) : null}

        <Button
          onClick={onLogout}
          size="small"
          sx={{
            minHeight: 36,
            px: 1.1,
            borderRadius: 999,
            color: '#3f3426',
            border: '1px solid #d9cdb8',
            bgcolor: '#fffdf8',
            fontWeight: 900,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#f8f1e4',
            },
          }}
        >
          Sign out
        </Button>
      </Stack>
    </Box>
  </Stack>
</Box>
        <Box sx={{ pt: 0.8 }}>
          {user.role === 'admin' && activeSection === 'dashboard' ? (
            <Stack spacing={1.1}>
              <DashboardOverview
  summary={summary}
  selectedMonth={selectedMonth}
  yoghurtRecords={yoghurtRecords}
/>
                            <SectionCard
                title="Yoghurt processing monthly totals"
                description="Monthly yoghurt input totals for Semakula Francis and Opidi Lawrence, visible on executive control."
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(5, 1fr)' },
                    gap: 1,
                    mb: 1.1,
                  }}
                >
                  <CompactMetricCard
                    title="Milk STD"
                    value={`${totalYoghurtInputs.yoghurtMilkStdLitres.toLocaleString()} L`}
                    helper="All yoghurt operators"
                    icon={<OpacityRounded />}
                    tone="neutral"
                    trend="Monthly total"
                  />
                  <CompactMetricCard
                    title="Sugar"
                    value={`${totalYoghurtInputs.sugarKg.toLocaleString()} kg`}
                    helper="All yoghurt operators"
                    icon={<ScienceRounded />}
                    tone="neutral"
                    trend="Monthly total"
                  />
                  <CompactMetricCard
                    title="Stabiliser"
                    value={`${totalYoghurtInputs.stabiliserKg.toLocaleString()} kg`}
                    helper="All yoghurt operators"
                    icon={<ScienceRounded />}
                    tone="neutral"
                    trend="Monthly total"
                  />
                  <CompactMetricCard
                    title="Source"
                    value={`${totalYoghurtInputs.sourceGrams.toLocaleString()} g`}
                    helper="All yoghurt operators"
                    icon={<InsightsRounded />}
                    tone="neutral"
                    trend="Monthly total"
                  />
                  <CompactMetricCard
                    title="Base Total"
                    value={`${(
                      totalYoghurtInputs.yoghurtMilkStdLitres +
                      totalYoghurtInputs.sugarKg +
                      totalYoghurtInputs.stabiliserKg +
                      totalYoghurtInputs.sourceGrams
                    ).toLocaleString()}`}
                    helper="Milk STD + sugar + stabiliser + source"
                    icon={<LocalDrinkRounded />}
                    tone="good"
                    trend="Base"
                  />
                </Box>

                <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.16)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {[
                          'Operator',
                          'Yoghurt Milk STD (L)',
                          'Sugar (kg)',
                          'Stabiliser (kg)',
                          'Source (g)',
                          'Fresh Q Culture',
                          'Colour (ml)',
                          'Flavour (L)',
                          'Delvo Fresh Culture',
                          'Base Total',
                        ].map((header) => (
                          <TableCell key={header} sx={{ fontWeight: 800, py: 1.1, whiteSpace: 'nowrap' }}>
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {yoghurtTotalsByOperator.map((row) => {
                        const baseTotal =
                          row.yoghurtMilkStdLitres +
                          row.sugarKg +
                          row.stabiliserKg +
                          row.sourceGrams;

                        return (
                          <TableRow key={row.operatorName} hover>
                            <TableCell sx={{ fontWeight: 800 }}>{row.operatorName}</TableCell>
                            <TableCell>{row.yoghurtMilkStdLitres.toLocaleString()}</TableCell>
                            <TableCell>{row.sugarKg.toLocaleString()}</TableCell>
                            <TableCell>{row.stabiliserKg.toLocaleString()}</TableCell>
                            <TableCell>{row.sourceGrams.toLocaleString()}</TableCell>
                            <TableCell>{row.freshQCulture.toLocaleString()}</TableCell>
                            <TableCell>{row.colourMl.toLocaleString()}</TableCell>
                            <TableCell>{row.flavourLitres.toLocaleString()}</TableCell>
                            <TableCell>{row.delvoFreshCulture.toLocaleString()}</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>{baseTotal.toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}

                      <TableRow
                        sx={{
                          '& td': {
                            fontWeight: 900,
                            bgcolor: 'rgba(241,245,249,0.95)',
                          },
                        }}
                      >
                        <TableCell>TOTAL</TableCell>
                        <TableCell>{totalYoghurtInputs.yoghurtMilkStdLitres.toLocaleString()}</TableCell>
                        <TableCell>{totalYoghurtInputs.sugarKg.toLocaleString()}</TableCell>
                        <TableCell>{totalYoghurtInputs.stabiliserKg.toLocaleString()}</TableCell>
                        <TableCell>{totalYoghurtInputs.sourceGrams.toLocaleString()}</TableCell>
                        <TableCell>{totalYoghurtInputs.freshQCulture.toLocaleString()}</TableCell>
                        <TableCell>{totalYoghurtInputs.colourMl.toLocaleString()}</TableCell>
                        <TableCell>{totalYoghurtInputs.flavourLitres.toLocaleString()}</TableCell>
                        <TableCell>{totalYoghurtInputs.delvoFreshCulture.toLocaleString()}</TableCell>
                        <TableCell>
                          {(
                            totalYoghurtInputs.yoghurtMilkStdLitres +
                            totalYoghurtInputs.sugarKg +
                            totalYoghurtInputs.stabiliserKg +
                            totalYoghurtInputs.sourceGrams
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>
            </Stack>
          ) : null}

          {user.role === 'admin' && activeSection === 'intake' ? (
            <AdminIntakePage
              summary={summary}
              chartData={chartData}
              chemicalByOperator={chemicalByOperator}
              ranking={ranking}
              insights={insights}
              productionRecords={productionRecords}
            />
          ) : null}

          {user.role === 'admin' && activeSection === 'cip' ? (
            <SectionCard title="Sanitation chemistry ledger" description="CIP chemistry records for the selected month.">
              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(148,163,184,0.16)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Date', 'Operator', 'CIP type', 'Chemical used', 'Caustic', 'Nitric'].map((header) => (
                        <TableCell key={header} sx={{ fontWeight: 800, py: 1.1 }}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cipRecords.map((record) => (
                      <TableRow key={record.id} hover sx={{ '& td': { py: 0.9 } }}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.operatorName}</TableCell>
                        <TableCell>{record.cipType}</TableCell>
                        <TableCell>{record.chemicalUsed}</TableCell>
                        <TableCell>{record.causticJerrycansUsed}</TableCell>
                        <TableCell>{record.nitricAcidJerrycansUsed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          ) : null}

          {user.role === 'admin' && activeSection === 'operators' ? (
            <OperatorPerformancePage
              performance={performance}
              selectedOperator={selectedPerformanceOperator}
              onSelectOperator={setSelectedPerformanceOperator}
            />
          ) : null}

          {activeSection === 'fresh-milk' ? (
            <FreshMilkWorkspace
              user={user}
              records={freshMilkRecords}
              onAddRecord={addFreshMilkRecord}
            />
          ) : null}

          {user.role === 'operator' && !isYoghurtOperator && user.workspace !== 'fresh-milk' && activeSection === 'operator-entry' ? (
            <OperatorMonthlyEntryTable
              rows={operatorRows}
              onCommitRows={commitOperatorRows}
              operatorName={user.name}
            />
          ) : null}

          {user.role === 'operator' && isYoghurtOperator && activeSection === 'yoghurt-processing' ? (
            <YoghurtOperatorPage />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}