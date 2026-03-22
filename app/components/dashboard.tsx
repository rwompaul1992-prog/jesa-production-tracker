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
import { demoOperatorEntries, operators } from '@/app/data/demo-data';
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
import { AppUser, CipRecord, CipType, EntryStatus, OperatorDailyEntry, OperatorPerformanceEntry, ProductionRecord, Shift } from '@/app/lib/types';

const shifts: Shift[] = ['Morning', 'Afternoon', 'Night'];
const cipTypes: CipType[] = ['Caustic wash', 'Caustic and Acid wash'];

type SectionKey = 'dashboard' | 'intake' | 'cip' | 'operators' | 'operator-entry';
type KpiTone = 'good' | 'bad' | 'warning' | 'neutral';

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
];

const operatorSections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'operator-entry', label: 'Daily operator log', description: 'Production entry and CIP logging', icon: <AssignmentTurnedInRounded fontSize="small" /> },
];

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
  if (/loss|signal|alert|surveillance/i.test(title)) {
    return { bar: '#f5b63d', tint: 'rgba(245,182,61,0.08)', text: '#7c4a03' };
  }

  if (/chemical|sanitation|cip/i.test(title)) {
    return { bar: '#123b8f', tint: 'rgba(18,59,143,0.08)', text: '#123b8f' };
  }

  return { bar: '#123b8f', tint: 'rgba(18,59,143,0.08)', text: '#123b8f' };
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
  const colors = toneMap[tone];
  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: alpha(colors.accent, 0.22),
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1.25,
        background: '#ffffff',
        transition: 'transform 0.16s ease, border-color 0.16s ease, background-color 0.16s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 3,
          background: colors.accent,
        },
        '&:hover': { transform: 'translateY(-1px)', borderColor: alpha(colors.accent, 0.34), backgroundColor: alpha(colors.accent, 0.025) },
      }}
    >
      <CardContent sx={{ p: 1.15 }}>
        <Stack spacing={0.75}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                {title}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.35, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                {value}
              </Typography>
            </Box>
            <Avatar sx={{ width: 30, height: 30, borderRadius: 0.9, bgcolor: alpha(colors.accent, 0.12), color: colors.accent }}>{icon}</Avatar>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
              {helper}
            </Typography>
            <Chip size="small" color={colors.chip} label={trend} sx={{ height: 19, borderRadius: 0.8, fontWeight: 800, bgcolor: alpha(colors.accent, 0.12), color: colors.accent }} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
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
    <Card
      sx={{
        border: '1px solid rgba(148,163,184,0.16)',
        borderRadius: 1.25,
        background: '#ffffff',
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: 1.15 }}>
        <Stack spacing={1.05}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.8}>
            <Box>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  px: 1.05,
                  py: 0.32,
                  mb: 0.5,
                  borderRadius: 0.75,
                  bgcolor: accent.bar,
                  color: '#ffffff',
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.69rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}>
                  {title}
                </Typography>
              </Box>
              {description ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.67rem', lineHeight: 1.15 }}>
                  {description}
                </Typography>
              ) : null}
            </Box>
            {action}
          </Stack>
          <Box sx={{ pt: 0.1, borderTop: '1px solid rgba(226,232,240,0.9)' }}>{children}</Box>
        </Stack>
      </CardContent>
    </Card>
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
    <Stack spacing={1.35}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 0.95 }}>
        <CompactMetricCard title="Milk offloaded" value={`${summary.totalOffloaded.toLocaleString()} L`} helper="Monthly intake volume" icon={<OpacityRounded />} tone="neutral" trend="Flow stable" />
        <CompactMetricCard title="Milk pasteurized" value={`${summary.totalPasteurized.toLocaleString()} L`} helper="Finished output" icon={<LocalDrinkRounded />} tone="good" trend="Output healthy" />
        <CompactMetricCard title="Milk loss" value={`${summary.totalLoss.toLocaleString()} L`} helper="Variance to review" icon={<WarningAmberRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : 'warning'} trend={summary.lossPercentage > 2.6 ? 'Action needed' : 'Contained'} />
        <CompactMetricCard title="Loss rate" value={`${summary.lossPercentage.toFixed(2)}%`} helper="Process efficiency" icon={<InsightsRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : summary.lossPercentage > 2 ? 'warning' : 'good'} trend={summary.lossPercentage > 2.6 ? 'High loss' : 'Within range'} />
        <CompactMetricCard title="Caustic usage" value={`${summary.totalCaustic}`} helper="Jerrycans logged" icon={<ScienceRounded />} tone="warning" trend="Chemical watch" />
        <CompactMetricCard title="Nitric usage" value={`${summary.totalNitric}`} helper="Jerrycans logged" icon={<ScienceRounded />} tone="neutral" trend="Chemical watch" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.45fr 0.85fr' }, gap: 1.1 }}>
        <Stack spacing={1.1}>
          <SectionCard title="Throughput trend" description="Daily offloaded and pasteurized volume for the active review window.">
            <Box sx={{ height: 208 }}>
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
            <Box sx={{ height: 186 }}>
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
            <Box sx={{ height: 186 }}>
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

        <Stack spacing={1.1}>
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

