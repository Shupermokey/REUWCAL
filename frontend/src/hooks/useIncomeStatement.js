// src/hooks/useIncomeStatement.js
import { usePropertySection } from "./usePropertySection";
import { fetchIncomeStatement, saveIncomeStatementData } from "@/domain/incomeStatement";

export const useIncomeStatement = (uid, propertyId) =>
  usePropertySection(uid, propertyId, fetchIncomeStatement, saveIncomeStatementData);
