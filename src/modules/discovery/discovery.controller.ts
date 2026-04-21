import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';
import { User } from '../user/entities/user.entity';
import { DiscoveryService } from './discovery.service';
import { DiscoveryFiltersDto } from './dto/discovery-filters.dto';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get()
  findProfiles(
    @CurrentUser() user: User,
    @Query() discoveryFiltersDto: DiscoveryFiltersDto,
  ) {
    return this.discoveryService.findProfiles({
      currentUserId: user.id,
      filters: discoveryFiltersDto,
    });
  }
}
