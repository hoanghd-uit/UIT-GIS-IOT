import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @MinLength(3, { message: 'Tên đăng nhập tối thiểu 3 ký tự' })
  @MaxLength(64, { message: 'Tên đăng nhập tối đa 64 ký tự' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(4, { message: 'Mật khẩu tối thiểu 4 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu tối đa 128 ký tự' })
  password: string;
}
