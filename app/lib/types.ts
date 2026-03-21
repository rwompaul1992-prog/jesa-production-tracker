export type UserRole = 'admin' | 'operator';

export type AppUser = {
  name: string;
  email: string;
  role: UserRole;
};

export type ProductionRecord = {
  id: string;
  date: string;
  offloadingShift: 'Morning' | 'Afternoon' | 'Night';
  pasteurizationShift: 'Morning' | 'Afternoon' | 'Night';
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
  cipType: 'Pre-rinse' | 'Caustic wash' | 'Acid wash' | 'Final rinse';
  chemicalUsed: 'Caustic' | 'Nitric Acid' | 'Both';
  causticJerrycansUsed: number;
  nitricAcidJerrycansUsed: number;
  notes: string;
};
