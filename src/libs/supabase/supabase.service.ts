import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'redobi';

  constructor(private configService: ConfigService) {
    const supabase = this.configService.get('supabase');

    if (!supabase?.supabaseUrl || !supabase?.supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabase.supabaseUrl, supabase.supabaseKey);
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    folder: string = '',
  ): Promise<string> {
    const filePath = folder
      ? `${folder}/${Date.now()}-${fileName}`
      : `${Date.now()}-${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, buffer, {
        contentType: this.getMimeType(fileName),
        upsert: true,
      });

    if (error) throw new Error(`Upload gagal: ${error.message}`);

    const { data } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default:
        return 'application/octet-stream';
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) throw new Error(`Gagal hapus file: ${error.message}`);
  }
}
