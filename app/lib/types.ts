export type UserRole = 'admin' | 'operator';

export type AppUser = {
  name: string;
  email: string;
  role: UserRole;
};

export type Shift = 'Morning' | 'Afternoon' | 'Night';
export type CipType = 'Caustic wash' | 'Caustic and Acid wash';
export type ChemicalUsed = 'Caustic' | 'Nitric Acid' | 'Both';
export type EntryStatus = 'saved' | 'pending' | 'missing';

export type ProductionRecord = {
  id: string;
  date: string;
  offloadingShift: Shift;
  pasteurizationShift: Shift;
  offloadingOperator: string;
  pasteurizationOperator: string;
  totalMilkOffloaded: number;
  totalMilkPasteurized: number;
  remarks: string;
};

export type CipRecord = {
  id: string;
  date: string;
  operatorName: string;
  cipType: CipType;
  chemicalUsed: ChemicalUsed;
  causticJerrycansUsed: number;
  nitricAcidJerrycansUsed: number;
};

export type OperatorDailyEntry = {
  id: string;
  date: string;
  operatorName: string;
  offloadingShift: Shift;
  pasteurizationShift: Shift;
  milkOffloaded: number;
  milkPasteurized: number;
  cipDone: boolean;
  cipType: CipType;
  causticJerrycansUsed: number;
  nitricJerrycansUsed: number;
};

export type OperatorPerformanceBadge = 'best' | 'worst' | 'improving' | 'risky' | 'steady';

export type OperatorPerformanceAnomaly = {
  date: string;
  severity: 'high' | 'medium';
  type: 'high_loss' | 'high_chemical' | 'missing_entry' | 'gain' | 'spike';
  message: string;
};

export type OperatorPerformanceTrendPoint = {
  date: string;
  lossPercentage: number;
  causticPer1000L: number;
  nitricPer1000L: number;
  milkHandled: number;
  milkLoss: number;
};

export type OperatorPerformanceEntry = {
  operator: string;
  rank: number;
  score: number;
  badge: OperatorPerformanceBadge;
  positionLabel: string;
  totalMilkHandled: number;
  totalMilkLoss: number;
  averageLossPercentage: number;
  causticPer1000Litres: number;
  nitricPer1000Litres: number;
  chemicalEfficiencyScore: number;
  dataCompleteness: number;
  consistency: number;
  lossPerformanceScore: number;
  trendDelta: number;
  filledDays: number;
  missingDays: number;
  anomalies: OperatorPerformanceAnomaly[];
  trend: OperatorPerformanceTrendPoint[];
};

export type OperatorPerformanceSummary = {
  operators: OperatorPerformanceEntry[];
  bestOperator?: string;
  worstOperator?: string;
  riskyOperators: string[];
  improvingOperators: string[];
};
