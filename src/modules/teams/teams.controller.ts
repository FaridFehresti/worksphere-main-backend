import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/addd-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  private getUserIdFromReq(req: any): string {
    const user = req.user;
    const userId = user?.id ?? user?.userId ?? user?.sub;

    if (!userId) {
      // console.log('req.user', req.user); // can uncomment to inspect
      throw new UnauthorizedException('User id missing from JWT payload');
    }
    return userId;
  }

  @Post()
  async createTeam(@Req() req: any, @Body() dto: CreateTeamDto) {
    const userId = this.getUserIdFromReq(req);
    return this.teamsService.createTeamForUser(userId, dto);
  }

  @Get()
  async getMyTeams(@Req() req: any) {
    const userId = this.getUserIdFromReq(req);
    return this.teamsService.getTeamsForUser(userId);
  }

  // 🔹 THIS is the route your frontend is calling
 @Post(':teamId/members')
async addMember(
  @Param('teamId') teamId: string,
  @Body() dto: AddMemberDto,
) {
  return this.teamsService.addMember(teamId, dto);
}

  @Get(':teamId/members')
async getMembers(@Param('teamId') teamId: string) {
  return this.teamsService.getMembers(teamId);
}
}
