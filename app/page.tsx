'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import PrecisionManufacturingRounded from '@mui/icons-material/PrecisionManufacturingRounded';
import CloudDoneRounded from '@mui/icons-material/CloudDoneRounded';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import WaterDropRounded from '@mui/icons-material/WaterDropRounded';
import TimelineRounded from '@mui/icons-material/TimelineRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import { Dashboard } from '@/app/components/dashboard';
import { AppUser, UserRole } from '@/app/lib/types';
import { supabase } from '@/app/lib/supabase';

const demoUsers: Record<string, AppUser> = {
  'admin@jesa.local': { name: 'JESA Supervisor', email: 'admin@jesa.local', role: 'admin', workspace: 'all' },
  'mpima@jesa.local': { name: 'Mpima Abubakar', email: 'mpima@jesa.local', role: 'operator', workspace: 'pasteurization' },
  'saadi@jesa.local': { name: 'Saadi Wakabi', email: 'saadi@jesa.local', role: 'operator', workspace: 'pasteurization' },
  'robert@jesa.local': { name: 'Robert Bakwatanisa', email: 'robert@jesa.local', role: 'operator', workspace: 'pasteurization' },
  'manano@jesa.local': { name: 'Manano Vicent', email: 'manano@jesa.local', role: 'operator', workspace: 'pasteurization' },
  'kabogoza@jesa.local': { name: 'Kabogoza Eric', email: 'kabogoza@jesa.local', role: 'operator', workspace: 'fresh-milk' },
  'njagala@jesa.local': { name: 'Njagala Robert', email: 'njagala@jesa.local', role: 'operator', workspace: 'fresh-milk' },
  'semujju@jesa.local': { name: 'Semujju David', email: 'semujju@jesa.local', role: 'operator', workspace: 'fresh-milk' },
  'asiimwe@jesa.local': { name: 'Asiimwe Richard', email: 'asiimwe@jesa.local', role: 'operator', workspace: 'fresh-milk' },
  'eruchu@jesa.local': { name: 'Eruchu James', email: 'eruchu@jesa.local', role: 'operator', workspace: 'fresh-milk' },
  'telly@jesa.local': { name: 'Telly Vicent', email: 'telly@jesa.local', role: 'operator', workspace: 'fresh-milk' },
  'sentongo@jesa.local': { name: 'Sentongo Kassim', email: 'sentongo@jesa.local', role: 'operator', workspace: 'fresh-milk' },
  'semakula@jesa.local': { name: 'Semakula Francis', email: 'semakula@jesa.local', role: 'operator', workspace: 'pasteurization' },
'opidi@jesa.local': { name: 'Opidi Lawrence', email: 'opidi@jesa.local', role: 'operator', workspace: 'pasteurization' },
};

