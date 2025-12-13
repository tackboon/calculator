import { DBSchema, openDB } from "idb";
import { LotTyp } from "../component/forex/lot_typ_input_box/lot_typ.component";
import {
  FeeTyp,
  ProfitGoalTyp as ForexProfitGoalTyp,
} from "../form/calculator/forex/forex_calculator_form.type";
import {
  ProfitGoalTyp as StockProfitGoalTyp,
  ProfitGoalUnit,
  StopLossTyp,
  UnitType,
} from "../form/calculator/stock/position_size/position_size.type";

export type StockPositionSizePreload = {
  portfolioCapital: string;
  maxPortfolioRisk: string;
  unitType: UnitType;
  stopLossTyp: StopLossTyp;
  includeProfitGoal: boolean;
  profitGoalTyp: StockProfitGoalTyp;
  profitGoalUnit: ProfitGoalUnit;
  includeTradingFee: boolean;
  estTradingFee: string;
  minTradingFee: string;
  precision: number;
};

export type ForexPositionSizePreload = {
  portfolioCapital: string;
  maxPortfolioRisk: string;
  accBaseCurrency: string;
  lotTyp: LotTyp;
  includeProfitGoal: boolean;
  profitGoalTyp: ForexProfitGoalTyp;
  includeTradingFee: boolean;
  feeTyp: FeeTyp;
  estTradingFee: string;
  leverage: number;
  precision: number;
  includePrice: boolean;
  slippage: string;
};

type PreloadMap = {
  stock: StockPositionSizePreload;
  forex: ForexPositionSizePreload;
};

interface PreloadDB extends DBSchema {
  position_size: PreloadDB[keyof PreloadMap];
}

const preloadDB = openDB<PreloadDB>("trading_calculator", 1, {
  upgrade(db) {
    db.createObjectStore("position_size");
  },
});

export async function saveStockPositionSize(data: StockPositionSizePreload) {
  const db = await preloadDB;
  await db.put("position_size", data, "stock");
}

export async function saveForexPositionSize(data: ForexPositionSizePreload) {
  const db = await preloadDB;
  await db.put("position_size", data, "forex");
}

export async function loadStockPositionSize(): Promise<
  StockPositionSizePreload | undefined
> {
  const db = await preloadDB;
  return db.get("position_size", "stock");
}

export async function loadForexPositionSize(): Promise<
  ForexPositionSizePreload | undefined
> {
  const db = await preloadDB;
  return db.get("position_size", "forex");
}
