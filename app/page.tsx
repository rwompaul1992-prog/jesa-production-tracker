'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
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
import LockOpenRounded from '@mui/icons-material/LockOpenRounded';
import ShieldRounded from '@mui/icons-material/ShieldRounded';
import PrecisionManufacturingRounded from '@mui/icons-material/PrecisionManufacturingRounded';
import CloudDoneRounded from '@mui/icons-material/CloudDoneRounded';
import { Dashboard } from '@/app/components/dashboard';
import { AppUser, UserRole } from '@/app/lib/types';
import { supabase } from '@/app/lib/supabase';

const demoUsers: Record<string, AppUser> = {
  'admin@jesa.local': { name: 'JESA Supervisor', email: 'admin@jesa.local', role: 'admin' },
  'mpima@jesa.local': { name: 'Mpima Abubakar', email: 'mpima@jesa.local', role: 'operator' },
  'saadi@jesa.local': { name: 'Saadi Wakabi', email: 'saadi@jesa.local', role: 'operator' },
  'robert@jesa.local': { name: 'Robert Bakwatanisa', email: 'robert@jesa.local', role: 'operator' },
  'manano@jesa.local': { name: 'Manano Vicent', email: 'manano@jesa.local', role: 'operator' },
};

export default function HomePage() {
  const [email, setEmail] = useState('admin@jesa.local');
  const [password, setPassword] = useState('demo1234');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [user, setUser] = useState<AppUser | null>(null);
  const [error, setError] = useState('');

  const supabaseStatus = useMemo(
    () => (supabase ? 'Supabase client configured. Replace demo login with live auth.' : 'Demo authentication mode. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase auth.'),
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
      setError('Invalid credentials for the selected role in demo mode.');
      return;
    }

    setUser(matchedUser);
  };

  if (user) {
    return <Dashboard user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={2.5}>
              <Chip icon={<PrecisionManufacturingRounded />} label="Dairy plant production tracking" color="primary" sx={{ alignSelf: 'flex-start' }} />
              <Typography variant="h3">Production Tracker v1 for Intake and Pasteurization</Typography>
              <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
                A colorful, deployable Next.js dashboard for intake volumes, pasteurization output, milk loss, GEA CIP chemical usage, operator performance, and monthly plant insights.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Card sx={{ flex: 1, bgcolor: '#eff6ff' }}>
                  <CardContent>
                    <ShieldRounded color="primary" />
                    <Typography variant="h6" sx={{ mt: 1 }}>Role-based access</Typography>
                    <Typography variant="body2" color="text.secondary">Admin/supervisor can edit records, while operators get a controlled operational view.</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, bgcolor: '#ecfeff' }}>
                  <CardContent>
                    <CloudDoneRounded color="secondary" />
                    <Typography variant="h6" sx={{ mt: 1 }}>Supabase-ready</Typography>
                    <Typography variant="body2" color="text.secondary">Authentication and schema are prepared for a live Supabase backend without complicating v1 delivery.</Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LockOpenRounded color="primary" />
                    <Typography variant="h5">Login</Typography>
                  </Stack>
                  <Alert severity={supabase ? 'success' : 'info'}>{supabaseStatus}</Alert>
                  {error ? <Alert severity="error">{error}</Alert> : null}
                  <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
                  <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth helperText="Use demo1234 for the included demo accounts." />
                  <TextField select label="Role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as UserRole)} fullWidth>
                    <MenuItem value="admin">Admin / Supervisor</MenuItem>
                    <MenuItem value="operator">Operator</MenuItem>
                  </TextField>
                  <Button size="large" onClick={handleLogin}>Enter dashboard</Button>
                  <Box>
                    <Typography fontWeight={700} variant="body2">Demo accounts</Typography>
                    <Typography variant="body2" color="text.secondary">admin@jesa.local, mpima@jesa.local, saadi@jesa.local, robert@jesa.local, manano@jesa.local</Typography>
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
