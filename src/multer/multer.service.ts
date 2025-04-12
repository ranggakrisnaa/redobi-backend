import multer from 'multer';

export class MulterService {
  public readonly multerImageOptions = {
    storage: multer.memoryStorage(),
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
