import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ColumnConfig } from './interface/excel-js.interface';

@Injectable()
export class ExcelJsService {
  async generateExcel(
    columns: ColumnConfig[],
    data: any[],
  ): Promise<Buffer | ArrayBuffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 15,
    }));

    if (data && data.length > 0) {
      data.forEach((row) => {
        worksheet.addRow(row);
      });
    }

    worksheet.columns.forEach((column) => {
      let maxLength = column.width ?? 15;

      if (data && data.length > 0) {
        const dataMaxLength = Math.max(
          ...data.map((row) => {
            const cellValue = row[column.key];
            return cellValue ? String(cellValue).length : 0;
          }),
        );
        maxLength = Math.max(maxLength, dataMaxLength);
      }

      column.width = maxLength + 2;
    });

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0070C0' },
      };
    });

    columns.forEach((col) => {
      if (col.validation) {
        worksheet.getColumn(col.key).eachCell((cell, rowNumber) => {
          if (rowNumber !== 1) {
            cell.dataValidation = col.validation;
          }
        });
      }
    });

    return await workbook.xlsx.writeBuffer();
  }
}
