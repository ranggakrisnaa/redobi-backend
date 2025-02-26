import { diskStorage } from 'multer';

export class UploadService {
  public readonly multerOptions = {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = file.originalname.replace(/\s+/g, '-');
        const filename = `${uniqueSuffix}-${originalName}`;
        callback(null, filename);
      },
    }),
    limits: {
      fileSize: 1024 * 1024 * 5,
    },
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      callback: CallableFunction,
    ) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
  };
}
