import multer, { diskStorage } from 'multer';

export class UploadService {
  public readonly multerImageOptions = {
    storage: diskStorage({
      destination: './uploads/images',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = file.originalname.replace(/\s+/g, '-');
        const filename = `${uniqueSuffix}-${originalName}`;
        callback(null, filename);
      },
    }),
    limits: {
      fileSize: 1024 * 1024 * 5, // Maksimum 5MB
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

  public readonly multerExcelOptions = {
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 1024 * 1024 * 5,
    },
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      callback: CallableFunction,
    ) => {
      if (
        !file.mimetype.match(
          /(application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)/,
        )
      ) {
        return callback(new Error('Only Excel files are allowed!'), false);
      }
      callback(null, true);
    },
  };
}
