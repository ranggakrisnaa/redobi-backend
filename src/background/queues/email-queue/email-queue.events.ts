import { QueueName } from '@/constants/job.constant';
import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

@QueueEventsListener(QueueName.EMAIL, { blockingTimeout: 300000 })
export class EmailQueueEvents extends QueueEventsHost {
  private readonly logger = new Logger(EmailQueueEvents.name);

  @OnQueueEvent('added')
  onAdded(job: { jobId: string; name: string }) {
    this.logger.debug(
      `Job ${job.jobId} of type ${job.name} has been added to the queue`,
    );
  }

  @OnQueueEvent('waiting')
  onWaiting(job: { jobId: string; prev?: string }) {
    this.logger.debug(`Job ${job.jobId} is waiting`);
  }

<<<<<<< HEAD
  // @OnQueueEvent('active')
  // onActive(job: { jobId: string; prev?: string }) {
  //   this.logger.debug(
  //     `Job ${job.jobId} is now active; previous status was ${job.prev}`,
  //   );
  // }

  // @OnQueueEvent('completed')
  // onCompleted(job: { jobId: string; returnvalue: string }) {
  //   this.logger.debug(
  //     `Job ${job.jobId} has been completed with result: ${job.returnvalue}`,
  //   );
  // }

  // @OnQueueEvent('failed')
  // onFailed(job: { jobId: string; failedReason: string; prev?: string }) {
  //   this.logger.error(
  //     `Job ${job.jobId} has failed with reason: ${job.failedReason}; previous status was ${job.prev}`,
  //   );
  // }
=======
  @OnQueueEvent('active')
  onActive(job: { jobId: string; prev?: string }) {
    this.logger.debug(
      `Job ${job.jobId} is now active; previous status was ${job.prev}`,
    );
  }

  @OnQueueEvent('completed')
  onCompleted(job: { jobId: string; returnvalue: string }) {
    this.logger.debug(
      `Job ${job.jobId} has been completed with result: ${job.returnvalue}`,
    );
  }

  @OnQueueEvent('failed')
  onFailed(job: { jobId: string; failedReason: string; prev?: string }) {
    this.logger.error(
      `Job ${job.jobId} has failed with reason: ${job.failedReason}; previous status was ${job.prev}`,
    );
  }
>>>>>>> 3044c10309d7ab4acf452f07a1900b4d674b996f
}
