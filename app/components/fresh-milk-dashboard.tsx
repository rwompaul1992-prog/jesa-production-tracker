'use client';

import { memo, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
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
import LocalDrinkRounded from '@mui/icons-material/LocalDrinkRounded';
import SpeedRounded from '@mui/icons-material/SpeedRounded';
import TimerRounded from '@mui/icons-material/TimerRounded';
import ReportRounded from '@mui/icons-material/ReportRounded';
import SaveRounded from '@mui/icons-material/SaveRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import {
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
import { AppUser, FreshMilkDailyRecord, FreshMilkDowntimeReason, FreshMilkMachine, FreshMilkShift } from '@/app/lib/types';
import {
  buildFreshMilkDailyTrend,
  buildFreshMilkDowntimeReasonBreakdown,
  buildFreshMilkMachineComparison,
  buildFreshMilkRanking,
  buildFreshMilkSummary,
  getFreshMilkDefectRate,
  getFreshMilkPouchesPerHour,
} from '@/app/lib/fresh-milk';

const shiftOptions: FreshMilkShift[] = ['Day', 'Night'];
const machineOptions: FreshMilkMachine[] = ['Machine 1', 'Machine 2', 'Machine 3', 'Machine 4'];
const downtimeReasonOptions: FreshMilkDowntimeReason[] = [
  'Film misalignment',
  'Black mark / sensor failure',
  'Seal failure',
  'Power interruption',
  'Product supply interruption',
  'Mechanical issue',
  'Changeover / setup',
  'Cleaning',
  'Other',
];

type FreshMilkFormState = {
  date: string;
  shift: FreshMilkShift;
  operatorName: string;
  machineNumber: FreshMilkMachine;
  productPacked: string;
  packSize: string;
  totalPouchesProduced: string;
  runningHours: string;
  downtimeMinutes: string;
  stoppageCount: string;
  rejectedPouches: string;
  startupTimeMinutes: string;
  badPouchesBeforeStableProduction: string;
  downtimeReason: FreshMilkDowntimeReason;
  comment: string;
};

const chartAxisProps = {
  axisLine: false,
  tickLine: false,
  tickMargin: 8,
  tick: { fontSize: 10, fill: '#6b7280', fontWeight: 700 },
};

const chartGridProps = {
  stroke: 'rgba(120,113,108,0.16)',
  strokeDasharray: '3 5',
  vertical: false,
};

function CompactCard({ title, value, helper, icon, accent = '#ea580c' }: { title: string; value: string; helper: string; icon: React.ReactNode; accent?: string }) {
  return (
    <Card sx={{ borderRadius: 1.4, border: `1px solid ${alpha(accent, 0.18)}`, background: '#ffffff', boxShadow: 'none' }}>
      <CardContent sx={{ p: 1.15 }}>
        <Stack spacing={0.75}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#78716c' }}>{title}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.05, mt: 0.35 }}>{value}</Typography>
            </Box>
            <Avatar sx={{ width: 30, height: 30, bgcolor: alpha(accent, 0.12), color: accent }}>{icon}</Avatar>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{helper}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card sx={{ borderRadius: 1.4, border: '1px solid rgba(231,229,228,1)', boxShadow: 'none', background: '#ffffff' }}>
      <CardContent sx={{ p: 1.15 }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.8}>
            <Box>
              <Box sx={{ display: 'inline-flex', px: 1.05, py: 0.34, borderRadius: 1, bgcolor: '#123b8f', color: '#fff', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 900, lineHeight: 1, letterSpacing: '0.02em' }}>{title}</Typography>
              </Box>
              {description ? <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>{description}</Typography> : null}
            </Box>
            {action}
          </Stack>
          <Box sx={{ pt: 0.25, borderTop: '1px solid rgba(245,245,244,1)' }}>{children}</Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, label, payload }: { active?: boolean; label?: string; payload?: Array<{ name?: string; value?: number; color?: string }> }) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1, borderRadius: 1.2, border: '1px solid rgba(231,229,228,1)' }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: '#9a3412' }}>{label}</Typography>
      <Stack spacing={0.6} sx={{ mt: 0.5 }}>
        {payload.map((item) => (
          <Stack key={item.name} direction="row" spacing={1.2} justifyContent="space-between">
            <Stack direction="row" spacing={0.7} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: item.color ?? '#ea580c' }} />
              <Typography variant="caption" color="text.secondary">{item.name}</Typography>
            </Stack>
            <Typography variant="caption" fontWeight={900}>{Number(item.value ?? 0).toLocaleString()}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function createDefaultForm(user: AppUser): FreshMilkFormState {
  return {
    date: dayjs().format('YYYY-MM-DD'),
    shift: 'Day',
    operatorName: user.name,
    machineNumber: 'Machine 1',
    productPacked: 'Fresh Milk',
    packSize: '500 mL',
    totalPouchesProduced: '',
    runningHours: '',
    downtimeMinutes: '',
    stoppageCount: '',
    rejectedPouches: '',
    startupTimeMinutes: '',
    badPouchesBeforeStableProduction: '',
    downtimeReason: 'Film misalignment',
    comment: '',
  };
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const FreshMilkOperatorForm = memo(function FreshMilkOperatorForm({ user, records, onSubmit }: { user: AppUser; records: FreshMilkDailyRecord[]; onSubmit: (record: FreshMilkDailyRecord) => void }) {
  const [form, setForm] = useState<FreshMilkFormState>(() => createDefaultForm(user));

  const previewRate = toNumber(form.runningHours) > 0 ? toNumber(form.totalPouchesProduced) / toNumber(form.runningHours) : 0;
  const previewDefect = toNumber(form.totalPouchesProduced) > 0 ? (toNumber(form.rejectedPouches) / toNumber(form.totalPouchesProduced)) * 100 : 0;
  const recentEntries = useMemo(() => records.filter((record) => record.operatorName === user.name).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [records, user.name]);

  const update = <K extends keyof FreshMilkFormState>(key: K, value: FreshMilkFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    const record: FreshMilkDailyRecord = {
      id: `fresh-milk-${user.name.toLowerCase().replace(/\s+/g, '-')}-${form.date}-${Date.now()}`,
      date: form.date,
      shift: form.shift,
      operatorName: user.name,
      machineNumber: form.machineNumber,
      productPacked: form.productPacked,
      packSize: form.packSize,
      totalPouchesProduced: toNumber(form.totalPouchesProduced),
      runningHours: toNumber(form.runningHours),
      downtimeMinutes: toNumber(form.downtimeMinutes),
      stoppageCount: toNumber(form.stoppageCount),
      rejectedPouches: toNumber(form.rejectedPouches),
      startupTimeMinutes: toNumber(form.startupTimeMinutes),
      badPouchesBeforeStableProduction: toNumber(form.badPouchesBeforeStableProduction),
      downtimeReason: form.downtimeReason,
      comment: form.comment,
      createdAt: new Date().toISOString(),
    };

    onSubmit(record);
    setForm(createDefaultForm(user));
  };

  return (
    <Stack spacing={1.1}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 0.8 }}>
        <CompactCard title="Rate preview" value={`${previewRate.toFixed(0)} pouches/hr`} helper="Live productivity preview before submit" icon={<SpeedRounded fontSize="small" />} accent="#123b8f" />
        <CompactCard title="Defect preview" value={`${previewDefect.toFixed(2)}%`} helper="Rejected pouches / total pouches" icon={<ReportRounded fontSize="small" />} accent="#dc2626" />
        <CompactCard title="Startup" value={`${toNumber(form.startupTimeMinutes)} min`} helper="Time to first good pouch" icon={<TimerRounded fontSize="small" />} accent="#14b8a6" />
        <CompactCard title="Machine" value={form.machineNumber} helper="Selected workstation for this entry" icon={<LocalDrinkRounded fontSize="small" />} accent="#ea580c" />
      </Box>

      <SectionCard
        title="Fresh Milk daily input"
        description="Fast operator entry with local form state. Data is saved only when you press submit."
        action={<Button variant="contained" startIcon={<SaveRounded />} onClick={handleSubmit} sx={{ bgcolor: '#123b8f', '&:hover': { bgcolor: '#0f3277' } }}>Submit daily entry</Button>}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 0.8 }}>
          <TextField label="Date" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} InputLabelProps={{ shrink: true }} size="small" />
          <TextField label="Operator" value={user.name} size="small" disabled />
          <TextField select label="Shift" value={form.shift} onChange={(event) => update('shift', event.target.value as FreshMilkShift)} size="small">
            {shiftOptions.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
          </TextField>
          <TextField select label="Machine number" value={form.machineNumber} onChange={(event) => update('machineNumber', event.target.value as FreshMilkMachine)} size="small">
            {machineOptions.map((machine) => <MenuItem key={machine} value={machine}>{machine}</MenuItem>)}
          </TextField>
          <TextField label="Product packed" value={form.productPacked} onChange={(event) => update('productPacked', event.target.value)} size="small" />
          <TextField label="Pack size" value={form.packSize} onChange={(event) => update('packSize', event.target.value)} size="small" />
          <TextField label="Total pouches produced" value={form.totalPouchesProduced} onChange={(event) => update('totalPouchesProduced', event.target.value)} size="small" />
          <TextField label="Running hours" value={form.runningHours} onChange={(event) => update('runningHours', event.target.value)} size="small" />
          <TextField label="Downtime minutes" value={form.downtimeMinutes} onChange={(event) => update('downtimeMinutes', event.target.value)} size="small" />
          <TextField label="Number of stoppages" value={form.stoppageCount} onChange={(event) => update('stoppageCount', event.target.value)} size="small" />
          <TextField label="Rejected pouches" value={form.rejectedPouches} onChange={(event) => update('rejectedPouches', event.target.value)} size="small" />
          <TextField label="Start-up time to first good pouch (min)" value={form.startupTimeMinutes} onChange={(event) => update('startupTimeMinutes', event.target.value)} size="small" />
          <TextField label="Bad pouches before stable production" value={form.badPouchesBeforeStableProduction} onChange={(event) => update('badPouchesBeforeStableProduction', event.target.value)} size="small" />
          <TextField select label="Main downtime reason" value={form.downtimeReason} onChange={(event) => update('downtimeReason', event.target.value as FreshMilkDowntimeReason)} size="small">
            {downtimeReasonOptions.map((reason) => <MenuItem key={reason} value={reason}>{reason}</MenuItem>)}
          </TextField>
          <TextField label="Optional comment" value={form.comment} onChange={(event) => update('comment', event.target.value)} size="small" multiline minRows={1} />
        </Box>
      </SectionCard>

      <SectionCard title="Recent submissions" description="Your most recent Fresh Milk machine entries for quick review.">
        <TableContainer component={Paper} sx={{ borderRadius: 1.2, border: '1px solid rgba(231,229,228,1)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Date', 'Shift', 'Machine', 'Pouches', 'Rate', 'Downtime', 'Defect rate'].map((header) => <TableCell key={header} sx={{ fontWeight: 800 }}>{header}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {recentEntries.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.shift}</TableCell>
                  <TableCell>{record.machineNumber}</TableCell>
                  <TableCell>{record.totalPouchesProduced.toLocaleString()}</TableCell>
                  <TableCell>{getFreshMilkPouchesPerHour(record).toFixed(0)}</TableCell>
                  <TableCell>{record.downtimeMinutes}</TableCell>
                  <TableCell>{getFreshMilkDefectRate(record).toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
    </Stack>
  );
});

export function FreshMilkSupervisorDashboard({ records }: { records: FreshMilkDailyRecord[] }) {
  const months = useMemo(() => Array.from(new Set(records.map((record) => record.date.slice(0, 7)))).sort(), [records]);
  const [monthFilter, setMonthFilter] = useState(months[months.length - 1] ?? dayjs().format('YYYY-MM'));
  const [shiftFilter, setShiftFilter] = useState<'All' | FreshMilkShift>('All');
  const [machineFilter, setMachineFilter] = useState<'All' | FreshMilkMachine>('All');
  const [operatorFilter, setOperatorFilter] = useState<'All' | string>('All');
  const [startDate, setStartDate] = useState(`${monthFilter}-01`);
  const [endDate, setEndDate] = useState(dayjs(`${monthFilter}-01`).endOf('month').format('YYYY-MM-DD'));
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'pouches' | 'downtime' | 'rate'>('date');

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => record.date.startsWith(monthFilter))
      .filter((record) => shiftFilter === 'All' || record.shift === shiftFilter)
      .filter((record) => machineFilter === 'All' || record.machineNumber === machineFilter)
      .filter((record) => operatorFilter === 'All' || record.operatorName === operatorFilter)
      .filter((record) => record.date >= startDate && record.date <= endDate)
      .filter((record) => {
        if (!search.trim()) return true;
        const haystack = [record.operatorName, record.machineNumber, record.productPacked, record.packSize, record.comment, record.downtimeReason].join(' ').toLowerCase();
        return haystack.includes(search.toLowerCase());
      });
  }, [records, monthFilter, shiftFilter, machineFilter, operatorFilter, startDate, endDate, search]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((left, right) => {
      if (sortBy === 'pouches') return right.totalPouchesProduced - left.totalPouchesProduced;
      if (sortBy === 'downtime') return right.downtimeMinutes - left.downtimeMinutes;
      if (sortBy === 'rate') return getFreshMilkPouchesPerHour(right) - getFreshMilkPouchesPerHour(left);
      return right.date.localeCompare(left.date);
    });
  }, [filteredRecords, sortBy]);

  const summary = useMemo(() => buildFreshMilkSummary(filteredRecords), [filteredRecords]);
  const ranking = useMemo(() => buildFreshMilkRanking(filteredRecords), [filteredRecords]);
  const trend = useMemo(() => buildFreshMilkDailyTrend(filteredRecords), [filteredRecords]);
  const machineComparison = useMemo(() => buildFreshMilkMachineComparison(filteredRecords), [filteredRecords]);
  const downtimeBreakdown = useMemo(() => buildFreshMilkDowntimeReasonBreakdown(filteredRecords), [filteredRecords]);
  const operatorNames = useMemo(() => Array.from(new Set(records.map((record) => record.operatorName))).sort(), [records]);
  const bestOperator = ranking[0]?.operatorName ?? 'N/A';

  return (
    <Stack spacing={1.1}>
      <SectionCard title="Fresh Milk Operations" description="Supervisor command surface for the pouch machine section with measurable operator KPIs only.">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(7, minmax(0, 1fr))' }, gap: 0.75 }}>
          <TextField select label="Month" value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); setStartDate(`${event.target.value}-01`); setEndDate(dayjs(`${event.target.value}-01`).endOf('month').format('YYYY-MM-DD')); }} size="small">
            {months.map((month) => <MenuItem key={month} value={month}>{dayjs(`${month}-01`).format('MMMM YYYY')}</MenuItem>)}
          </TextField>
          <TextField label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          <TextField select label="Shift" value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value as 'All' | FreshMilkShift)} size="small">
            <MenuItem value="All">All</MenuItem>
            {shiftOptions.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
          </TextField>
          <TextField select label="Machine" value={machineFilter} onChange={(event) => setMachineFilter(event.target.value as 'All' | FreshMilkMachine)} size="small">
            <MenuItem value="All">All</MenuItem>
            {machineOptions.map((machine) => <MenuItem key={machine} value={machine}>{machine}</MenuItem>)}
          </TextField>
          <TextField select label="Operator" value={operatorFilter} onChange={(event) => setOperatorFilter(event.target.value)} size="small">
            <MenuItem value="All">All</MenuItem>
            {operatorNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </TextField>
          <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} size="small" />
        </Box>
      </SectionCard>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 0.8 }}>
        <CompactCard title="Total pouches" value={summary.totalPouches.toLocaleString()} helper="Selected period output" icon={<LocalDrinkRounded fontSize="small" />} accent="#123b8f" />
        <CompactCard title="Avg pouches / hour" value={summary.averagePouchesPerHour.toFixed(0)} helper="Core productivity KPI" icon={<SpeedRounded fontSize="small" />} accent="#14b8a6" />
        <CompactCard title="Total downtime" value={`${summary.totalDowntime} min`} helper="Machine handling KPI" icon={<TimerRounded fontSize="small" />} accent="#dc2626" />
        <CompactCard title="Avg defect rate" value={`${summary.averageDefectRate.toFixed(2)}%`} helper="Rejected pouch quality KPI" icon={<ReportRounded fontSize="small" />} accent="#ea580c" />
        <CompactCard title="Avg startup time" value={`${summary.averageStartupTime.toFixed(1)} min`} helper="Time to stable production" icon={<TrendingUpRounded fontSize="small" />} accent="#8b5cf6" />
        <CompactCard title="Rejected pouches" value={summary.totalRejected.toLocaleString()} helper="Total quality rejects" icon={<ReportRounded fontSize="small" />} accent="#dc2626" />
        <CompactCard title="Total stoppages" value={summary.totalStoppages.toLocaleString()} helper="Operational interruption count" icon={<TimerRounded fontSize="small" />} accent="#f59e0b" />
        <CompactCard title="Best operator" value={bestOperator} helper="Top weighted performance score" icon={<EmojiEventsRounded fontSize="small" />} accent="#16a34a" />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.05fr 0.95fr' }, gap: 0.9 }}>
        <Stack spacing={0.9}>
          <SectionCard title="Daily total pouches" description="Line view of total Fresh Milk pouch output across the selected period.">
            <Box sx={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="date" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="totalPouches" stroke="#123b8f" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
          <SectionCard title="Operator production and downtime" description="Compare average pouch rate and total downtime by operator.">
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="operatorName" {...chartAxisProps} />
                  <YAxis yAxisId="left" {...chartAxisProps} />
                  <YAxis yAxisId="right" orientation="right" {...chartAxisProps} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="averagePouchesPerHour" name="Avg pouches/hr" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="totalDowntime" name="Downtime min" fill="#dc2626" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
          <SectionCard title="Operator quality and startup" description="Defect rate and startup time by operator for the selected period.">
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="operatorName" {...chartAxisProps} />
                  <YAxis yAxisId="left" {...chartAxisProps} />
                  <YAxis yAxisId="right" orientation="right" {...chartAxisProps} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="averageDefectRate" name="Avg defect rate" fill="#ea580c" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="averageStartupTime" name="Avg startup min" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Stack>

        <Stack spacing={0.9}>
          <SectionCard title="Operator ranking table" description="Weighted score: production rate 35%, downtime 25%, defect rate 25%, startup stability 15%.">
            <TableContainer component={Paper} sx={{ borderRadius: 1.2, border: '1px solid rgba(231,229,228,1)', maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {['Rank', 'Operator', 'Entries', 'Total pouches', 'Avg pouches/hr', 'Total downtime', 'Avg defect rate', 'Avg startup time', 'Avg bad startup pouches', 'Performance score'].map((header) => <TableCell key={header} sx={{ fontWeight: 800, bgcolor: '#fffaf5' }}>{header}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ranking.map((entry) => (
                    <TableRow key={entry.operatorName} hover>
                      <TableCell>#{entry.rank}</TableCell>
                      <TableCell>{entry.operatorName}</TableCell>
                      <TableCell>{entry.entriesSubmitted}</TableCell>
                      <TableCell>{entry.totalPouches.toLocaleString()}</TableCell>
                      <TableCell>{entry.averagePouchesPerHour.toFixed(0)}</TableCell>
                      <TableCell>{entry.totalDowntime}</TableCell>
                      <TableCell>{entry.averageDefectRate.toFixed(2)}%</TableCell>
                      <TableCell>{entry.averageStartupTime.toFixed(1)} min</TableCell>
                      <TableCell>{entry.averageBadStartupPouches.toFixed(1)}</TableCell>
                      <TableCell><Chip size="small" color={entry.rank === 1 ? 'success' : 'primary'} label={entry.performanceScore.toFixed(1)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <SectionCard title="Machine comparison" description="Machine 1–4 comparison using measurable throughput, downtime, defect, and startup KPIs.">
            <TableContainer component={Paper} sx={{ borderRadius: 1.2, border: '1px solid rgba(231,229,228,1)' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Machine', 'Total pouches', 'Avg rate', 'Total downtime', 'Avg defect rate', 'Avg startup time'].map((header) => <TableCell key={header} sx={{ fontWeight: 800 }}>{header}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {machineComparison.map((machine) => (
                    <TableRow key={machine.machineNumber} hover>
                      <TableCell>{machine.machineNumber}</TableCell>
                      <TableCell>{machine.totalPouches.toLocaleString()}</TableCell>
                      <TableCell>{machine.averageRate.toFixed(0)}</TableCell>
                      <TableCell>{machine.totalDowntime}</TableCell>
                      <TableCell>{machine.averageDefectRate.toFixed(2)}%</TableCell>
                      <TableCell>{machine.averageStartupTime.toFixed(1)} min</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <SectionCard title="Downtime reasons by operator" description="Grouped reason tallies to spot recurring film, seal, power, and supply issues.">
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={downtimeBreakdown}>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="operatorName" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Film misalignment" stackId="reasons" fill="#ea580c" />
                  <Bar dataKey="Seal failure" stackId="reasons" fill="#dc2626" />
                  <Bar dataKey="Product supply interruption" stackId="reasons" fill="#14b8a6" />
                  <Bar dataKey="Mechanical issue" stackId="reasons" fill="#123b8f" />
                  <Bar dataKey="Changeover / setup" stackId="reasons" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 0.9 }}>
        <SectionCard title="Machine performance chart" description="Chart comparison for output, downtime, and startup efficiency by machine.">
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineComparison}>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="machineNumber" {...chartAxisProps} />
                <YAxis yAxisId="left" {...chartAxisProps} />
                <YAxis yAxisId="right" orientation="right" {...chartAxisProps} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="totalPouches" name="Total pouches" fill="#123b8f" radius={[8, 8, 0, 0]} />
                <Bar yAxisId="right" dataKey="totalDowntime" name="Downtime min" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="averageStartupTime" name="Avg startup min" stroke="#8b5cf6" strokeWidth={3} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>

        <SectionCard
          title="Daily production table"
          description="All Fresh Milk submissions with search, sorting, and operational detail."
          action={
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort by</InputLabel>
              <Select value={sortBy} label="Sort by" onChange={(event) => setSortBy(event.target.value as 'date' | 'pouches' | 'downtime' | 'rate')}>
                <MenuItem value="date">Newest date</MenuItem>
                <MenuItem value="pouches">Most pouches</MenuItem>
                <MenuItem value="downtime">Highest downtime</MenuItem>
                <MenuItem value="rate">Highest rate</MenuItem>
              </Select>
            </FormControl>
          }
        >
          <TableContainer component={Paper} sx={{ borderRadius: 1.2, border: '1px solid rgba(231,229,228,1)', maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Date', 'Shift', 'Operator', 'Machine', 'Product', 'Pack size', 'Pouches', 'Rate', 'Downtime', 'Stoppages', 'Rejected', 'Defect rate', 'Startup', 'Bad startup pouches', 'Reason', 'Comment'].map((header) => <TableCell key={header} sx={{ fontWeight: 800, bgcolor: '#fffaf5', whiteSpace: 'nowrap' }}>{header}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.shift}</TableCell>
                    <TableCell>{record.operatorName}</TableCell>
                    <TableCell>{record.machineNumber}</TableCell>
                    <TableCell>{record.productPacked}</TableCell>
                    <TableCell>{record.packSize}</TableCell>
                    <TableCell>{record.totalPouchesProduced.toLocaleString()}</TableCell>
                    <TableCell>{getFreshMilkPouchesPerHour(record).toFixed(0)}</TableCell>
                    <TableCell>{record.downtimeMinutes}</TableCell>
                    <TableCell>{record.stoppageCount}</TableCell>
                    <TableCell>{record.rejectedPouches}</TableCell>
                    <TableCell>{getFreshMilkDefectRate(record).toFixed(2)}%</TableCell>
                    <TableCell>{record.startupTimeMinutes} min</TableCell>
                    <TableCell>{record.badPouchesBeforeStableProduction}</TableCell>
                    <TableCell>{record.downtimeReason}</TableCell>
                    <TableCell>{record.comment || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>
      </Box>
    </Stack>
  );
}

export function FreshMilkWorkspace({ user, records, onAddRecord }: { user: AppUser; records: FreshMilkDailyRecord[]; onAddRecord: (record: FreshMilkDailyRecord) => void }) {
  if (user.role === 'admin') {
    return <FreshMilkSupervisorDashboard records={records} />;
  }

  return <FreshMilkOperatorForm user={user} records={records} onSubmit={onAddRecord} />;
}
