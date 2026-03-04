import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { CurrentUser } from '../auth/decorators/current-user';
import { User } from '../user/entities/user.entity';
import { UpdateProfileBioDto } from './dto/update-profile-bio.dto';
import { UpdateProfilePhotoDto } from './dto/update-profile-photo.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyProfile(@CurrentUser() user: User) {
    return this.profilesService.findByUserId(user.id);
  }

  @Get(':userId')
  findProfileByUserId(@Param('userId') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/bio')
  updateMyBio(
    @CurrentUser() user: User,
    @Body() updateProfileBioDto: UpdateProfileBioDto,
  ) {
    return this.profilesService.updateBio(user.id, updateProfileBioDto.bio);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/photo')
  updateMyPhoto(
    @CurrentUser() user: User,
    @Body() updateProfilePhotoDto: UpdateProfilePhotoDto,
  ) {
    return this.profilesService.updatePhoto(
      user.id,
      updateProfilePhotoDto.profile_picture_url,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  deleteMyAccount(@CurrentUser() user: User) {
    return this.profilesService.deleteMe(user.id);
  }
}
