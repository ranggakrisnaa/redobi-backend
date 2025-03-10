import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExcelJsService } from 'src/exceljs/excel-js.service';
import { ColumnConfig } from 'src/exceljs/interface/excel-js.interface';

@Injectable()
export class LecturerService {
  constructor(private readonly exceljsService: ExcelJsService) {}

  async GenerateTemplateExcel() {
    const columns = [
      { header: 'Nama Mahasiswa', key: 'fullname' },
      { header: 'NIM', key: 'nim' },
      { header: 'Tahun Masuk', key: 'tahunMasuk' },
      { header: 'Jurusan', key: 'major' },
      { header: 'Judul Skripsi', key: 'judulSkripsi' },
      { header: 'Abstract', key: 'abstract' },
      { header: 'Kelas', key: 'class' },
    ] as ColumnConfig[];

    try {
      return await this.exceljsService.generateExcel(columns, []);
    } catch (err: unknown) {
      if (err instanceof Error)
        throw new InternalServerErrorException(err.message);
    }
  }
}
