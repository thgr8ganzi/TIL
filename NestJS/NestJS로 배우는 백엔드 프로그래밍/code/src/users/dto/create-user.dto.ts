import {IsEmail, IsString, Matches, MaxLength, MinLength} from "class-validator";
import {Transform} from "class-transformer";
import {BadRequestException} from "@nestjs/common";
import {NotIn} from "../utills/decorator/not-in";

export class CreateUserDto {
  @Transform(params => params.value.trim())
  @NotIn('password', {message:'password 는 name 과 같은 문자열을 포함할수 없습니다.'})
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  readonly name: string;

  @IsString()
  @IsEmail()
  @MaxLength(60)
  readonly email: string;

  // @Transform(({value, obj}) => {
  //   if(obj.password.includes(obj.name.trim())){
  //     throw new BadRequestException('password 와 name 속성은 같은 문자열을 포함할수 없습니다.')
  //   }
  //   return value.trim()
  // })
  @IsString()
  @Matches(/^[A-Za-z\d!@#$%^&*()]{8,30}$/)
  readonly password: string;
}
