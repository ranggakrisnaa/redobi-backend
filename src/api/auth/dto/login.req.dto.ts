<<<<<<< HEAD
import { EmailField, PasswordField } from '@/decorators/field.decorators';
=======
import { EmailField, StringField } from '@/decorators/field.decorators';
>>>>>>> 3044c10309d7ab4acf452f07a1900b4d674b996f

export class LoginReqDto {
  @EmailField()
  email!: string;

<<<<<<< HEAD
  @PasswordField()
=======
  @StringField()
>>>>>>> 3044c10309d7ab4acf452f07a1900b4d674b996f
  password!: string;
}
