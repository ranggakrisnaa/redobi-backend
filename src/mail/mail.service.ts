import { AllConfigType } from '@/config/config.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.resend = new Resend(
      this.configService.get('mail.apiKey', { infer: true }),
    );
  }

  async sendEmailVerification(email: string, token: string) {
    const url = `${this.configService.get('app.url', { infer: true })}/api/v1/auth/verify/email?token=${token}`;

    await this.resend.emails.send({
      from: 'Your App <noreply@yourdomain.com>',
      to: email,
      subject: 'Email Verification',
      html: `
        <p>Hello,</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${url}">${url}</a>
      `,
    });
  }

  async sendEmailOTPCode(email: string, otpCode: number, isUrl: string) {
    const url =
      isUrl === 'user'
        ? `${this.configService.get('app.frontendUrl', { infer: true })}/users/verify`
        : `${this.configService.get('app.frontendUrl', { infer: true })}/verify`;

    await this.resend.emails.send({
      from: 'Your App <noreply@yourdomain.com>',
      to: email,
      subject: 'OTP Verification Code',
      html: `
        <p>Hello,</p>
        <p>Your OTP Code is: <strong>${otpCode}</strong></p>
        <p>Verify here: <a href="${url}">${url}</a></p>
      `,
    });
  }
}
