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
const packSizeOptions = ['500 mL', '1 L'];
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
  tick: { fontSize: 11, fill: '#94A3B8', fontWeight: 600 },
};

const chartGridProps = {
  stroke: '#F1F5F9',
  strokeWidth: 0.5,
  vertical: false,
};

function formatCompactNumber(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value * 10) / 10}`;
}

function legendFormatter(value: string) {
  return <span style={{ fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>{value}</span>;
}

function PremiumHero({
  eyebrow,
  title,
  description,
  highlights,
}: {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
}) {
  return (
    <Card
      sx={{
        borderRadius: 1.6,
        border: '1px solid rgba(18,59,143,0.12)',
        background: 'linear-gradient(140deg, #0f172a 0%, #123b8f 44%, #14b8a6 100%)',
        color: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 24px 50px rgba(15,23,42,0.18)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: [
            'radial-gradient(circle at 14% 18%, rgba(255,255,255,0.16), transparent 22%)',
            'radial-gradient(circle at 82% 24%, rgba(255,255,255,0.14), transparent 18%)',
            'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))',
          ].join(','),
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, md: 1.8 }, position: 'relative' }}>
        <Stack spacing={1.2}>
          <Chip
            label={eyebrow}
            size="small"
            sx={{
              alignSelf: 'flex-start',
              color: '#ffffff',
              bgcolor: alpha('#ffffff', 0.12),
              border: `1px solid ${alpha('#ffffff', 0.18)}`,
              fontWeight: 800,
            }}
          />
          <Stack spacing={0.7}>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
              {title}
            </Typography>
            <Typography sx={{ color: 'rgba(241,245,249,0.86)', maxWidth: 860, fontSize: '0.94rem' }}>
              {description}
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={0.8} flexWrap="wrap" useFlexGap>
            {highlights.map((highlight) => (
              <Chip
                key={highlight}
                label={highlight}
                size="small"
                sx={{
                  color: '#ffffff',
                  bgcolor: alpha('#ffffff', 0.1),
                  border: `1px solid ${alpha('#ffffff', 0.16)}`,
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function CompactCard({ title, value, helper, icon, accent = '#ea580c' }: { title: string; value: string; helper: string; icon: React.ReactNode; accent?: string }) {
  return (
    <Card
      sx={{
        borderRadius: 1.45,
        border: `1px solid ${alpha(accent, 0.18)}`,
        background: `linear-gradient(180deg, ${alpha('#ffffff', 0.98)}, ${alpha(accent, 0.035)})`,
        boxShadow: '0 14px 30px rgba(15,23,42,0.05)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 4,
          background: `linear-gradient(180deg, ${accent}, ${alpha(accent, 0.45)})`,
        },
      }}
    >
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
    <Card
      sx={{
        borderRadius: 1.45,
        border: '1px solid rgba(231,229,228,1)',
        boxShadow: '0 14px 30px rgba(15,23,42,0.04)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,251,247,0.94))',
      }}
    >
      <CardContent sx={{ p: 1.15 }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={0.8}>
            <Box>
              <Box sx={{ display: 'inline-flex', px: 1.05, py: 0.34, borderRadius: 1, bgcolor: '#123b8f', color: '#fff', mb: 0.5, boxShadow: '0 8px 18px rgba(18,59,143,0.18)' }}>
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
    <Paper className="custom-tooltip" sx={{ p: 1.1, borderRadius: 1, border: 'none', bgcolor: '#1e293b' }}>
      <Typography variant="caption" sx={{ fontWeight: 900, color: '#ffffff' }}>{label}</Typography>
      <Stack spacing={0.6} sx={{ mt: 0.5 }}>
        {payload.map((item) => (
          <Stack key={item.name} direction="row" spacing={1.2} justifyContent="space-between">
            <Stack direction="row" spacing={0.7} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: 999, bgcolor: item.color ?? '#ea580c' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.78)' }}>{item.name}</Typography>
            </Stack>
            <Typography variant="caption" fontWeight={900} sx={{ color: '#ffffff' }}>{formatCompactNumber(Number(item.value ?? 0))}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

function ChartSurface({ children, height = 220 }: { children: React.ReactNode; height?: number }) {
  return (
    <Box
      className="chart-card"
      sx={{
        height,
        mt: 0.2,
      }}
    >
      {children}
    </Box>
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
    <Box className="dashboard-container">
      <Stack spacing={1.1}>
        <PremiumHero
        eyebrow="Operator workspace"
        title={`${user.name} • Fresh Milk machine entry`}
        description="A fast production-grade submission workspace for pouch-machine operators. Inputs stay local while typing, then save in one clean submit action for a smoother shift-floor experience."
        highlights={['Submit once per entry', 'Desktop-optimized', 'No save-on-keystroke lag']}
      />

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
          <TextField label="Date" type="date" value={form.date} onChange={(event) => update('date', event.target.value)} InputLabelProps={{ shrink: true }} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="Operator" value={user.name} size="small" disabled sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffaf5' } }} />
          <TextField select label="Shift" value={form.shift} onChange={(event) => update('shift', event.target.value as FreshMilkShift)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            {shiftOptions.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
          </TextField>
          <TextField select label="Machine number" value={form.machineNumber} onChange={(event) => update('machineNumber', event.target.value as FreshMilkMachine)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            {machineOptions.map((machine) => <MenuItem key={machine} value={machine}>{machine}</MenuItem>)}
          </TextField>
          <TextField label="Product packed" value={form.productPacked} onChange={(event) => update('productPacked', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField select label="Pack size" value={form.packSize} onChange={(event) => update('packSize', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            {packSizeOptions.map((packSize) => <MenuItem key={packSize} value={packSize}>{packSize}</MenuItem>)}
          </TextField>
          <TextField label="Total pouches produced" value={form.totalPouchesProduced} onChange={(event) => update('totalPouchesProduced', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="Running hours" value={form.runningHours} onChange={(event) => update('runningHours', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="Downtime minutes" value={form.downtimeMinutes} onChange={(event) => update('downtimeMinutes', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="Number of stoppages" value={form.stoppageCount} onChange={(event) => update('stoppageCount', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="Rejected pouches" value={form.rejectedPouches} onChange={(event) => update('rejectedPouches', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="Start-up time to first good pouch (min)" value={form.startupTimeMinutes} onChange={(event) => update('startupTimeMinutes', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="Bad pouches before stable production" value={form.badPouchesBeforeStableProduction} onChange={(event) => update('badPouchesBeforeStableProduction', event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField select label="Main downtime reason" value={form.downtimeReason} onChange={(event) => update('downtimeReason', event.target.value as FreshMilkDowntimeReason)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            {downtimeReasonOptions.map((reason) => <MenuItem key={reason} value={reason}>{reason}</MenuItem>)}
          </TextField>
          <TextField label="Optional comment" value={form.comment} onChange={(event) => update('comment', event.target.value)} size="small" multiline minRows={1} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
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
    </Box>
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
    <Box className="dashboard-container">
      <Stack spacing={1.1}>
        <PremiumHero
        eyebrow="Executive operations workspace"
        title="Fresh Milk operations command center"
        description="Premium visibility for plant managers and supervisors across throughput, downtime discipline, startup stability, defect exposure, machine balance, and operator performance — using only measurable machine-entry KPIs."
        highlights={[
          `${filteredRecords.length} entries in scope`,
          `${summary.totalPouches.toLocaleString()} pouches reviewed`,
          `${bestOperator} leading`,
        ]}
      />

        <SectionCard title="Fresh Milk Operations" description="Supervisor command surface for the pouch machine section with measurable operator KPIs only.">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(7, minmax(0, 1fr))' }, gap: 0.75 }}>
          <TextField select label="Month" value={monthFilter} onChange={(event) => { setMonthFilter(event.target.value); setStartDate(`${event.target.value}-01`); setEndDate(dayjs(`${event.target.value}-01`).endOf('month').format('YYYY-MM-DD')); }} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            {months.map((month) => <MenuItem key={month} value={month}>{dayjs(`${month}-01`).format('MMMM YYYY')}</MenuItem>)}
          </TextField>
          <TextField label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} size="small" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
          <TextField select label="Shift" value={shiftFilter} onChange={(event) => setShiftFilter(event.target.value as 'All' | FreshMilkShift)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            <MenuItem value="All">All</MenuItem>
            {shiftOptions.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
          </TextField>
          <TextField select label="Machine" value={machineFilter} onChange={(event) => setMachineFilter(event.target.value as 'All' | FreshMilkMachine)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            <MenuItem value="All">All</MenuItem>
            {machineOptions.map((machine) => <MenuItem key={machine} value={machine}>{machine}</MenuItem>)}
          </TextField>
          <TextField select label="Operator" value={operatorFilter} onChange={(event) => setOperatorFilter(event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }}>
            <MenuItem value="All">All</MenuItem>
            {operatorNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </TextField>
          <TextField label="Search" value={search} onChange={(event) => setSearch(event.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fffdf9' } }} />
        </Box>
        </SectionCard>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 2.5 }}>
        <CompactCard title="Total pouches" value={summary.totalPouches.toLocaleString()} helper="Selected period output" icon={<LocalDrinkRounded fontSize="small" />} accent="#123b8f" />
        <CompactCard title="Avg pouches / hour" value={summary.averagePouchesPerHour.toFixed(0)} helper="Core productivity KPI" icon={<SpeedRounded fontSize="small" />} accent="#14b8a6" />
        <CompactCard title="Total downtime" value={`${summary.totalDowntime} min`} helper="Machine handling KPI" icon={<TimerRounded fontSize="small" />} accent="#dc2626" />
        <CompactCard title="Avg defect rate" value={`${summary.averageDefectRate.toFixed(2)}%`} helper="Rejected pouch quality KPI" icon={<ReportRounded fontSize="small" />} accent="#ea580c" />
        <CompactCard title="Avg startup time" value={`${summary.averageStartupTime.toFixed(1)} min`} helper="Time to stable production" icon={<TrendingUpRounded fontSize="small" />} accent="#8b5cf6" />
        <CompactCard title="Rejected pouches" value={summary.totalRejected.toLocaleString()} helper="Total quality rejects" icon={<ReportRounded fontSize="small" />} accent="#dc2626" />
        <CompactCard title="Total stoppages" value={summary.totalStoppages.toLocaleString()} helper="Operational interruption count" icon={<TimerRounded fontSize="small" />} accent="#f59e0b" />
        <CompactCard title="Best operator" value={bestOperator} helper="Top weighted performance score" icon={<EmojiEventsRounded fontSize="small" />} accent="#16a34a" />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.05fr 0.95fr' }, gap: 2.5 }}>
        <Stack spacing={2.5}>
          <SectionCard title="Daily total pouches" description="Line view of total Fresh Milk pouch output across the selected period.">
            <ChartSurface height={208}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="freshMilkDailyGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#002D72" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#002D72" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="date" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" align="center" formatter={legendFormatter} wrapperStyle={{ paddingBottom: 8 }} />
                  <Area type="monotone" dataKey="totalPouches" fill="url(#freshMilkDailyGlow)" stroke="none" />
                  <Line type="monotone" dataKey="totalPouches" name="Total pouches" stroke="#002D72" strokeWidth={2} dot={{ r: 3, fill: '#ffffff', stroke: '#002D72', strokeWidth: 1.4 }} activeDot={{ r: 4, fill: '#ffffff', stroke: '#002D72', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="averageRate" name="Avg pouches/hr" stroke="#4A90E2" strokeWidth={2} dot={{ r: 3, fill: '#ffffff', stroke: '#4A90E2', strokeWidth: 1.4 }} activeDot={{ r: 4, fill: '#ffffff', stroke: '#4A90E2', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartSurface>
          </SectionCard>
          <SectionCard title="Operator production and downtime" description="Compare average pouch rate and total downtime by operator.">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} barCategoryGap="40%">
                  <defs>
                    <linearGradient id="freshMilkRateBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4A90E2" />
                      <stop offset="100%" stopColor="#2f74cc" />
                    </linearGradient>
                    <linearGradient id="freshMilkDowntimeBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFC107" />
                      <stop offset="100%" stopColor="#e8ac00" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="operatorName" {...chartAxisProps} />
                  <YAxis yAxisId="left" {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                  <YAxis yAxisId="right" orientation="right" {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" align="center" formatter={legendFormatter} wrapperStyle={{ paddingBottom: 8 }} />
                  <Bar yAxisId="left" dataKey="averagePouchesPerHour" name="Avg pouches/hr" fill="url(#freshMilkRateBar)" radius={[8, 8, 0, 0]} barSize={22} />
                  <Bar yAxisId="right" dataKey="totalDowntime" name="Downtime min" fill="url(#freshMilkDowntimeBar)" radius={[8, 8, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSurface>
          </SectionCard>
          <SectionCard title="Operator quality and startup" description="Defect rate and startup time by operator for the selected period.">
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ranking} barCategoryGap="40%">
                  <defs>
                    <linearGradient id="freshMilkDefectBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFC107" />
                      <stop offset="100%" stopColor="#e8ac00" />
                    </linearGradient>
                    <linearGradient id="freshMilkStartupBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7eb0ef" />
                      <stop offset="100%" stopColor="#4A90E2" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="operatorName" {...chartAxisProps} />
                  <YAxis yAxisId="left" {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                  <YAxis yAxisId="right" orientation="right" {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" align="center" formatter={legendFormatter} wrapperStyle={{ paddingBottom: 8 }} />
                  <Bar yAxisId="left" dataKey="averageDefectRate" name="Avg defect rate" fill="url(#freshMilkDefectBar)" radius={[8, 8, 0, 0]} barSize={22} />
                  <Bar yAxisId="right" dataKey="averageStartupTime" name="Avg startup min" fill="url(#freshMilkStartupBar)" radius={[8, 8, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSurface>
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
            <ChartSurface>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={downtimeBreakdown} barCategoryGap="40%">
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="operatorName" {...chartAxisProps} />
                  <YAxis {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="top" align="center" formatter={legendFormatter} wrapperStyle={{ paddingBottom: 8 }} />
                  <Bar dataKey="Film misalignment" stackId="reasons" fill="#002D72" barSize={20} />
                  <Bar dataKey="Seal failure" stackId="reasons" fill="#4A90E2" barSize={20} />
                  <Bar dataKey="Product supply interruption" stackId="reasons" fill="#FFC107" barSize={20} />
                  <Bar dataKey="Mechanical issue" stackId="reasons" fill="#295ca2" barSize={20} />
                  <Bar dataKey="Changeover / setup" stackId="reasons" fill="#7eb0ef" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartSurface>
          </SectionCard>
        </Stack>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' }, gap: 2.5 }}>
        <SectionCard title="Machine performance chart" description="Chart comparison for output, downtime, and startup efficiency by machine.">
          <ChartSurface>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineComparison} barCategoryGap="40%">
                <defs>
                  <linearGradient id="freshMilkMachinePouches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4A90E2" />
                    <stop offset="100%" stopColor="#002D72" />
                  </linearGradient>
                  <linearGradient id="freshMilkMachineDowntime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD54F" />
                    <stop offset="100%" stopColor="#FFC107" />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartGridProps} />
                <XAxis dataKey="machineNumber" {...chartAxisProps} />
                <YAxis yAxisId="left" {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                <YAxis yAxisId="right" orientation="right" {...chartAxisProps} tickFormatter={(value) => formatCompactNumber(Number(value))} />
                <Tooltip content={<ChartTooltip />} />
                <Legend verticalAlign="top" align="center" formatter={legendFormatter} wrapperStyle={{ paddingBottom: 8 }} />
                <Bar yAxisId="left" dataKey="totalPouches" name="Total pouches" fill="url(#freshMilkMachinePouches)" radius={[8, 8, 0, 0]} barSize={22} />
                <Bar yAxisId="right" dataKey="totalDowntime" name="Downtime min" fill="url(#freshMilkMachineDowntime)" radius={[8, 8, 0, 0]} barSize={22} />
                <Line yAxisId="right" type="monotone" dataKey="averageStartupTime" name="Avg startup min" stroke="#002D72" strokeWidth={2} dot={{ r: 3, fill: '#ffffff', stroke: '#002D72', strokeWidth: 1.4 }} activeDot={{ r: 4, fill: '#ffffff', stroke: '#002D72', strokeWidth: 2 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartSurface>
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
    </Box>
  );
}

export function FreshMilkWorkspace({ user, records, onAddRecord }: { user: AppUser; records: FreshMilkDailyRecord[]; onAddRecord: (record: FreshMilkDailyRecord) => void }) {
  if (user.role === 'admin') {
    return <FreshMilkSupervisorDashboard records={records} />;
  }

  return <FreshMilkOperatorForm user={user} records={records} onSubmit={onAddRecord} />;
}
