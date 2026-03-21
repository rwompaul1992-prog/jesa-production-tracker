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
