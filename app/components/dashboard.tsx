'use client';

import { useMemo, useState } from 'react';
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
  InputAdornment,
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
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRounded from '@mui/icons-material/TrendingDownRounded';
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
import BoltRounded from '@mui/icons-material/BoltRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';
import FilterAltRounded from '@mui/icons-material/FilterAltRounded';
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
import { demoCipData, demoProductionData, operators } from '@/app/data/demo-data';
import {
  buildChartData,
  buildChemicalUsageByOperator,
  buildInsights,
  buildMonthlySummary,
  buildOperatorRanking,
  getLossPercentage,
  getMilkLoss,
} from '@/app/lib/analytics';
import { AppUser, CipRecord, ProductionRecord } from '@/app/lib/types';

const shifts = ['Morning', 'Afternoon', 'Night'] as const;
const cipTypes = ['Pre-rinse', 'Caustic wash', 'Acid wash', 'Final rinse'] as const;
const chemicals = ['Caustic', 'Nitric Acid', 'Both'] as const;
const drawerWidth = 284;

type SectionKey = 'dashboard' | 'intake' | 'cip' | 'operators';

type KpiTone = 'good' | 'bad' | 'warning' | 'neutral';

const toneMap: Record<KpiTone, { accent: string; soft: string; chip: 'success' | 'error' | 'warning' | 'primary' }> = {
  good: { accent: '#16a34a', soft: 'rgba(22,163,74,0.16)', chip: 'success' },
  bad: { accent: '#dc2626', soft: 'rgba(220,38,38,0.14)', chip: 'error' },
  warning: { accent: '#f59e0b', soft: 'rgba(245,158,11,0.16)', chip: 'warning' },
  neutral: { accent: '#2563eb', soft: 'rgba(37,99,235,0.16)', chip: 'primary' },
};

const sections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  { key: 'dashboard', label: 'Dashboard', description: 'Plant overview and alerts', icon: <DashboardRounded fontSize="small" /> },
  { key: 'intake', label: 'Intake and Pasteurization', description: 'Milk intake and losses', icon: <LocalDrinkRounded fontSize="small" /> },
  { key: 'cip', label: 'GEA CIP Usage', description: 'Chemical cleaning records', icon: <CleaningServicesRounded fontSize="small" /> },
  { key: 'operators', label: 'Operator Performance', description: 'Ranking and consistency', icon: <LeaderboardRounded fontSize="small" /> },
];

function getDateBounds(records: ProductionRecord[]) {
  const dates = records.map((record) => record.date).sort();
  return {
    start: dates[0] ?? '',
    end: dates[dates.length - 1] ?? '',
  };
}

function computeTrend(current: number, baseline: number) {
  if (current > baseline) return { symbol: '↑', label: 'Up vs baseline' };
  if (current < baseline) return { symbol: '↓', label: 'Down vs baseline' };
  return { symbol: '→', label: 'Flat vs baseline' };
}

