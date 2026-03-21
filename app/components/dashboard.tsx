'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  IconButton,
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
import MenuRounded from '@mui/icons-material/MenuRounded';
import OpacityRounded from '@mui/icons-material/OpacityRounded';
import ScienceRounded from '@mui/icons-material/ScienceRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import FactoryRounded from '@mui/icons-material/FactoryRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import DashboardRounded from '@mui/icons-material/DashboardRounded';
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';
import CleaningServicesRounded from '@mui/icons-material/CleaningServicesRounded';
import LeaderboardRounded from '@mui/icons-material/LeaderboardRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import FilterAltRounded from '@mui/icons-material/FilterAltRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import AssignmentTurnedInRounded from '@mui/icons-material/AssignmentTurnedInRounded';
import PendingRounded from '@mui/icons-material/PendingRounded';
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
  buildOperatorRanking,
  getLossPercentage,
  getMilkLoss,
} from '@/app/lib/analytics';
import { AppUser, CipRecord, CipType, EntryStatus, OperatorDailyEntry, ProductionRecord, Shift } from '@/app/lib/types';

const drawerWidth = 260;
const shifts: Shift[] = ['Morning', 'Afternoon', 'Night'];
const cipTypes: CipType[] = ['Pre-rinse', 'Caustic wash', 'Acid wash', 'Final rinse'];

type SectionKey = 'dashboard' | 'intake' | 'cip' | 'operators' | 'operator-entry';
type KpiTone = 'good' | 'bad' | 'warning' | 'neutral';

const toneMap: Record<KpiTone, { accent: string; chip: 'success' | 'error' | 'warning' | 'primary' }> = {
  good: { accent: '#16a34a', chip: 'success' },
  bad: { accent: '#dc2626', chip: 'error' },
  warning: { accent: '#f59e0b', chip: 'warning' },
  neutral: { accent: '#2563eb', chip: 'primary' },
};

const adminSections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'dashboard', label: 'Dashboard', description: 'Compact executive overview', icon: <DashboardRounded fontSize="small" /> },
  { key: 'intake', label: 'Intake & Pasteurization', description: 'Production analytics', icon: <LocalDrinkRounded fontSize="small" /> },
  { key: 'cip', label: 'GEA CIP Usage', description: 'Chemical records', icon: <CleaningServicesRounded fontSize="small" /> },
  { key: 'operators', label: 'Operator Performance', description: 'Rankings and review', icon: <LeaderboardRounded fontSize="small" /> },
];

const operatorSections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'operator-entry', label: 'Operator Monthly Entry', description: 'Your daily production log', icon: <AssignmentTurnedInRounded fontSize="small" /> },
];

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
    remarks: entry.notes,
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
      notes: entry.notes,
    }));
}

