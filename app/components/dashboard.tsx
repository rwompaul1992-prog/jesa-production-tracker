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
  Grid,
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
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import OpacityRounded from '@mui/icons-material/OpacityRounded';
import ScienceRounded from '@mui/icons-material/ScienceRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import FactoryRounded from '@mui/icons-material/FactoryRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
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
import { buildChartData, buildChemicalUsageByOperator, buildInsights, buildMonthlySummary, buildOperatorRanking, getLossPercentage, getMilkLoss } from '@/app/lib/analytics';
import { AppUser, CipRecord, ProductionRecord } from '@/app/lib/types';

const shifts = ['Morning', 'Afternoon', 'Night'] as const;
const cipTypes = ['Pre-rinse', 'Caustic wash', 'Acid wash', 'Final rinse'] as const;
const chemicals = ['Caustic', 'Nitric Acid', 'Both'] as const;

function MetricCard({ title, value, helper, icon, color }: { title: string; value: string; helper: string; icon: React.ReactNode; color: string }) {
  return (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color} 0%, #ffffff 100%)` }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography color="text.secondary" variant="body2">{title}</Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{helper}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.85)', color: 'primary.main', width: 56, height: 56 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EditableProductionTable({ records, setRecords, canEdit }: { records: ProductionRecord[]; setRecords: React.Dispatch<React.SetStateAction<ProductionRecord[]>>; canEdit: boolean }) {
  const updateField = <K extends keyof ProductionRecord>(id: string, field: K, value: ProductionRecord[K]) => {
    setRecords((current) => current.map((record) => (record.id === id ? { ...record, [field]: value } : record)));
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {['Date', 'Offloading shift', 'Pasteurization shift', 'Offloading operator', 'Pasteurization operator', 'Offloaded (L)', 'Pasteurized (L)', 'Milk loss', 'Loss %', 'Remarks'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 800 }}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} hover>
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
              <TableCell><Chip color={getMilkLoss(record) > 350 ? 'warning' : 'success'} label={`${getMilkLoss(record).toLocaleString()} L`} /></TableCell>
              <TableCell><Chip color={getLossPercentage(record) > 2.5 ? 'error' : 'primary'} label={`${getLossPercentage(record).toFixed(2)}%`} /></TableCell>
              <TableCell><TextField size="small" value={record.remarks} disabled={!canEdit} onChange={(event) => updateField(record.id, 'remarks', event.target.value)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function EditableCipTable({ records, setRecords, canEdit }: { records: CipRecord[]; setRecords: React.Dispatch<React.SetStateAction<CipRecord[]>>; canEdit: boolean }) {
  const updateField = <K extends keyof CipRecord>(id: string, field: K, value: CipRecord[K]) => {
    setRecords((current) => current.map((record) => (record.id === id ? { ...record, [field]: value } : record)));
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {['Date', 'Operator', 'CIP type', 'Chemical used', 'Caustic', 'Nitric acid', 'Notes'].map((header) => (
              <TableCell key={header} sx={{ fontWeight: 800 }}>{header}</TableCell>
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

export function Dashboard({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const [productionRecords, setProductionRecords] = useState(demoProductionData);
  const [cipRecords, setCipRecords] = useState(demoCipData);
  const [operatorFilter, setOperatorFilter] = useState('All operators');

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

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 55%, #14b8a6 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3}>
              <Box>
                <Chip icon={<FactoryRounded />} label="Department dashboard" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white', mb: 2 }} />
                <Typography variant="h4">INTAKE AND PASTEURIZATION</Typography>
                <Typography sx={{ mt: 1.5, opacity: 0.9, maxWidth: 780 }}>
                  Spreadsheet-like dairy production tracking with role-aware access, editable records, chemical monitoring, operator performance rankings, and actionable monthly insights.
                </Typography>
              </Box>
              <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={1.5}>
                <Chip icon={<GroupsRounded />} label={`${user.name} • ${user.role === 'admin' ? 'Admin / Supervisor' : 'Operator'}`} sx={{ bgcolor: 'white', color: 'primary.main', fontWeight: 700 }} />
                <FormControl size="small" sx={{ minWidth: 210, bgcolor: 'white', borderRadius: 3 }}>
                  <InputLabel>Operator filter</InputLabel>
                  <Select value={operatorFilter} label="Operator filter" onChange={(event) => setOperatorFilter(event.target.value)}>
                    <MenuItem value="All operators">All operators</MenuItem>
                    {operators.map((operator) => <MenuItem key={operator} value={operator}>{operator}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button onClick={onLogout} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>Logout</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6, xl: 2 }}><MetricCard title="Monthly offloaded milk" value={`${summary.totalOffloaded.toLocaleString()} L`} helper="Total intake recorded" icon={<OpacityRounded />} color="#dbeafe" /></Grid>
          <Grid size={{ xs: 12, md: 6, xl: 2 }}><MetricCard title="Monthly pasteurized milk" value={`${summary.totalPasteurized.toLocaleString()} L`} helper="Processed through pasteurizer" icon={<TrendingUpRounded />} color="#dcfce7" /></Grid>
          <Grid size={{ xs: 12, md: 6, xl: 2 }}><MetricCard title="Monthly milk loss" value={`${summary.totalLoss.toLocaleString()} L`} helper="Calculated from intake vs output" icon={<WarningAmberRounded />} color="#fef3c7" /></Grid>
          <Grid size={{ xs: 12, md: 6, xl: 2 }}><MetricCard title="Monthly loss percentage" value={`${summary.lossPercentage.toFixed(2)}%`} helper="Efficiency indicator" icon={<InsightsRounded />} color="#fae8ff" /></Grid>
          <Grid size={{ xs: 12, md: 6, xl: 2 }}><MetricCard title="Total caustic used" value={`${summary.totalCaustic} jerrycans`} helper="CIP chemical usage" icon={<ScienceRounded />} color="#cffafe" /></Grid>
          <Grid size={{ xs: 12, md: 6, xl: 2 }}><MetricCard title="Total nitric used" value={`${summary.totalNitric} jerrycans`} helper="CIP acid usage" icon={<ScienceRounded />} color="#fee2e2" /></Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Daily offloaded vs pasteurized milk</Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="offloaded" fill="#2563eb" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="pasteurized" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Daily milk loss trend</Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="loss" stroke="#dc2626" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Monthly chemical usage by operator</Typography>
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chemicalByOperator}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="operator" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="caustic" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="nitric" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, xl: 8 }}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6">Monthly production table</Typography>
                    <Typography variant="body2" color="text.secondary">Editable for admins; operators get a view-only spreadsheet.</Typography>
                  </Box>
                  <Chip color={canEdit ? 'success' : 'default'} label={canEdit ? 'Edit mode enabled' : 'View only mode'} />
                </Stack>
                <EditableProductionTable records={filteredProduction} setRecords={setProductionRecords} canEdit={canEdit} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, xl: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6">Insights</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {[
                    { label: 'High milk losses', value: insights.highMilkLoss, color: 'warning' as const },
                    { label: 'High chemical usage', value: insights.highChemicalUsage, color: 'secondary' as const },
                    { label: 'Missing entries', value: insights.missingEntries, color: 'default' as const },
                    { label: 'Best operator of the month', value: insights.bestOperator, color: 'success' as const },
                    { label: 'Worst operator of the month', value: insights.worstOperator, color: 'error' as const },
                  ].map((item) => (
                    <Paper key={item.label} sx={{ p: 2.2, borderRadius: 4 }}>
                      <Stack spacing={1}>
                        <Chip size="small" color={item.color} label={item.label} sx={{ alignSelf: 'flex-start' }} />
                        <Typography variant="body2">{item.value}</Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, xl: 8 }}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6">GEA CIP chemical usage table</Typography>
                    <Typography variant="body2" color="text.secondary">Linked operational sanitation log for caustic and nitric acid consumption.</Typography>
                  </Box>
                </Stack>
                <EditableCipTable records={filteredCip} setRecords={setCipRecords} canEdit={canEdit} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, xl: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <EmojiEventsRounded color="warning" />
                  <Typography variant="h6">Operator ranking</Typography>
                </Stack>
                <Stack spacing={2}>
                  {ranking.map((entry) => (
                    <Paper key={entry.operator} sx={{ p: 2, borderRadius: 4 }}>
                      <Stack spacing={1.2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={700}>#{entry.rank} {entry.operator}</Typography>
                          <Chip label={`${entry.score.toFixed(1)} pts`} color={entry.rank === 1 ? 'success' : entry.rank === ranking.length ? 'error' : 'primary'} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">Lowest loss, chemical efficiency, completeness, and consistency are blended into one score.</Typography>
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