function DashboardOverview({ summary, chartData, ranking }: { summary: ReturnType<typeof buildMonthlySummary>; chartData: ReturnType<typeof buildChartData>; ranking: ReturnType<typeof buildOperatorRanking>; }) {
  return (
    <Stack spacing={1.05}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 1.05 }}>
        <SectionCard title="Milk movement" description="Throughput profile across daily offloaded and pasteurized volume.">
          <Box sx={{ height: 182 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="date" {...chartAxisProps} />
                <YAxis {...chartAxisProps} />
                <Tooltip content={<ChartTooltipCard />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Line type="monotone" dataKey="offloaded" stroke="#2563eb" strokeWidth={3.2} dot={false} activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 0 }} />
                <Line type="monotone" dataKey="pasteurized" stroke="#0f766e" strokeWidth={3.2} dot={false} activeDot={{ r: 5, fill: '#0f766e', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>
        <SectionCard title="Quick status" description="Top-level control signals for the current month.">
          <Stack spacing={1.2}>
            <CompactMetricCard title="Total offloaded" value={`${summary.totalOffloaded.toLocaleString()} L`} helper="Month-to-date" icon={<OpacityRounded />} tone="neutral" trend="Running" />
            <CompactMetricCard title="Loss rate" value={`${summary.lossPercentage.toFixed(2)}%`} helper="Month-to-date" icon={<WarningAmberRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : 'good'} trend={summary.lossPercentage > 2.6 ? 'Escalated' : 'Controlled'} />
            <Paper sx={{ p: 1.7, borderRadius: 4, background: 'linear-gradient(135deg, rgba(47,109,246,0.08), rgba(255,255,255,0.96))' }}><Typography variant="caption" fontWeight={800}>Top operator</Typography><Typography variant="body2" sx={{ mt: 0.4 }}>{ranking[0]?.operator ?? 'N/A'}</Typography></Paper>
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}

export function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [entries, setEntries] = useState<OperatorDailyEntry[]>(demoOperatorEntries);
  const months = useMemo(() => getAvailableMonths(entries), [entries]);
  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? '2026-03');
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
  const [shiftFilters, setShiftFilters] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<SectionKey>(user.role === 'admin' ? 'dashboard' : 'operator-entry');

  const availableSections = user.role === 'admin' ? adminSections : operatorSections;
  const visibleEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesMonth = entry.date.startsWith(selectedMonth);
      const matchesOperator = user.role === 'operator'
        ? entry.operatorName === user.name
        : operatorFilters.length === 0 || operatorFilters.includes(entry.operatorName);
      const matchesShift = shiftFilters.length === 0 || shiftFilters.includes(entry.offloadingShift) || shiftFilters.includes(entry.pasteurizationShift);
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
  const operatorRows = useMemo(() => getMonthlyDays(selectedMonth, user.name, entries), [entries, selectedMonth, user.name]);
  const commitOperatorRows = useCallback((updatedRows: OperatorDailyEntry[]) => {
    const updates = new Map(updatedRows.map((row) => [row.id, row]));
    setEntries((current) => current.map((entry) => updates.get(entry.id) ?? entry));
  }, []);

  useEffect(() => {
    if (!performance.operators.length) {
      setSelectedPerformanceOperator('');
      return;
    }

    if (!selectedPerformanceOperator || !performance.operators.some((entry) => entry.operator === selectedPerformanceOperator)) {
      setSelectedPerformanceOperator(performance.operators[0].operator);
    }
  }, [performance.operators, selectedPerformanceOperator]);

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f5f7fb 0%, #f8fbff 52%, #ffffff 100%)' }}>
      <Box sx={{ maxWidth: 1660, mx: 'auto', px: { xs: 1.2, md: 1.8 }, pb: { xs: 1.6, md: 2.2 } }}>
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            pt: { xs: 0.2, md: 0.28 },
            pb: 0.28,
            borderBottom: '1px solid rgba(226,232,240,0.9)',
            bgcolor: 'rgba(245,247,251,0.96)',
          }}
        >
          <Stack
            direction="row"
            sx={{
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 0.8,
              flexWrap: { xs: 'wrap', xl: 'nowrap' },
              py: 0.35,
            }}
          >
            <Stack
              direction="row"
              spacing={0.6}
              sx={{ flex: { xs: '1 1 100%', xl: '0 1 auto' }, minWidth: { xs: '100%', xl: 0 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
            >
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel>Month</InputLabel>
                <Select value={selectedMonth} label="Month" onChange={(event) => setSelectedMonth(event.target.value)}>
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>{dayjs(`${month}-01`).format('MMMM YYYY')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {user.role === 'admin' ? (
                <>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 } }}>
                    <InputLabel>Operators</InputLabel>
                    <Select multiple value={operatorFilters} label="Operators" onChange={(event) => setOperatorFilters(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)} renderValue={(selected) => (selected as string[]).length === 0 ? 'All operators' : (selected as string[]).join(', ')}>
                      {operators.map((operator) => (
                        <MenuItem key={operator} value={operator}>
                          <Checkbox checked={operatorFilters.includes(operator)} />
                          <ListItemText primary={operator} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 168 } }}>
                    <InputLabel>Shifts</InputLabel>
                    <Select multiple value={shiftFilters} label="Shifts" onChange={(event) => setShiftFilters(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)} renderValue={(selected) => (selected as string[]).length === 0 ? 'All shifts' : (selected as string[]).join(', ')}>
                      {shifts.map((shift) => (
                        <MenuItem key={shift} value={shift}>
                          <Checkbox checked={shiftFilters.includes(shift)} />
                          <ListItemText primary={shift} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              ) : null}
            </Stack>

            <Stack
              direction="row"
              spacing={0.55}
              justifyContent="center"
              sx={{ flex: { xs: '1 1 100%', xl: '1 1 auto' }, flexWrap: 'wrap', minWidth: 0 }}
            >
              {availableSections.map((section) => {
                const active = section.key === activeSection;
                const accent =
                  section.key === 'dashboard'
                    ? '#2563eb'
                    : section.key === 'intake'
                      ? '#0f766e'
                      : section.key === 'cip'
                        ? '#7c3aed'
                        : section.key === 'operators'
                          ? '#ea580c'
                          : '#2563eb';
                return (
                  <Button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    startIcon={section.icon}
                    size="small"
                    sx={{
                      minHeight: 27,
                      px: 0.95,
                      borderRadius: 1.25,
                      color: active ? 'common.white' : '#111827',
                      bgcolor: active ? accent : '#ffffff',
                      border: `1px solid ${active ? accent : 'rgba(148,163,184,0.26)'}`,
                      boxShadow: active ? `inset 0 -1px 0 ${alpha('#000', 0.08)}` : 'none',
                      '&:hover': {
                        bgcolor: active ? alpha(accent, 0.92) : '#f8fafc',
                      },
                      '& .MuiButton-startIcon': {
                        mr: 0.5,
                        color: active ? 'common.white' : '#475569',
                      },
                    }}
                  >
                    <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: '0.01em', fontSize: '0.68rem' }}>
                      {section.label}
                    </Typography>
                  </Button>
                );
              })}
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', xl: 'flex-end' }, flex: { xs: '1 1 100%', xl: '0 0 auto' } }}>
              <Button
                onClick={onLogout}
                size="small"
                sx={{
                  minWidth: 0,
                  px: 0.95,
                  py: 0.34,
                  borderRadius: 1.25,
                  color: '#0f172a',
                  border: '1px solid rgba(148,163,184,0.26)',
                  bgcolor: '#ffffff',
                  fontWeight: 800,
                }}
              >
                Sign out
              </Button>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ pt: 0.8 }}>
          {user.role === 'admin' && activeSection === 'dashboard' ? <DashboardOverview summary={summary} chartData={chartData} ranking={ranking} /> : null}
          {user.role === 'admin' && activeSection === 'intake' ? <AdminIntakePage summary={summary} chartData={chartData} chemicalByOperator={chemicalByOperator} ranking={ranking} insights={insights} productionRecords={productionRecords} /> : null}
          {user.role === 'admin' && activeSection === 'cip' ? (
            <SectionCard title="Sanitation chemistry ledger" description="CIP chemistry records for the selected month.">
              <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(148,163,184,0.16)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {['Date', 'Operator', 'CIP type', 'Chemical used', 'Caustic', 'Nitric'].map((header) => <TableCell key={header} sx={{ fontWeight: 800, py: 1.1 }}>{header}</TableCell>)}
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
          {user.role === 'operator' && activeSection === 'operator-entry' ? <OperatorMonthlyEntryTable rows={operatorRows} onCommitRows={commitOperatorRows} operatorName={user.name} /> : null}
        </Box>
      </Box>
    </Box>
  );
}
