import * as ExcelJS from 'exceljs';

export interface ColumnConfig {
  header: string;
  key: string;
  width?: number;
  validation?: ExcelJS.DataValidation;
}