function getMonthlyDays(monthKey: string, operatorName: string, entries: OperatorDailyEntry[]) {
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
        offloadingShift: 'Morning',
        pasteurizationShift: 'Afternoon',
        milkOffloaded: 0,
        milkPasteurized: 0,
        cipDone: false,
        cipType: 'Pre-rinse',
        causticJerrycansUsed: 0,
        nitricJerrycansUsed: 0,
        notes: '',
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
    entry.notes.trim().length > 0 ||
    entry.cipDone;

  if (!hasData && !touchedIds.has(entry.id)) return 'missing';
  if (pendingIds.has(entry.id)) return 'pending';
  return 'saved';
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
        borderColor: alpha(colors.accent, 0.14),
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 18px 34px ${alpha(colors.accent, 0.12)}` },
      }}
    >
      <CardContent sx={{ p: 2.1 }}>
        <Stack spacing={1.4}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.7, fontWeight: 800 }}>
                {value}
              </Typography>
            </Box>
            <Avatar sx={{ width: 42, height: 42, bgcolor: alpha(colors.accent, 0.1), color: colors.accent }}>{icon}</Avatar>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
            <Chip size="small" color={colors.chip} label={trend} />
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
  return (
    <Card sx={{ border: '1px solid rgba(148,163,184,0.14)' }}>
      <CardContent sx={{ p: 2.2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {title}
              </Typography>
              {description ? (
                <Typography variant="caption" color="text.secondary">
                  {description}
                </Typography>
              ) : null}
            </Box>
            {action}
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function AdminProductionTable({
  records,
}: {
  records: ProductionRecord[];
}) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, maxHeight: 420, border: '1px solid rgba(148,163,184,0.16)' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {['Date', 'Operator', 'Offload shift', 'Pasteurization shift', 'Offloaded', 'Pasteurized', 'Loss', 'Loss %', 'Remarks'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 800, bgcolor: '#f8fafc', py: 1.2 }}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record, index) => {
            const loss = getMilkLoss(record);
            const lossPercent = getLossPercentage(record);
            const tone = lossPercent > 2.6 ? 'rgba(254,226,226,0.55)' : lossPercent < 1.8 ? 'rgba(220,252,231,0.45)' : index % 2 === 0 ? 'rgba(248,250,252,0.8)' : 'white';
            return (
              <TableRow key={record.id} hover sx={{ bgcolor: tone, '& td': { py: 0.9 } }}>
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

function OperatorMonthlyEntryTable({
  rows,
  setEntries,
  operatorName,
  pendingIds,
  touchedIds,
  onSaveAll,
}: {
  rows: OperatorDailyEntry[];
  setEntries: React.Dispatch<React.SetStateAction<OperatorDailyEntry[]>>;
  operatorName: string;
  pendingIds: Set<string>;
  touchedIds: Set<string>;
  onSaveAll: () => void;
}) {
  const updateEntry = <K extends keyof OperatorDailyEntry>(id: string, field: K, value: OperatorDailyEntry[K]) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)),
    );
  };

  return (
    <SectionCard
      title="Operator Monthly Entry"
      description={`Daily production and CIP logging workspace for ${operatorName}. Milk loss and loss % are calculated automatically.`}
      action={<Button startIcon={<SaveRounded />} onClick={onSaveAll}>Save all</Button>}
    >
      <TableContainer component={Paper} sx={{ borderRadius: 3, maxHeight: 560, border: '1px solid rgba(148,163,184,0.16)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {['Date', 'Status', 'Offloading shift', 'Pasteurization shift', 'Milk offloaded', 'Milk pasteurized', 'Milk loss', 'Loss %', 'CIP done?', 'CIP type', 'Caustic', 'Nitric', 'Notes'].map((header) => (
                <TableCell key={header} sx={{ fontWeight: 800, bgcolor: '#f8fafc', py: 1.1, whiteSpace: 'nowrap' }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const production: ProductionRecord = {
                id: row.id,
                date: row.date,
                offloadingShift: row.offloadingShift,
                pasteurizationShift: row.pasteurizationShift,
                offloadingOperator: row.operatorName,
                pasteurizationOperator: row.operatorName,
                totalMilkOffloaded: row.milkOffloaded,
                totalMilkPasteurized: row.milkPasteurized,
                remarks: row.notes,
              };
              const loss = getMilkLoss(production);
              const lossPercentage = getLossPercentage(production);
              const hasGain = row.milkPasteurized > row.milkOffloaded && row.milkOffloaded > 0;
              const isHighLoss = lossPercentage > 2.6;
              const status = getEntryStatus(row, pendingIds, touchedIds);
              const rowColor = hasGain
                ? 'rgba(254,240,138,0.35)'
                : isHighLoss
                  ? 'rgba(254,226,226,0.5)'
                  : index % 2 === 0
                    ? 'rgba(248,250,252,0.86)'
                    : 'white';
              const statusChip =
                status === 'saved'
                  ? <Chip size="small" color="success" icon={<AssignmentTurnedInRounded />} label="saved" />
                  : status === 'pending'
                    ? <Chip size="small" color="warning" icon={<PendingRounded />} label="pending" />
                    : <Chip size="small" color="default" label="missing" />;

              return (
                <TableRow key={row.id} hover sx={{ bgcolor: rowColor, '& td': { py: 0.7 } }}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{statusChip}</TableCell>
                  <TableCell>
                    <TextField select size="small" value={row.offloadingShift} onChange={(event) => updateEntry(row.id, 'offloadingShift', event.target.value as Shift)}>
                      {shifts.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField select size="small" value={row.pasteurizationShift} onChange={(event) => updateEntry(row.id, 'pasteurizationShift', event.target.value as Shift)}>
                      {shifts.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  <TableCell><TextField type="number" size="small" value={row.milkOffloaded} onChange={(event) => updateEntry(row.id, 'milkOffloaded', Number(event.target.value))} /></TableCell>
                  <TableCell><TextField type="number" size="small" value={row.milkPasteurized} onChange={(event) => updateEntry(row.id, 'milkPasteurized', Number(event.target.value))} /></TableCell>
                  <TableCell><Chip size="small" color={hasGain ? 'warning' : isHighLoss ? 'error' : 'success'} label={`${(row.milkOffloaded - row.milkPasteurized).toLocaleString()} L`} /></TableCell>
                  <TableCell><Chip size="small" color={hasGain ? 'warning' : isHighLoss ? 'error' : 'success'} label={`${row.milkOffloaded === 0 ? 0 : (((row.milkOffloaded - row.milkPasteurized) / row.milkOffloaded) * 100).toFixed(2)}%`} /></TableCell>
                  <TableCell>
                    <Select size="small" value={row.cipDone ? 'yes' : 'no'} onChange={(event) => updateEntry(row.id, 'cipDone', event.target.value === 'yes')}>
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField select size="small" value={row.cipType} onChange={(event) => updateEntry(row.id, 'cipType', event.target.value as CipType)}>
                      {cipTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  <TableCell><TextField type="number" size="small" value={row.causticJerrycansUsed} onChange={(event) => updateEntry(row.id, 'causticJerrycansUsed', Number(event.target.value))} /></TableCell>
                  <TableCell><TextField type="number" size="small" value={row.nitricJerrycansUsed} onChange={(event) => updateEntry(row.id, 'nitricJerrycansUsed', Number(event.target.value))} /></TableCell>
                  <TableCell><TextField size="small" value={row.notes} onChange={(event) => updateEntry(row.id, 'notes', event.target.value)} /></TableCell>
                </TableRow>
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
  setEntries,
}: {
  summary: ReturnType<typeof buildMonthlySummary>;
  chartData: ReturnType<typeof buildChartData>;
  chemicalByOperator: ReturnType<typeof buildChemicalUsageByOperator>;
  ranking: ReturnType<typeof buildOperatorRanking>;
  insights: ReturnType<typeof buildInsights>;
  productionRecords: ProductionRecord[];
  setEntries: React.Dispatch<React.SetStateAction<OperatorDailyEntry[]>>;
}) {
  const abnormalOperators = ranking.filter((entry) => entry.lossRate > 2.5).map((entry) => entry.operator);

  return (
    <Stack spacing={2.2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 1.6 }}>
        <CompactMetricCard title="Milk Offloaded" value={`${summary.totalOffloaded.toLocaleString()} L`} helper="Monthly intake" icon={<OpacityRounded />} tone="neutral" trend="↑ active" />
        <CompactMetricCard title="Milk Pasteurized" value={`${summary.totalPasteurized.toLocaleString()} L`} helper="Monthly output" icon={<LocalDrinkRounded />} tone="good" trend="↑ stable" />
        <CompactMetricCard title="Milk Loss" value={`${summary.totalLoss.toLocaleString()} L`} helper="Derived variance" icon={<WarningAmberRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : 'warning'} trend={summary.lossPercentage > 2.6 ? '↑ risk' : '↓ contained'} />
        <CompactMetricCard title="Loss %" value={`${summary.lossPercentage.toFixed(2)}%`} helper="Process efficiency" icon={<InsightsRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : summary.lossPercentage > 2 ? 'warning' : 'good'} trend={summary.lossPercentage > 2.6 ? '↑ high' : '↓ good'} />
        <CompactMetricCard title="Caustic Used" value={`${summary.totalCaustic}`} helper="Jerrycans" icon={<ScienceRounded />} tone="warning" trend="→ monitored" />
        <CompactMetricCard title="Nitric Used" value={`${summary.totalNitric}`} helper="Jerrycans" icon={<ScienceRounded />} tone="neutral" trend="→ monitored" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.45fr 0.85fr' }, gap: 1.8 }}>
        <Stack spacing={1.8}>
          <SectionCard title="Daily Offloaded vs Pasteurized" description="Compact throughput view for the selected month and filter set.">
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="offloaded" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="pasteurized" stroke="#14b8a6" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>

          <SectionCard title="Daily Milk Loss Trend" description="Area chart for fast anomaly detection.">
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="lossFillAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="loss" stroke="#dc2626" fill="url(#lossFillAdmin)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>

          <SectionCard title="Chemical Usage by Operator" description="Caustic and nitric usage by operator for the selected month.">
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chemicalByOperator}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="operator" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="caustic" fill="#475569" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="nitric" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Stack>

        <Stack spacing={1.8}>
          <SectionCard title="Operator Ranking" description="Best-to-worst operator comparison for the filtered month.">
            <Stack spacing={1.2}>
              {ranking.map((entry) => (
                <Paper key={entry.operator} sx={{ p: 1.5, borderRadius: 3, border: '1px solid rgba(148,163,184,0.12)' }}>
                  <Stack spacing={0.9}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={800}>#{entry.rank} {entry.operator}</Typography>
                      <Chip size="small" color={entry.rank === 1 ? 'success' : entry.rank === ranking.length ? 'error' : 'primary'} label={`${entry.score.toFixed(1)} pts`} />
                    </Stack>
                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={`Loss ${entry.lossRate.toFixed(2)}%`} color={entry.lossRate > 2.5 ? 'error' : 'success'} />
                      <Chip size="small" label={`Chem ${entry.chemicalIntensity.toFixed(2)}`} color="warning" />
                      <Chip size="small" label={`Data ${entry.completeness.toFixed(0)}%`} color="primary" />
                    </Stack>
                    <LinearProgress variant="determinate" value={entry.completeness} sx={{ height: 7, borderRadius: 10 }} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard title="Insights" description="Warnings and operational review notes.">
            <Stack spacing={1.2}>
              <Paper sx={{ p: 1.5, borderRadius: 3 }}><Typography variant="caption" color="warning.main" fontWeight={800}>High milk loss days</Typography><Typography variant="body2">{insights.highMilkLoss}</Typography></Paper>
              <Paper sx={{ p: 1.5, borderRadius: 3 }}><Typography variant="caption" color="error.main" fontWeight={800}>Abnormal operators</Typography><Typography variant="body2">{abnormalOperators.length ? abnormalOperators.join(', ') : 'No abnormal operators in current filters.'}</Typography></Paper>
              <Paper sx={{ p: 1.5, borderRadius: 3 }}><Typography variant="caption" color="text.secondary" fontWeight={800}>Missing entries</Typography><Typography variant="body2">{insights.missingEntries}</Typography></Paper>
              <Paper sx={{ p: 1.5, borderRadius: 3 }}><Typography variant="caption" color="success.main" fontWeight={800}>Best operator</Typography><Typography variant="body2">{insights.bestOperator}</Typography></Paper>
              <Paper sx={{ p: 1.5, borderRadius: 3 }}><Typography variant="caption" color="error.main" fontWeight={800}>Worst operator</Typography><Typography variant="body2">{insights.worstOperator}</Typography></Paper>
            </Stack>
          </SectionCard>
        </Stack>
      </Box>

      <SectionCard title="Admin Review Table" description="Compact review of monthly production records. Filter by month, operator, and shift above to focus the review set.">
        <AdminProductionTable records={productionRecords} />
      </SectionCard>
    </Stack>
  );
}

function DashboardOverview({ summary, chartData, ranking }: { summary: ReturnType<typeof buildMonthlySummary>; chartData: ReturnType<typeof buildChartData>; ranking: ReturnType<typeof buildOperatorRanking>; }) {
  return (
    <Stack spacing={1.8}>
      <Box sx={{ p: 2.2, borderRadius: 4, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: 'white' }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.14em', opacity: 0.84 }}>Industrial operations system</Typography>
        <Typography variant="h6" sx={{ mt: 0.5 }}>Executive production overview</Typography>
        <Typography variant="body2" sx={{ mt: 0.8, opacity: 0.82 }}>Compact view of the current month’s dairy intake, pasteurization, and operator performance.</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 1.8 }}>
        <SectionCard title="Milk Movement" description="Daily offloaded vs pasteurized throughput.">
          <Box sx={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="offloaded" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="pasteurized" stroke="#16a34a" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>
        <SectionCard title="Quick status" description="Top-level control signals for the current month.">
          <Stack spacing={1.2}>
            <CompactMetricCard title="Total offloaded" value={`${summary.totalOffloaded.toLocaleString()} L`} helper="Monthly" icon={<OpacityRounded />} tone="neutral" trend="active" />
            <CompactMetricCard title="Loss %" value={`${summary.lossPercentage.toFixed(2)}%`} helper="Monthly" icon={<WarningAmberRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : 'good'} trend={summary.lossPercentage > 2.6 ? 'risk' : 'stable'} />
            <Paper sx={{ p: 1.5, borderRadius: 3 }}><Typography variant="caption" fontWeight={800}>Top operator</Typography><Typography variant="body2">{ranking[0]?.operator ?? 'N/A'}</Typography></Paper>
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}

export function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [entries, setEntries] = useState(demoOperatorEntries);
  const months = useMemo(() => getAvailableMonths(entries), [entries]);
  const [selectedMonth, setSelectedMonth] = useState(months[0] ?? '2026-03');
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
  const [shiftFilters, setShiftFilters] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<SectionKey>(user.role === 'admin' ? 'dashboard' : 'operator-entry');
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [touchedIds, setTouchedIds] = useState<Set<string>>(new Set());

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
  const operatorRows = useMemo(() => getMonthlyDays(selectedMonth, user.name, entries), [entries, selectedMonth, user.name]);
  const currentSection = availableSections.find((section) => section.key === activeSection) ?? availableSections[0];

  useEffect(() => {
    const changedIds = new Set<string>();
    const currentIds = new Set(entries.map((entry) => entry.id));
    currentIds.forEach((id) => {
      if (!touchedIds.has(id)) return;
      changedIds.add(id);
    });
    if (changedIds.size === 0) return;

    setPendingIds(changedIds);
    const timer = setTimeout(() => {
      setPendingIds(new Set());
    }, 900);
    return () => clearTimeout(timer);
  }, [entries, touchedIds]);

  const setEntriesWithTouch: React.Dispatch<React.SetStateAction<OperatorDailyEntry[]>> = (value) => {
    setEntries((current) => {
      const next = typeof value === 'function' ? value(current) : value;
      const changed = next
        .filter((entry, index) => {
          const previous = current[index];
          return !previous || JSON.stringify(previous) !== JSON.stringify(entry);
        })
        .map((entry) => entry.id);
      if (changed.length) {
        setTouchedIds((prev) => new Set([...prev, ...changed]));
        setPendingIds((prev) => new Set([...prev, ...changed]));
      }
      return next;
    });
  };

  const handleSaveAll = () => {
    setPendingIds(new Set());
    setTouchedIds((prev) => new Set([...prev]));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f6fb' }}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Box sx={{ width: { xs: 88, md: drawerWidth }, flexShrink: 0, bgcolor: '#0f172a', color: 'white', p: { xs: 1.4, md: 1.8 }, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, height: '100vh' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2} alignItems="center" sx={{ mb: 2.2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 42, height: 42 }}><FactoryRounded /></Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" fontWeight={900}>JESA Operations</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.62)' }}>Production tracking</Typography>
            </Box>
          </Stack>

          <Paper sx={{ p: 1.6, mb: 2, borderRadius: 3, color: 'white', background: 'linear-gradient(145deg, rgba(37,99,235,0.22), rgba(51,65,85,0.4))', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Stack spacing={0.8} alignItems={{ xs: 'center', md: 'flex-start' }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.14)' }}><GroupsRounded fontSize="small" /></Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" fontWeight={800}>{user.name}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.66)' }}>{user.role === 'admin' ? 'Admin / Supervisor' : 'Operator workspace'}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Stack spacing={0.8} sx={{ flexGrow: 1 }}>
            {availableSections.map((section) => {
              const active = section.key === activeSection;
              return (
                <Button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  startIcon={section.icon}
                  sx={{ justifyContent: { xs: 'center', md: 'flex-start' }, px: { xs: 0.7, md: 1.3 }, py: 1, color: 'white', bgcolor: active ? 'rgba(255,255,255,0.12)' : 'transparent', border: active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }, '& .MuiButton-startIcon': { mr: { xs: 0, md: 0.8 } } }}
                >
                  <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                    <Typography variant="caption" fontWeight={800}>{section.label}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.58)' }}>{section.description}</Typography>
                  </Box>
                </Button>
              );
            })}
          </Stack>

          <Button color="inherit" onClick={onLogout} sx={{ mt: 1.5, bgcolor: 'rgba(255,255,255,0.08)' }}>Logout</Button>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ position: 'sticky', top: 0, zIndex: 5, px: { xs: 1.8, md: 2.4 }, py: 1.6, borderBottom: '1px solid rgba(148,163,184,0.14)', backdropFilter: 'blur(18px)', bgcolor: 'rgba(243,246,251,0.92)' }}>
            <Stack spacing={1.4}>
              <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" spacing={1.5}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <IconButton sx={{ display: { md: 'none' }, bgcolor: 'white' }}><MenuRounded /></IconButton>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.12em', fontWeight: 800 }}>Industrial dairy operations / {selectedMonth}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{currentSection.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{currentSection.description}</Typography>
                  </Box>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
                  <Chip icon={<WaterDropRounded />} size="small" color={summary.lossPercentage > 2.6 ? 'error' : 'warning'} label={`${summary.totalLoss.toLocaleString()} L loss`} />
                  <Chip icon={<NotificationsActiveRounded />} size="small" color={pendingIds.size > 0 ? 'warning' : 'success'} label={pendingIds.size > 0 ? `${pendingIds.size} pending saves` : 'All changes saved'} />
                </Stack>
              </Stack>

              <Paper sx={{ p: 1.4, borderRadius: 3, border: '1px solid rgba(148,163,184,0.16)' }}>
                <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', xl: 'center' }}>
                  <Chip icon={<FilterAltRounded />} size="small" label={user.role === 'admin' ? 'Admin filters' : 'Month selector'} color="primary" sx={{ alignSelf: { xs: 'flex-start', xl: 'center' } }} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ flex: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Month</InputLabel>
                      <Select value={selectedMonth} label="Month" onChange={(event) => setSelectedMonth(event.target.value)}>
                        {months.map((month) => (
                          <MenuItem key={month} value={month}>{dayjs(`${month}-01`).format('MMMM YYYY')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {user.role === 'admin' ? (
                      <>
                        <FormControl fullWidth size="small">
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
                        <FormControl fullWidth size="small">
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
                </Stack>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 1.8, md: 2.4 } }}>
            {user.role === 'admin' && activeSection === 'dashboard' ? <DashboardOverview summary={summary} chartData={chartData} ranking={ranking} /> : null}
            {user.role === 'admin' && activeSection === 'intake' ? <AdminIntakePage summary={summary} chartData={chartData} chemicalByOperator={chemicalByOperator} ranking={ranking} insights={insights} productionRecords={productionRecords} setEntries={setEntriesWithTouch} /> : null}
            {user.role === 'admin' && activeSection === 'cip' ? (
              <SectionCard title="GEA CIP Usage" description="Compact sanitation record view for the selected month.">
                <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid rgba(148,163,184,0.16)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Date', 'Operator', 'CIP type', 'Chemical used', 'Caustic', 'Nitric', 'Notes'].map((header) => <TableCell key={header} sx={{ fontWeight: 800, py: 1.1 }}>{header}</TableCell>)}
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
                          <TableCell>{record.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SectionCard>
            ) : null}
            {user.role === 'admin' && activeSection === 'operators' ? (
              <SectionCard title="Operator Performance" description="Compact comparison of operator efficiency, completeness, and consistency.">
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 1.5 }}>
                  {ranking.map((entry) => (
                    <Paper key={entry.operator} sx={{ p: 1.6, borderRadius: 3 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight={800}>{entry.operator}</Typography><Chip size="small" color={entry.rank === 1 ? 'success' : entry.rank === ranking.length ? 'error' : 'primary'} label={`#${entry.rank}`} /></Stack>
                        <Typography variant="caption" color="text.secondary">Loss {entry.lossRate.toFixed(2)}% • Chem {entry.chemicalIntensity.toFixed(2)} • Data {entry.completeness.toFixed(0)}%</Typography>
                        <LinearProgress variant="determinate" value={entry.consistency} sx={{ height: 7, borderRadius: 10 }} />
                      </Stack>
                    </Paper>
                  ))}
                </Box>
              </SectionCard>
            ) : null}
            {user.role === 'operator' && activeSection === 'operator-entry' ? <OperatorMonthlyEntryTable rows={operatorRows} setEntries={setEntriesWithTouch} operatorName={user.name} pendingIds={pendingIds} touchedIds={touchedIds} onSaveAll={handleSaveAll} /> : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