export default function HomePage() {
  const [email, setEmail] = useState('admin@jesa.local');
  const [password, setPassword] = useState('demo1234');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState('');

  const supabaseStatus = useMemo(
    () => (supabase ? 'Supabase connection detected. Replace demo login with live authentication.' : 'Demo authentication enabled. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to switch on live Supabase access.'),
    [],
  );

  const handleLogin = async () => {
    setError('');

    if (supabase) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
    }

    const matchedUser = demoUsers[email.toLowerCase()];
    if (!matchedUser || matchedUser.role !== selectedRole) {
      setError('Invalid credentials for the selected workspace role in demo mode.');
      return;
    }

    setUser(matchedUser);
  };

  if (user) {
    return <Dashboard user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 3, md: 4.5 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(circle at 18% 24%, rgba(47,109,246,0.2), transparent 28%)',
            'radial-gradient(circle at 82% 18%, rgba(20,184,166,0.16), transparent 22%)',
            'radial-gradient(circle at 76% 78%, rgba(245,158,11,0.12), transparent 18%)',
          ].join(','),
        }}
      />
      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                minHeight: { md: 700 },
                color: 'white',
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(145deg, #081121 0%, #10284d 42%, #0f766e 100%)',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: [
                    'radial-gradient(circle at 16% 18%, rgba(96,165,250,0.28), transparent 22%)',
                    'radial-gradient(circle at 86% 14%, rgba(45,212,191,0.18), transparent 18%)',
                    'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0))',
                  ].join(','),
                }}
              />
              <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative', height: '100%' }}>
                <Stack justifyContent="space-between" sx={{ height: '100%' }}>
                  <Stack spacing={2.6}>
                    <Chip
                      icon={<PrecisionManufacturingRounded />}
                      label="Industrial dairy operations intelligence"
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'white',
                        bgcolor: alpha('#ffffff', 0.1),
                        borderColor: alpha('#ffffff', 0.14),
                        backdropFilter: 'blur(10px)',
                      }}
                    />
                    <Stack spacing={1.6}>
                      <Typography variant="h3" sx={{ maxWidth: 560 }}>
                        Production visibility, operator accountability, and loss control.
                      </Typography>
                      <Typography sx={{ color: 'rgba(226,232,240,0.78)', maxWidth: 560, fontSize: '1rem' }}>
                        Secure access to daily plant performance with a sharper operational workspace for intake, pasteurization, sanitation logging, and exception review.
                      </Typography>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      {[
                        { icon: <InsightsRounded fontSize="small" />, title: 'Executive control', text: 'Monitor loss, throughput, and chemical usage in one command surface.' },
                        { icon: <ShieldRounded fontSize="small" />, title: 'Controlled access', text: 'Separate admin oversight from focused operator entry workflows.' },
                      ].map((item) => (
                        <Card
                          key={item.title}
                          sx={{
                            flex: 1,
                            color: 'white',
                            bgcolor: alpha('#ffffff', 0.08),
                            borderColor: alpha('#ffffff', 0.12),
                            backdropFilter: 'blur(12px)',
                          }}
                        >
                          <CardContent sx={{ p: 2.2 }}>
                            <Avatar sx={{ bgcolor: alpha('#ffffff', 0.12), color: '#93c5fd', width: 40, height: 40 }}>{item.icon}</Avatar>
                            <Typography variant="h6" sx={{ mt: 1.4 }}>{item.title}</Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.72)', mt: 0.6 }}>{item.text}</Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Stack>

                  <Stack spacing={1.6} sx={{ mt: { xs: 3, md: 4 } }}>
                    <Card
                      sx={{
                        bgcolor: alpha('#081121', 0.32),
                        color: 'white',
                        borderColor: alpha('#ffffff', 0.1),
                        backdropFilter: 'blur(14px)',
                      }}
                    >
                      <CardContent sx={{ p: 2.2 }}>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(191,219,254,0.9)' }}>Live dashboard preview</Typography>
                              <Typography variant="h6">Daily production pulse</Typography>
                            </Box>
                            <Chip label="March 2026" size="small" sx={{ bgcolor: alpha('#ffffff', 0.08), color: 'white' }} />
                          </Stack>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.2 }}>
                            {[
                              { label: 'Offloaded', value: '382k L', tone: '#60a5fa', icon: <WaterDropRounded fontSize="small" /> },
                              { label: 'Loss rate', value: '2.14%', tone: '#fbbf24', icon: <TrendingUpRounded fontSize="small" /> },
                              { label: 'CIP logs', value: '84', tone: '#2dd4bf', icon: <TimelineRounded fontSize="small" /> },
                            ].map((metric) => (
                              <Box
                                key={metric.label}
                                sx={{
                                  p: 1.4,
                                  borderRadius: 3,
                                  bgcolor: alpha('#ffffff', 0.06),
                                  border: `1px solid ${alpha(metric.tone, 0.18)}`,
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption" sx={{ color: 'rgba(226,232,240,0.72)' }}>{metric.label}</Typography>
                                  <Box sx={{ color: metric.tone }}>{metric.icon}</Box>
                                </Stack>
                                <Typography variant="h6" sx={{ mt: 1 }}>{metric.value}</Typography>
                              </Box>
                            ))}
                          </Box>
                          <Box sx={{ height: 110, borderRadius: 4, bgcolor: alpha('#ffffff', 0.05), overflow: 'hidden', p: 1.5, position: 'relative' }}>
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 'auto 18px 18px 18px',
                                height: 76,
                                borderRadius: 4,
                                background: 'linear-gradient(180deg, rgba(47,109,246,0.24), rgba(47,109,246,0.02))',
                                clipPath: 'polygon(0% 88%, 12% 64%, 24% 70%, 36% 42%, 48% 52%, 60% 24%, 72% 34%, 84% 18%, 100% 6%, 100% 100%, 0% 100%)',
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 'auto 18px 18px 18px',
                                height: 76,
                                borderBottom: '2px solid rgba(96,165,250,0.9)',
                                clipPath: 'polygon(0% 88%, 12% 64%, 24% 70%, 36% 42%, 48% 52%, 60% 24%, 72% 34%, 84% 18%, 100% 6%, 100% 10%, 84% 22%, 72% 38%, 60% 28%, 48% 56%, 36% 46%, 24% 74%, 12% 68%, 0% 92%)',
                              }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                minHeight: { md: 700 },
                background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
              }}
            >
              <CardContent sx={{ p: { xs: 3, md: 4.2 }, height: '100%' }}>
                <Stack spacing={2.6} sx={{ height: '100%' }}>
                  <Stack spacing={1.6}>
                    <Chip icon={<LockOpenRounded />} label="Secure platform access" color="primary" sx={{ alignSelf: 'flex-start' }} />
                    <Box>
                      <Typography variant="h4">Access the JESA operations command center.</Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Authenticate to review plant performance, operator entries, and sanitation compliance from a single controlled workspace.
                      </Typography>
                    </Box>
                  </Stack>

                  <Alert severity={supabase ? 'success' : 'info'} sx={{ borderRadius: 3 }}>{supabaseStatus}</Alert>
                  {error ? <Alert severity="error">{error}</Alert> : null}

                  <Stack spacing={1.5}>
                    <TextField label="Work email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
                    <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth helperText="Use demo1234 for the bundled evaluation accounts." />
                    <TextField select label="Workspace role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as UserRole)} fullWidth>
                      <MenuItem value="admin">Admin / Supervisor</MenuItem>
                      <MenuItem value="operator">Operator</MenuItem>
                    </TextField>
                  </Stack>

                  <Button size="large" onClick={handleLogin}>Open operations workspace</Button>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, rgba(47,109,246,0.08), rgba(20,184,166,0.08))',
                      border: '1px solid rgba(148,163,184,0.16)',
                    }}
                  >
                    <Stack spacing={1.2}>
                      <Typography fontWeight={800} variant="body2">Included demo identities</Typography>
                      <Typography variant="body2" color="text.secondary">
                        admin@jesa.local, mpima@jesa.local, saadi@jesa.local, robert@jesa.local, manano@jesa.local, kabogoza@jesa.local, njagala@jesa.local, semujju@jesa.local, asiimwe@jesa.local, eruchu@jesa.local, telly@jesa.local, sentongo@jesa.local
                      </Typography>
                    </Stack>
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, letterSpacing: '0.08em' }}>
                      Operational highlights
                    </Typography>
                    <Stack spacing={1.1} sx={{ mt: 1.2 }}>
                      {[
                        'Live production intelligence for intake, pasteurization, and daily loss.',
                        'Cleaner operator accountability with role-specific entry views.',
                        'Fresh Milk pouch machine logging and supervisor review with measurable KPIs only.',
                        'Sanitation visibility designed for realistic daily plant use.',
                      ].map((item) => (
                        <Stack key={item} direction="row" spacing={1.1} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#2f6df6', 0.1), color: 'primary.main' }}>
                            <CloudDoneRounded sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">{item}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
