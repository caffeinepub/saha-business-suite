export interface BrickSelection {
  type: string;
  quantity: number;
}

export interface PendingDelivery {
  id: string;
  date: string;
  customerName: string;
  invoiceNumber?: string;
  address: string;
  phoneNumber?: string;
  dueAmount?: number;
  bricks: BrickSelection[];
  totalBricks: number;
  safetyQuantity?: number;
  locationType: "Local" | "Outside";
}

export interface LaborEntry {
  name: string;
}

export interface VehicleConfig {
  id: string;
  vehicleType: "Tractor" | "12 Wheel";
  vehicleNumber: string;
  defaultLabors: string[];
  loadingLabors: string[];
  unloadingLabors: string[];
}

export interface RatesConfig {
  tractorLocalRate: string;
  tractorOutsideRate: string;
  tractorSafeBatsRate: string;
  wheelLocalRate: string;
  wheelOutsideRate: string;
  wheelSafeBatsRate: string;
  batsConversionInput: string;
  batsConversionOutput: string;
}

export interface CompleteDelivery {
  id: string;
  date: string;
  customerName: string;
  invoiceNumber?: string;
  address: string;
  phoneNumber?: string;
  dueAmount?: number;
  bricks: BrickSelection[];
  totalBricks: number;
  safetyQuantity?: number;
  locationType: "Local" | "Outside";
  vehicleType: "Tractor" | "12 Wheel";
  vehicleNumber: string;
  loadingLaborNames: string[];
  unloadingLaborNames: string[];
  rate?: number;
  perLaborAmount?: number;
  totalAmount?: number;
  perLoadingLaborAmount?: number;
  perUnloadingLaborAmount?: number;
  safetyBatsAmount?: number;
  paidMoney?: boolean;
}