function MetricCard({
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
        height: '100%',
        border: '1px solid',
        borderColor: alpha(colors.accent, 0.18),
        background: `linear-gradient(145deg, ${colors.soft} 0%, rgba(255,255,255,0.98) 68%)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 24px 50px ${alpha(colors.accent, 0.16)}`,
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, mt: 1 }}>
                {value}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 58,
                height: 58,
                bgcolor: alpha(colors.accent, 0.12),
                color: colors.accent,
                boxShadow: `0 14px 30px ${alpha(colors.accent, 0.18)}`,
              }}
            >
              {icon}
            </Avatar>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
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
  eyebrow,
  title,
  description,
  children,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card sx={{ height: '100%', border: '1px solid', borderColor: 'rgba(148,163,184,0.16)' }}>
      <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              {eyebrow ? (
                <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.14em', fontWeight: 800 }}>
                  {eyebrow}
                </Typography>
              ) : null}
              <Typography variant="h6">{title}</Typography>
              {description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
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

function EditableProductionTable({
  records,
  setRecords,
  canEdit,
}: {
  records: ProductionRecord[];
  setRecords: React.Dispatch<React.SetStateAction<ProductionRecord[]>>;
  canEdit: boolean;
}) {
  const updateField = <K extends keyof ProductionRecord>(id: string, field: K, value: ProductionRecord[K]) => {
    setRecords((current) => current.map((record) => (record.id === id ? { ...record, [field]: value } : record)));
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 4,
        boxShadow: 'none',
        border: '1px solid rgba(148,163,184,0.16)',
        maxHeight: 520,
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {['Date', 'Offloading shift', 'Pasteurization shift', 'Offloading operator', 'Pasteurization operator', 'Offloaded (L)', 'Pasteurized (L)', 'Milk loss', 'Loss %', 'Remarks'].map((header) => (
              <TableCell
                key={header}
                sx={{
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  bgcolor: '#f8fafc',
                  borderBottom: '1px solid rgba(148,163,184,0.22)',
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => {
            const loss = getMilkLoss(record);
            const lossPercent = getLossPercentage(record);
            const isHighLoss = lossPercent >= 2.8;
            const isGoodRun = lossPercent <= 1.8;

            return (
              <TableRow
                key={record.id}
                hover
                sx={{
                  '& td': { borderBottom: '1px solid rgba(226,232,240,0.9)' },
                  bgcolor: isHighLoss ? 'rgba(254,226,226,0.65)' : isGoodRun ? 'rgba(220,252,231,0.55)' : 'transparent',
                }}
              >
                <TableCell>
                  <TextField type="date" size="small" value={record.date} disabled={!canEdit} onChange={(event) => updateField(record.id, 'date', event.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField select size="small" value={record.offloadingShift} disabled={!canEdit} onChange={(event) => updateField(record.id, 'offloadingShift', event.target.value as ProductionRecord['offloadingShift'])}>
                    {shifts.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField select size="small" value={record.pasteurizationShift} disabled={!canEdit} onChange={(event) => updateField(record.id, 'pasteurizationShift', event.target.value as ProductionRecord['pasteurizationShift'])}>
                    {shifts.map((shift) => <MenuItem key={shift} value={shift}>{shift}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField select size="small" value={record.offloadingOperator} disabled={!canEdit} onChange={(event) => updateField(record.id, 'offloadingOperator', event.target.value)}>
                    {operators.map((operator) => <MenuItem key={operator} value={operator}>{operator}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField select size="small" value={record.pasteurizationOperator} disabled={!canEdit} onChange={(event) => updateField(record.id, 'pasteurizationOperator', event.target.value)}>
                    {operators.map((operator) => <MenuItem key={operator} value={operator}>{operator}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell><TextField type="number" size="small" value={record.totalMilkOffloaded} disabled={!canEdit} onChange={(event) => updateField(record.id, 'totalMilkOffloaded', Number(event.target.value))} /></TableCell>
                <TableCell><TextField type="number" size="small" value={record.totalMilkPasteurized} disabled={!canEdit} onChange={(event) => updateField(record.id, 'totalMilkPasteurized', Number(event.target.value))} /></TableCell>
                <TableCell><Chip color={isHighLoss ? 'error' : isGoodRun ? 'success' : 'warning'} label={`${loss.toLocaleString()} L`} /></TableCell>
                <TableCell><Chip color={isHighLoss ? 'error' : isGoodRun ? 'success' : 'warning'} label={`${lossPercent.toFixed(2)}%`} /></TableCell>
                <TableCell><TextField size="small" value={record.remarks} disabled={!canEdit} onChange={(event) => updateField(record.id, 'remarks', event.target.value)} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function EditableCipTable({
  records,
  setRecords,
  canEdit,
}: {
  records: CipRecord[];
  setRecords: React.Dispatch<React.SetStateAction<CipRecord[]>>;
  canEdit: boolean;
}) {
  const updateField = <K extends keyof CipRecord>(id: string, field: K, value: CipRecord[K]) => {
    setRecords((current) => current.map((record) => (record.id === id ? { ...record, [field]: value } : record)));
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid rgba(148,163,184,0.16)' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {['Date', 'Operator', 'CIP type', 'Chemical used', 'Caustic', 'Nitric acid', 'Notes'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 800, whiteSpace: 'nowrap', bgcolor: '#f8fafc' }}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell><TextField type="date" size="small" value={record.date} disabled={!canEdit} onChange={(event) => updateField(record.id, 'date', event.target.value)} /></TableCell>
              <TableCell><TextField select size="small" value={record.operatorName} disabled={!canEdit} onChange={(event) => updateField(record.id, 'operatorName', event.target.value)}>{operators.map((operator) => <MenuItem key={operator} value={operator}>{operator}</MenuItem>)}</TextField></TableCell>
              <TableCell><TextField select size="small" value={record.cipType} disabled={!canEdit} onChange={(event) => updateField(record.id, 'cipType', event.target.value as CipRecord['cipType'])}>{cipTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}</TextField></TableCell>
              <TableCell><TextField select size="small" value={record.chemicalUsed} disabled={!canEdit} onChange={(event) => updateField(record.id, 'chemicalUsed', event.target.value as CipRecord['chemicalUsed'])}>{chemicals.map((chemical) => <MenuItem key={chemical} value={chemical}>{chemical}</MenuItem>)}</TextField></TableCell>
              <TableCell><TextField type="number" size="small" value={record.causticJerrycansUsed} disabled={!canEdit} onChange={(event) => updateField(record.id, 'causticJerrycansUsed', Number(event.target.value))} /></TableCell>
              <TableCell><TextField type="number" size="small" value={record.nitricAcidJerrycansUsed} disabled={!canEdit} onChange={(event) => updateField(record.id, 'nitricAcidJerrycansUsed', Number(event.target.value))} /></TableCell>
              <TableCell><TextField size="small" value={record.notes} disabled={!canEdit} onChange={(event) => updateField(record.id, 'notes', event.target.value)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DashboardOverview({
  summary,
  chartData,
  chemicalByOperator,
  insights,
  setSection,
}: {
  summary: ReturnType<typeof buildMonthlySummary>;
  chartData: ReturnType<typeof buildChartData>;
  chemicalByOperator: ReturnType<typeof buildChemicalUsageByOperator>;
  insights: ReturnType<typeof buildInsights>;
  setSection: (section: SectionKey) => void;
}) {
  return (
    <Stack spacing={3}>
      <Box sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 6, color: 'white', background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 30%, #7c3aed 68%, #14b8a6 100%)', boxShadow: '0 24px 80px rgba(37, 99, 235, 0.28)' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} justifyContent="space-between">
          <Box>
            <Chip icon={<FactoryRounded />} label="Industrial operations cockpit" sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white', mb: 2 }} />
            <Typography variant="h4" sx={{ maxWidth: 720 }}>Dairy production command center for intake, pasteurization, sanitation, and operator visibility.</Typography>
            <Typography sx={{ mt: 1.5, opacity: 0.88, maxWidth: 760 }}>Fast overview of milk throughput, chemical usage, and department performance using the current demo data.</Typography>
          </Box>
          <Stack spacing={1.2} alignItems={{ xs: 'flex-start', lg: 'flex-end' }}>
            <Chip icon={<BoltRounded />} label="Live demo mode" sx={{ bgcolor: 'white', color: 'primary.main' }} />
            <Chip icon={<NotificationsActiveRounded />} label={`Top alert: ${insights.highMilkLoss}`} sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white', maxWidth: 380 }} />
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.4fr 1fr' }, gap: 2.2 }}>
        <SectionCard eyebrow="Overview" title="Daily milk movement" description="Quick comparison of intake vs pasteurization output across the current filtered period." action={<Button onClick={() => setSection('intake')}>Open department page</Button>}>
          <Box sx={{ height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="offloaded" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pasteurized" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>

        <SectionCard eyebrow="Insights" title="Executive summary" description="Auto-generated highlights from the filtered month view.">
          <Stack spacing={1.5}>
            {[{ label: 'High milk losses', value: insights.highMilkLoss, color: 'warning' as const }, { label: 'High chemical usage', value: insights.highChemicalUsage, color: 'secondary' as const }, { label: 'Missing entries', value: insights.missingEntries, color: 'default' as const }, { label: 'Best operator', value: insights.bestOperator, color: 'success' as const }, { label: 'Worst operator', value: insights.worstOperator, color: 'error' as const }].map((item) => (
              <Paper key={item.label} sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={0.9}>
                  <Chip size="small" label={item.label} color={item.color} sx={{ alignSelf: 'flex-start' }} />
                  <Typography variant="body2">{item.value}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard eyebrow="Chemicals" title="Chemical usage by operator" description="Filtered comparison of caustic and nitric acid usage.">
        <Box sx={{ height: 310 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chemicalByOperator}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="operator" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="caustic" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="nitric" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </SectionCard>
    </Stack>
  );
}

function IntakePage({
  records,
  cipRecords,
  setRecords,
  chartData,
  chemicalByOperator,
  summary,
  ranking,
  insights,
  canEdit,
}: {
  records: ProductionRecord[];
  cipRecords: CipRecord[];
  setRecords: React.Dispatch<React.SetStateAction<ProductionRecord[]>>;
  chartData: ReturnType<typeof buildChartData>;
  chemicalByOperator: ReturnType<typeof buildChemicalUsageByOperator>;
  summary: ReturnType<typeof buildMonthlySummary>;
  ranking: ReturnType<typeof buildOperatorRanking>;
  insights: ReturnType<typeof buildInsights>;
  canEdit: boolean;
}) {
  const baselineOffloaded = records.length > 0 ? summary.totalOffloaded / records.length : 0;
  const baselinePasteurized = records.length > 0 ? summary.totalPasteurized / records.length : 0;
  const baselineLoss = records.length > 0 ? summary.totalLoss / records.length : 0;
  const baselineLossPercentage = records.length > 0 ? summary.lossPercentage / records.length : 0;
  const baselineCaustic = cipRecords.length > 0 ? summary.totalCaustic / cipRecords.length : 0;
  const baselineNitric = cipRecords.length > 0 ? summary.totalNitric / cipRecords.length : 0;
  const abnormalOperators = ranking.filter((entry) => entry.lossRate > 2.5).map((entry) => entry.operator);
  const highLossDays = records.filter((record) => getLossPercentage(record) > 2.7);

  return (
    <Stack spacing={3}>
      <Box sx={{ p: 3, borderRadius: 5, background: 'linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(20,184,166,0.18) 100%)' }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'primary.main', fontWeight: 800 }}>Department analytics</Typography>
        <Typography variant="h4">Intake and Pasteurization</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 800 }}>A data-rich executive view of milk intake, pasteurization output, process loss, and sanitation consumption with Excel-style operational records below.</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(6, 1fr)' }, gap: 2.2 }}>
        <MetricCard title="Total Milk Offloaded" value={`${summary.totalOffloaded.toLocaleString()} L`} helper="Primary intake volume" icon={<OpacityRounded />} tone="neutral" trend={`${computeTrend(summary.totalOffloaded, baselineOffloaded).symbol} vs avg day`} />
        <MetricCard title="Total Milk Pasteurized" value={`${summary.totalPasteurized.toLocaleString()} L`} helper="Processed through line" icon={<LocalDrinkRounded />} tone="good" trend={`${computeTrend(summary.totalPasteurized, baselinePasteurized).symbol} throughput`} />
        <MetricCard title="Total Milk Loss" value={`${summary.totalLoss.toLocaleString()} L`} helper="Calculated process loss" icon={<WarningAmberRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : 'warning'} trend={`${computeTrend(summary.totalLoss, baselineLoss).symbol} loss trend`} />
        <MetricCard title="Loss Percentage" value={`${summary.lossPercentage.toFixed(2)}%`} helper="Efficiency rate" icon={<InsightsRounded />} tone={summary.lossPercentage > 2.6 ? 'bad' : summary.lossPercentage > 2 ? 'warning' : 'good'} trend={`${computeTrend(summary.lossPercentage, baselineLossPercentage).symbol} variance`} />
        <MetricCard title="Total Caustic Used" value={`${summary.totalCaustic} jerrycans`} helper="CIP caustic usage" icon={<ScienceRounded />} tone="warning" trend={`${computeTrend(summary.totalCaustic, baselineCaustic).symbol} chemical draw`} />
        <MetricCard title="Total Nitric Used" value={`${summary.totalNitric} jerrycans`} helper="CIP nitric usage" icon={<ScienceRounded />} tone="neutral" trend={`${computeTrend(summary.totalNitric, baselineNitric).symbol} acid draw`} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.45fr 0.9fr' }, gap: 2.2, alignItems: 'start' }}>
        <Stack spacing={2.2}>
          <SectionCard eyebrow="Production" title="Daily Milk Offloaded vs Pasteurized" description="Line chart view for comparing offloading and pasteurization throughput day by day.">
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="offloaded" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="pasteurized" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>

          <SectionCard eyebrow="Loss analytics" title="Daily Milk Loss Trend" description="Area chart to make daily loss spikes immediately visible.">
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="loss" stroke="#dc2626" fill="url(#lossFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>

          <SectionCard eyebrow="Sanitation" title="Chemical Usage by Operator" description="Bar chart of caustic and nitric usage by operator for the filtered view.">
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chemicalByOperator}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="operator" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="caustic" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="nitric" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Stack>

        <Stack spacing={2.2}>
          <SectionCard eyebrow="Ranking" title="Operator Performance Ranking" description="Best to worst based on loss %, chemical efficiency, completeness, and consistency.">
            <Stack spacing={1.6}>
              {ranking.map((entry) => (
                <Paper key={entry.operator} sx={{ p: 2, borderRadius: 4, border: '1px solid rgba(148,163,184,0.16)' }}>
                  <Stack spacing={1.1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography fontWeight={800}>#{entry.rank} {entry.operator}</Typography>
                      <Chip label={`${entry.score.toFixed(1)} pts`} color={entry.rank === 1 ? 'success' : entry.rank === ranking.length ? 'error' : 'primary'} />
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={`Loss ${entry.lossRate.toFixed(2)}%`} color={entry.lossRate > 2.5 ? 'error' : 'success'} />
                      <Chip size="small" label={`Chem ${entry.chemicalIntensity.toFixed(2)}/act`} color="warning" />
                      <Chip size="small" label={`Data ${entry.completeness.toFixed(0)}%`} color="primary" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">Data completeness</Typography>
                    <LinearProgress variant="determinate" value={entry.completeness} sx={{ height: 8, borderRadius: 20 }} />
                    <Typography variant="caption" color="text.secondary">Consistency</Typography>
                    <LinearProgress color="secondary" variant="determinate" value={entry.consistency} sx={{ height: 8, borderRadius: 20 }} />
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </SectionCard>

          <SectionCard eyebrow="Insights" title="Insights Panel" description="Automatically generated operational observations from the current filters.">
            <Stack spacing={1.4}>
              <Paper sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={0.8}>
                  <Chip size="small" color="warning" label="High milk loss days" sx={{ alignSelf: 'flex-start' }} />
                  <Typography variant="body2">{highLossDays.length > 0 ? highLossDays.map((record) => `${record.date} (${getMilkLoss(record)}L)`).join(', ') : 'No unusually high loss days in current filter range.'}</Typography>
                </Stack>
              </Paper>
              <Paper sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={0.8}>
                  <Chip size="small" color="error" label="Operators with abnormal losses" sx={{ alignSelf: 'flex-start' }} />
                  <Typography variant="body2">{abnormalOperators.length > 0 ? abnormalOperators.join(', ') : 'No operators are currently above abnormal loss threshold.'}</Typography>
                </Stack>
              </Paper>
              <Paper sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={0.8}>
                  <Chip size="small" color="primary" label="Missing entries" sx={{ alignSelf: 'flex-start' }} />
                  <Typography variant="body2">{insights.missingEntries}</Typography>
                </Stack>
              </Paper>
              <Paper sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={0.8}>
                  <Chip size="small" color="success" label="Best operator of the month" sx={{ alignSelf: 'flex-start' }} />
                  <Typography fontWeight={800}>{insights.bestOperator}</Typography>
                </Stack>
              </Paper>
              <Paper sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={0.8}>
                  <Chip size="small" color="error" label="Worst operator of the month" sx={{ alignSelf: 'flex-start' }} />
                  <Typography fontWeight={800}>{insights.worstOperator}</Typography>
                </Stack>
              </Paper>
            </Stack>
          </SectionCard>
        </Stack>
      </Box>

      <SectionCard eyebrow="Production records" title="Monthly Production Table" description="Excel-style operational log with sticky headers, inline editing, and row highlighting for good vs high-loss runs." action={<Chip color={canEdit ? 'success' : 'default'} label={canEdit ? 'Inline edit enabled' : 'View only mode'} />}>
        <EditableProductionTable records={records} setRecords={setRecords} canEdit={canEdit} />
      </SectionCard>
    </Stack>
  );
}

function CipPage({ records, setRecords, chemicalByOperator, canEdit }: { records: CipRecord[]; setRecords: React.Dispatch<React.SetStateAction<CipRecord[]>>; chemicalByOperator: ReturnType<typeof buildChemicalUsageByOperator>; canEdit: boolean; }) {
  return (
    <Stack spacing={3}>
      <Box sx={{ p: 3, borderRadius: 5, background: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(245,158,11,0.18) 100%)' }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'secondary.main', fontWeight: 800 }}>Sanitation page</Typography>
        <Typography variant="h4">GEA CIP Usage</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Monitor chemical usage, operator sanitation activity, and cleaning intensity across the department.</Typography>
      </Box>

      <SectionCard eyebrow="Chemical monitoring" title="Monthly chemical usage by operator" description="Visual comparison of caustic and nitric acid consumption across operators.">
        <Box sx={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chemicalByOperator}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="operator" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="caustic" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="nitric" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </SectionCard>

      <SectionCard eyebrow="Records" title="GEA CIP chemical usage table" description="Editable log for caustic and nitric acid usage tied to sanitation cycles." action={<Chip color={canEdit ? 'success' : 'default'} label={canEdit ? 'Edit mode enabled' : 'View only mode'} />}>
        <EditableCipTable records={records} setRecords={setRecords} canEdit={canEdit} />
      </SectionCard>
    </Stack>
  );
}

function OperatorsPage({ ranking, insights }: { ranking: ReturnType<typeof buildOperatorRanking>; insights: ReturnType<typeof buildInsights>; }) {
  return (
    <Stack spacing={3}>
      <Box sx={{ p: 3, borderRadius: 5, background: 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(37,99,235,0.15) 100%)' }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'success.main', fontWeight: 800 }}>Performance page</Typography>
        <Typography variant="h4">Operator Performance</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Review rank, loss rate, sanitation efficiency, completeness, and consistency for each operator.</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' }, gap: 2.2 }}>
        <SectionCard eyebrow="Ranking" title="Operator leaderboard" description="Blended score using loss, chemical usage, completeness, and consistency.">
          <Stack spacing={2}>
            {ranking.map((entry) => (
              <Paper key={entry.operator} sx={{ p: 2.3, borderRadius: 4 }}>
                <Stack spacing={1.3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={800}>#{entry.rank} {entry.operator}</Typography>
                    <Chip label={`${entry.score.toFixed(1)} pts`} color={entry.rank === 1 ? 'success' : entry.rank === ranking.length ? 'error' : 'primary'} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">Lower losses and lower chemical intensity improve the final score.</Typography>
                  <Divider />
                  <Typography variant="body2">Loss rate: {entry.lossRate.toFixed(2)}%</Typography>
                  <Typography variant="body2">Chemical intensity: {entry.chemicalIntensity.toFixed(2)} jerrycans/activity</Typography>
                  <Typography variant="body2">Completeness</Typography>
                  <LinearProgress variant="determinate" value={entry.completeness} sx={{ height: 9, borderRadius: 10 }} />
                  <Typography variant="body2">Consistency</Typography>
                  <LinearProgress color="secondary" variant="determinate" value={entry.consistency} sx={{ height: 9, borderRadius: 10 }} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard eyebrow="Recognition" title="Performance highlights" description="Simple monthly summary of top and low performers.">
          <Stack spacing={1.6}>
            <Paper sx={{ p: 2.2, borderRadius: 4 }}><Stack spacing={0.8}><Chip color="success" label="Best operator of the month" sx={{ alignSelf: 'flex-start' }} /><Typography fontWeight={700}>{insights.bestOperator}</Typography></Stack></Paper>
            <Paper sx={{ p: 2.2, borderRadius: 4 }}><Stack spacing={0.8}><Chip color="error" label="Worst operator of the month" sx={{ alignSelf: 'flex-start' }} /><Typography fontWeight={700}>{insights.worstOperator}</Typography></Stack></Paper>
            <Paper sx={{ p: 2.2, borderRadius: 4 }}><Stack spacing={0.8}><Chip color="warning" label="High milk loss" sx={{ alignSelf: 'flex-start' }} /><Typography variant="body2">{insights.highMilkLoss}</Typography></Stack></Paper>
            <Paper sx={{ p: 2.2, borderRadius: 4 }}><Stack spacing={0.8}><Chip color="secondary" label="High chemical usage" sx={{ alignSelf: 'flex-start' }} /><Typography variant="body2">{insights.highChemicalUsage}</Typography></Stack></Paper>
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}

export function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [productionRecords, setProductionRecords] = useState(demoProductionData);
  const [cipRecords, setCipRecords] = useState(demoCipData);
  const [activeSection, setActiveSection] = useState<SectionKey>('dashboard');
  const dateBounds = useMemo(() => getDateBounds(demoProductionData), []);
  const [startDate, setStartDate] = useState(dateBounds.start);
  const [endDate, setEndDate] = useState(dateBounds.end);
  const [operatorFilters, setOperatorFilters] = useState<string[]>([]);
  const [shiftFilters, setShiftFilters] = useState<string[]>([]);

  const filteredProduction = useMemo(() => {
    return productionRecords.filter((record) => {
      const inDateRange = (!startDate || record.date >= startDate) && (!endDate || record.date <= endDate);
      const matchesOperator = operatorFilters.length === 0 || operatorFilters.includes(record.offloadingOperator) || operatorFilters.includes(record.pasteurizationOperator);
      const matchesShift = shiftFilters.length === 0 || shiftFilters.includes(record.offloadingShift) || shiftFilters.includes(record.pasteurizationShift);
      return inDateRange && matchesOperator && matchesShift;
    });
  }, [endDate, operatorFilters, productionRecords, shiftFilters, startDate]);

  const filteredCip = useMemo(() => {
    return cipRecords.filter((record) => {
      const inDateRange = (!startDate || record.date >= startDate) && (!endDate || record.date <= endDate);
      const matchesOperator = operatorFilters.length === 0 || operatorFilters.includes(record.operatorName);
      return inDateRange && matchesOperator;
    });
  }, [cipRecords, endDate, operatorFilters, startDate]);

  const summary = useMemo(() => buildMonthlySummary(filteredProduction, filteredCip), [filteredProduction, filteredCip]);
  const chartData = useMemo(() => buildChartData(filteredProduction), [filteredProduction]);
  const chemicalByOperator = useMemo(() => buildChemicalUsageByOperator(filteredCip), [filteredCip]);
  const ranking = useMemo(() => buildOperatorRanking(filteredProduction, filteredCip), [filteredProduction, filteredCip]);
  const insights = useMemo(() => buildInsights(filteredProduction, filteredCip), [filteredProduction, filteredCip]);
  const canEdit = user.role === 'admin';
  const currentSection = sections.find((section) => section.key === activeSection) ?? sections[0];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eff4fb' }}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Box sx={{ width: { xs: 96, md: drawerWidth }, flexShrink: 0, bgcolor: '#0f172a', color: 'white', p: { xs: 1.5, md: 2.4 }, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, height: '100vh' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}><FactoryRounded /></Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography fontWeight={900}>JESA Tracker</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.64)' }}>Dairy operations suite</Typography>
            </Box>
          </Stack>

          <Paper sx={{ p: 2, mb: 2.5, borderRadius: 4, color: 'white', background: 'linear-gradient(145deg, rgba(37,99,235,0.25), rgba(124,58,237,0.25))', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Stack spacing={1.2} alignItems={{ xs: 'center', md: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }}><GroupsRounded /></Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography fontWeight={800}>{user.name}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{user.role === 'admin' ? 'Admin / Supervisor' : 'Operator'}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            {sections.map((section) => {
              const active = section.key === activeSection;
              return (
                <Button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  startIcon={section.icon}
                  sx={{ justifyContent: { xs: 'center', md: 'flex-start' }, px: { xs: 0.8, md: 1.6 }, py: 1.3, color: 'white', bgcolor: active ? 'rgba(255,255,255,0.14)' : 'transparent', border: active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 } } }}
                >
                  <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                    <Typography fontWeight={800} variant="body2">{section.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.66)' }}>{section.description}</Typography>
                  </Box>
                </Button>
              );
            })}
          </Stack>

          <Button color="inherit" onClick={onLogout} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.08)' }}>Logout</Button>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ position: 'sticky', top: 0, zIndex: 5, px: { xs: 2, md: 3.5 }, py: 2, borderBottom: '1px solid rgba(148,163,184,0.16)', backdropFilter: 'blur(18px)', bgcolor: 'rgba(239,244,251,0.88)' }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <IconButton sx={{ display: { md: 'none' }, bgcolor: 'white' }}><MenuRounded /></IconButton>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.14em', fontWeight: 800 }}>Intake operations / March 2026</Typography>
                    <Typography variant="h5">{currentSection.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{currentSection.description}</Typography>
                  </Box>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                  <Chip icon={<WaterDropRounded />} label={`${summary.totalLoss.toLocaleString()} L loss this month`} color={summary.lossPercentage > 2.6 ? 'error' : 'warning'} />
                  <Button startIcon={<TuneRounded />} variant="outlined">Executive filters</Button>
                </Stack>
              </Stack>

              <Paper sx={{ p: 2, borderRadius: 4, border: '1px solid rgba(148,163,184,0.16)', background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.96))' }}>
                <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', xl: 'center' }}>
                  <Chip icon={<FilterAltRounded />} label="Global filters" color="primary" sx={{ alignSelf: { xs: 'flex-start', xl: 'center' } }} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1 }}>
                    <TextField label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthRounded sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
                    <TextField label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthRounded sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
                    <FormControl fullWidth>
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
                    <FormControl fullWidth>
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
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3.5 } }}>
            {activeSection === 'dashboard' ? <DashboardOverview summary={summary} chartData={chartData} chemicalByOperator={chemicalByOperator} insights={insights} setSection={setActiveSection} /> : null}
            {activeSection === 'intake' ? <IntakePage records={filteredProduction} cipRecords={filteredCip} setRecords={setProductionRecords} chartData={chartData} chemicalByOperator={chemicalByOperator} summary={summary} ranking={ranking} insights={insights} canEdit={canEdit} /> : null}
            {activeSection === 'cip' ? <CipPage records={filteredCip} setRecords={setCipRecords} chemicalByOperator={chemicalByOperator} canEdit={canEdit} /> : null}
            {activeSection === 'operators' ? <OperatorsPage ranking={ranking} insights={insights} /> : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
