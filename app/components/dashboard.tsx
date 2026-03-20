'use client';

import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
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
import OpacityRounded from '@mui/icons-material/OpacityRounded';
import ScienceRounded from '@mui/icons-material/ScienceRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
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

const sections: Array<{ key: SectionKey; label: string; description: string; icon: React.ReactNode }> = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Plant overview and alerts',
    icon: <DashboardRounded fontSize="small" />,
  },
  {
    key: 'intake',
    label: 'Intake and Pasteurization',
    description: 'Milk intake and losses',
    icon: <LocalDrinkRounded fontSize="small" />,
  },
  {
    key: 'cip',
    label: 'GEA CIP Usage',
    description: 'Chemical cleaning records',
    icon: <CleaningServicesRounded fontSize="small" />,
  },
  {
    key: 'operators',
    label: 'Operator Performance',
    description: 'Ranking and consistency',
    icon: <LeaderboardRounded fontSize="small" />,
  },
];

function MetricCard({
  title,
  value,
  helper,
  icon,
  accent,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card
      sx={{
        height: '100%',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: alpha(accent, 0.2),
        background: `linear-gradient(145deg, ${alpha(accent, 0.18)} 0%, rgba(255,255,255,0.96) 65%)`,
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 800 }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
              {helper}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 58,
              height: 58,
              bgcolor: alpha(accent, 0.14),
              color: accent,
              boxShadow: `0 10px 30px ${alpha(accent, 0.24)}`,
            }}
          >
            {icon}
          </Avatar>
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
    <Card sx={{ height: '100%', border: '1px solid', borderColor: 'rgba(148, 163, 184, 0.15)' }}>
      <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              {eyebrow ? (
                <Typography
                  variant="overline"
                  sx={{ color: 'primary.main', letterSpacing: '0.14em', fontWeight: 800 }}
                >
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
  const updateField = <K extends keyof ProductionRecord>(
    id: string,
    field: K,
    value: ProductionRecord[K],
  ) => {
    setRecords((current) => current.map((record) => (record.id === id ? { ...record, [field]: value } : record)));
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {[
              'Date',
              'Offloading shift',
              'Pasteurization shift',
              'Offloading operator',
              'Pasteurization operator',
              'Offloaded (L)',
              'Pasteurized (L)',
              'Milk loss',
              'Loss %',
              'Remarks',
            ].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell>
                <TextField
                  type="date"
                  size="small"
                  value={record.date}
                  disabled={!canEdit}
                  onChange={(event) => updateField(record.id, 'date', event.target.value)}
                />
              </TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={record.offloadingShift}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(
                      record.id,
                      'offloadingShift',
                      event.target.value as ProductionRecord['offloadingShift'],
                    )
                  }
                >
                  {shifts.map((shift) => (
                    <MenuItem key={shift} value={shift}>
                      {shift}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={record.pasteurizationShift}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(
                      record.id,
                      'pasteurizationShift',
                      event.target.value as ProductionRecord['pasteurizationShift'],
                    )
                  }
                >
                  {shifts.map((shift) => (
                    <MenuItem key={shift} value={shift}>
                      {shift}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={record.offloadingOperator}
                  disabled={!canEdit}
                  onChange={(event) => updateField(record.id, 'offloadingOperator', event.target.value)}
                >
                  {operators.map((operator) => (
                    <MenuItem key={operator} value={operator}>
                      {operator}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={record.pasteurizationOperator}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(record.id, 'pasteurizationOperator', event.target.value)
                  }
                >
                  {operators.map((operator) => (
                    <MenuItem key={operator} value={operator}>
                      {operator}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={record.totalMilkOffloaded}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(record.id, 'totalMilkOffloaded', Number(event.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={record.totalMilkPasteurized}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(record.id, 'totalMilkPasteurized', Number(event.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <Chip
                  color={getMilkLoss(record) > 350 ? 'warning' : 'success'}
                  label={`${getMilkLoss(record).toLocaleString()} L`}
                />
              </TableCell>
              <TableCell>
                <Chip
                  color={getLossPercentage(record) > 2.5 ? 'error' : 'primary'}
                  label={`${getLossPercentage(record).toFixed(2)}%`}
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  value={record.remarks}
                  disabled={!canEdit}
                  onChange={(event) => updateField(record.id, 'remarks', event.target.value)}
                />
              </TableCell>
            </TableRow>
          ))}
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
    <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {['Date', 'Operator', 'CIP type', 'Chemical used', 'Caustic', 'Nitric acid', 'Notes'].map(
              (header) => (
                <TableCell key={header} sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {header}
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} hover>
              <TableCell>
                <TextField
                  type="date"
                  size="small"
                  value={record.date}
                  disabled={!canEdit}
                  onChange={(event) => updateField(record.id, 'date', event.target.value)}
                />
              </TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={record.operatorName}
                  disabled={!canEdit}
                  onChange={(event) => updateField(record.id, 'operatorName', event.target.value)}
                >
                  {operators.map((operator) => (
                    <MenuItem key={operator} value={operator}>
                      {operator}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={record.cipType}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(record.id, 'cipType', event.target.value as CipRecord['cipType'])
                  }
                >
                  {cipTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  select
                  size="small"
                  value={record.chemicalUsed}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(
                      record.id,
                      'chemicalUsed',
                      event.target.value as CipRecord['chemicalUsed'],
                    )
                  }
                >
                  {chemicals.map((chemical) => (
                    <MenuItem key={chemical} value={chemical}>
                      {chemical}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={record.causticJerrycansUsed}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(record.id, 'causticJerrycansUsed', Number(event.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  size="small"
                  value={record.nitricAcidJerrycansUsed}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateField(record.id, 'nitricAcidJerrycansUsed', Number(event.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  value={record.notes}
                  disabled={!canEdit}
                  onChange={(event) => updateField(record.id, 'notes', event.target.value)}
                />
              </TableCell>
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
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 6,
          color: 'white',
          background:
            'linear-gradient(135deg, #0f172a 0%, #1d4ed8 30%, #7c3aed 68%, #14b8a6 100%)',
          boxShadow: '0 24px 80px rgba(37, 99, 235, 0.28)',
        }}
      >
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} justifyContent="space-between">
          <Box>
            <Chip
              icon={<FactoryRounded />}
              label="Industrial operations cockpit"
              sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white', mb: 2 }}
            />
            <Typography variant="h4" sx={{ maxWidth: 720 }}>
              Dairy production command center for intake, pasteurization, sanitation, and operator visibility.
            </Typography>
            <Typography sx={{ mt: 1.5, opacity: 0.88, maxWidth: 760 }}>
              This redesigned shell gives supervisors a more polished plant-floor experience with fast navigation,
              operational alerts, and focused monitoring views.
            </Typography>
          </Box>
          <Stack spacing={1.2} alignItems={{ xs: 'flex-start', lg: 'flex-end' }}>
            <Chip icon={<BoltRounded />} label="Live demo mode" sx={{ bgcolor: 'white', color: 'primary.main' }} />
            <Chip
              icon={<NotificationsActiveRounded />}
              label={`Top alert: ${insights.highMilkLoss}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.14)', color: 'white', maxWidth: 380 }}
            />
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
          gap: 2.2,
        }}
      >
        <MetricCard
          title="Monthly offloaded milk"
          value={`${summary.totalOffloaded.toLocaleString()} L`}
          helper="Total raw milk intake"
          icon={<OpacityRounded />}
          accent="#2563eb"
        />
        <MetricCard
          title="Monthly pasteurized milk"
          value={`${summary.totalPasteurized.toLocaleString()} L`}
          helper="Pasteurized output"
          icon={<LocalDrinkRounded />}
          accent="#14b8a6"
        />
        <MetricCard
          title="Monthly milk loss"
          value={`${summary.totalLoss.toLocaleString()} L`}
          helper="Calculated process variance"
          icon={<WarningAmberRounded />}
          accent="#f59e0b"
        />
        <MetricCard
          title="Monthly loss percentage"
          value={`${summary.lossPercentage.toFixed(2)}%`}
          helper="Efficiency indicator"
          icon={<InsightsRounded />}
          accent="#7c3aed"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1.4fr 1fr' },
          gap: 2.2,
        }}
      >
        <SectionCard
          eyebrow="Overview"
          title="Daily milk movement"
          description="Quick comparison of intake vs pasteurization output across the current demo period."
          action={<Button onClick={() => setSection('intake')}>Open department page</Button>}
        >
          <Box sx={{ height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="offloaded" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pasteurized" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>

        <SectionCard eyebrow="Alerts" title="Operational insights" description="Key monthly observations generated from the current demo data.">
          <Stack spacing={1.6}>
            {[
              { label: 'High milk losses', value: insights.highMilkLoss, color: 'warning' as const },
              { label: 'High chemical usage', value: insights.highChemicalUsage, color: 'secondary' as const },
              { label: 'Missing entries', value: insights.missingEntries, color: 'default' as const },
              { label: 'Best operator', value: insights.bestOperator, color: 'success' as const },
              { label: 'Worst operator', value: insights.worstOperator, color: 'error' as const },
            ].map((item) => (
              <Paper key={item.label} sx={{ p: 2, borderRadius: 4 }}>
                <Stack spacing={1}>
                  <Chip size="small" color={item.color} label={item.label} sx={{ alignSelf: 'flex-start' }} />
                  <Typography variant="body2">{item.value}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' },
          gap: 2.2,
        }}
      >
        <SectionCard
          eyebrow="Sanitation"
          title="Chemical usage by operator"
          description="Caustic and nitric acid consumption by operator for the month."
          action={<Button onClick={() => setSection('cip')}>Open GEA CIP usage</Button>}
        >
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

        <SectionCard
          eyebrow="Performance"
          title="Section shortcuts"
          description="Jump straight into the focused management pages for this department."
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            {sections
              .filter((section) => section.key !== 'dashboard')
              .map((section) => (
                <Paper
                  key={section.key}
                  sx={{
                    p: 2.2,
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 18px 32px rgba(15, 23, 42, 0.08)' },
                  }}
                  onClick={() => setSection(section.key)}
                >
                  <Stack spacing={1.4}>
                    <Avatar sx={{ bgcolor: 'rgba(37, 99, 235, 0.12)', color: 'primary.main' }}>{section.icon}</Avatar>
                    <Typography fontWeight={800}>{section.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {section.description}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
          </Box>
        </SectionCard>
      </Box>
    </Stack>
  );
}

function IntakePage({
  records,
  setRecords,
  chartData,
  canEdit,
}: {
  records: ProductionRecord[];
  setRecords: React.Dispatch<React.SetStateAction<ProductionRecord[]>>;
  chartData: ReturnType<typeof buildChartData>;
  canEdit: boolean;
}) {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: 3,
          borderRadius: 5,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(20,184,166,0.18) 100%)',
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'primary.main', fontWeight: 800 }}>
          Department page
        </Typography>
        <Typography variant="h4">Intake and Pasteurization</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Focused view for intake volumes, pasteurization output, and milk loss control.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1.35fr 0.95fr' },
          gap: 2.2,
        }}
      >
        <SectionCard
          eyebrow="Production"
          title="Daily offloaded vs pasteurized milk"
          description="Compare intake and processed output to spot throughput gaps quickly."
        >
          <Box sx={{ height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="offloaded" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pasteurized" fill="#14b8a6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>

        <SectionCard eyebrow="Loss trend" title="Daily milk loss" description="Track process loss by day to identify unstable runs faster.">
          <Box sx={{ height: 330 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="loss" stroke="#dc2626" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </SectionCard>
      </Box>

      <SectionCard
        eyebrow="Records"
        title="Monthly production table"
        description="Spreadsheet-style editable table for intake and pasteurization entries."
        action={<Chip color={canEdit ? 'success' : 'default'} label={canEdit ? 'Edit mode enabled' : 'View only mode'} />}
      >
        <EditableProductionTable records={records} setRecords={setRecords} canEdit={canEdit} />
      </SectionCard>
    </Stack>
  );
}

function CipPage({
  records,
  setRecords,
  chemicalByOperator,
  canEdit,
}: {
  records: CipRecord[];
  setRecords: React.Dispatch<React.SetStateAction<CipRecord[]>>;
  chemicalByOperator: ReturnType<typeof buildChemicalUsageByOperator>;
  canEdit: boolean;
}) {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: 3,
          borderRadius: 5,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(245,158,11,0.18) 100%)',
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'secondary.main', fontWeight: 800 }}>
          Sanitation page
        </Typography>
        <Typography variant="h4">GEA CIP Usage</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Monitor chemical usage, operator sanitation activity, and cleaning intensity across the department.
        </Typography>
      </Box>

      <SectionCard
        eyebrow="Chemical monitoring"
        title="Monthly chemical usage by operator"
        description="Visual comparison of caustic and nitric acid consumption across operators."
      >
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

      <SectionCard
        eyebrow="Records"
        title="GEA CIP chemical usage table"
        description="Editable log for caustic and nitric acid usage tied to sanitation cycles."
        action={<Chip color={canEdit ? 'success' : 'default'} label={canEdit ? 'Edit mode enabled' : 'View only mode'} />}
      >
        <EditableCipTable records={records} setRecords={setRecords} canEdit={canEdit} />
      </SectionCard>
    </Stack>
  );
}

function OperatorsPage({
  ranking,
  insights,
}: {
  ranking: ReturnType<typeof buildOperatorRanking>;
  insights: ReturnType<typeof buildInsights>;
}) {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          p: 3,
          borderRadius: 5,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(37,99,235,0.15) 100%)',
        }}
      >
        <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'success.main', fontWeight: 800 }}>
          Performance page
        </Typography>
        <Typography variant="h4">Operator Performance</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Review rank, loss rate, sanitation efficiency, completeness, and consistency for each operator.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
          gap: 2.2,
        }}
      >
        <SectionCard eyebrow="Ranking" title="Operator leaderboard" description="Blended score using loss, chemical usage, completeness, and consistency.">
          <Stack spacing={2}>
            {ranking.map((entry) => (
              <Paper key={entry.operator} sx={{ p: 2.3, borderRadius: 4 }}>
                <Stack spacing={1.3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={800}>
                      #{entry.rank} {entry.operator}
                    </Typography>
                    <Chip
                      label={`${entry.score.toFixed(1)} pts`}
                      color={entry.rank === 1 ? 'success' : entry.rank === ranking.length ? 'error' : 'primary'}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Lower losses and lower chemical intensity improve the final score.
                  </Typography>
                  <Divider />
                  <Typography variant="body2">Loss rate: {entry.lossRate.toFixed(2)}%</Typography>
                  <Typography variant="body2">
                    Chemical intensity: {entry.chemicalIntensity.toFixed(2)} jerrycans/activity
                  </Typography>
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
            <Paper sx={{ p: 2.2, borderRadius: 4 }}>
              <Stack spacing={0.8}>
                <Chip color="success" label="Best operator of the month" sx={{ alignSelf: 'flex-start' }} />
                <Typography fontWeight={700}>{insights.bestOperator}</Typography>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2.2, borderRadius: 4 }}>
              <Stack spacing={0.8}>
                <Chip color="error" label="Worst operator of the month" sx={{ alignSelf: 'flex-start' }} />
                <Typography fontWeight={700}>{insights.worstOperator}</Typography>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2.2, borderRadius: 4 }}>
              <Stack spacing={0.8}>
                <Chip color="warning" label="High milk loss" sx={{ alignSelf: 'flex-start' }} />
                <Typography variant="body2">{insights.highMilkLoss}</Typography>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2.2, borderRadius: 4 }}>
              <Stack spacing={0.8}>
                <Chip color="secondary" label="High chemical usage" sx={{ alignSelf: 'flex-start' }} />
                <Typography variant="body2">{insights.highChemicalUsage}</Typography>
              </Stack>
            </Paper>
          </Stack>
        </SectionCard>
      </Box>
    </Stack>
  );
}

export function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [productionRecords, setProductionRecords] = useState(demoProductionData);
  const [cipRecords, setCipRecords] = useState(demoCipData);
  const [operatorFilter, setOperatorFilter] = useState('All operators');
  const [activeSection, setActiveSection] = useState<SectionKey>('dashboard');

  const filteredProduction = useMemo(() => {
    if (operatorFilter === 'All operators') return productionRecords;
    return productionRecords.filter(
      (record) =>
        record.offloadingOperator === operatorFilter || record.pasteurizationOperator === operatorFilter,
    );
  }, [operatorFilter, productionRecords]);

  const filteredCip = useMemo(() => {
    if (operatorFilter === 'All operators') return cipRecords;
    return cipRecords.filter((record) => record.operatorName === operatorFilter);
  }, [operatorFilter, cipRecords]);

  const summary = useMemo(() => buildMonthlySummary(filteredProduction, filteredCip), [filteredCip, filteredProduction]);
  const chartData = useMemo(() => buildChartData(filteredProduction), [filteredProduction]);
  const chemicalByOperator = useMemo(() => buildChemicalUsageByOperator(filteredCip), [filteredCip]);
  const ranking = useMemo(() => buildOperatorRanking(filteredProduction, filteredCip), [filteredCip, filteredProduction]);
  const insights = useMemo(() => buildInsights(filteredProduction, filteredCip), [filteredCip, filteredProduction]);
  const canEdit = user.role === 'admin';
  const currentSection = sections.find((section) => section.key === activeSection) ?? sections[0];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eff4fb' }}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Box
          sx={{
            width: { xs: 96, md: drawerWidth },
            flexShrink: 0,
            bgcolor: '#0f172a',
            color: 'white',
            p: { xs: 1.5, md: 2.4 },
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            position: 'sticky',
            top: 0,
            height: '100vh',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
              <FactoryRounded />
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography fontWeight={900}>JESA Tracker</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.64)' }}>
                Dairy operations suite
              </Typography>
            </Box>
          </Stack>

          <Paper
            sx={{
              p: 2,
              mb: 2.5,
              borderRadius: 4,
              color: 'white',
              background: 'linear-gradient(145deg, rgba(37,99,235,0.25), rgba(124,58,237,0.25))',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Stack spacing={1.2} alignItems={{ xs: 'center', md: 'flex-start' }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'white' }}>
                <GroupsRounded />
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography fontWeight={800}>{user.name}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {user.role === 'admin' ? 'Admin / Supervisor' : 'Operator'}
                </Typography>
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
                  sx={{
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    px: { xs: 0.8, md: 1.6 },
                    py: 1.3,
                    color: 'white',
                    bgcolor: active ? 'rgba(255,255,255,0.14)' : 'transparent',
                    border: active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 } },
                  }}
                >
                  <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
                    <Typography fontWeight={800} variant="body2">
                      {section.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.66)' }}>
                      {section.description}
                    </Typography>
                  </Box>
                </Button>
              );
            })}
          </Stack>

          <Button color="inherit" onClick={onLogout} sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.08)' }}>
            Logout
          </Button>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 5,
              px: { xs: 2, md: 3.5 },
              py: 2,
              borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
              backdropFilter: 'blur(18px)',
              bgcolor: 'rgba(239,244,251,0.85)',
            }}
          >
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <IconButton sx={{ display: { md: 'none' }, bgcolor: 'white' }}>
                  <MenuRounded />
                </IconButton>
                <Box>
                  <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.14em', fontWeight: 800 }}>
                    Intake operations / March 2026
                  </Typography>
                  <Typography variant="h5">{currentSection.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentSection.description}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                <Chip icon={<WaterDropRounded />} label={`${summary.totalLoss.toLocaleString()} L loss this month`} color="warning" />
                <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'white' }}>
                  <InputLabel>Operator filter</InputLabel>
                  <Select
                    value={operatorFilter}
                    label="Operator filter"
                    onChange={(event) => setOperatorFilter(event.target.value)}
                  >
                    <MenuItem value="All operators">All operators</MenuItem>
                    {operators.map((operator) => (
                      <MenuItem key={operator} value={operator}>
                        {operator}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button startIcon={<TuneRounded />} variant="outlined">
                  Filters ready
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3.5 } }}>
            {activeSection === 'dashboard' ? (
              <DashboardOverview
                summary={summary}
                chartData={chartData}
                chemicalByOperator={chemicalByOperator}
                insights={insights}
                setSection={setActiveSection}
              />
            ) : null}

            {activeSection === 'intake' ? (
              <IntakePage
                records={filteredProduction}
                setRecords={setProductionRecords}
                chartData={chartData}
                canEdit={canEdit}
              />
            ) : null}

            {activeSection === 'cip' ? (
              <CipPage
                records={filteredCip}
                setRecords={setCipRecords}
                chemicalByOperator={chemicalByOperator}
                canEdit={canEdit}
              />
            ) : null}

            {activeSection === 'operators' ? (
              <OperatorsPage ranking={ranking} insights={insights} />
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
