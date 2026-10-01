import { Controller, Get, Param, Header, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { PoliciesGuard } from '../../authorization/policies.guard';
import { RequireAbility } from '../../authorization/require-ability.decorator';
import { DashboardAlertStatusService } from './dashboard-alert-status.service';
import { DashboardAlertEvaluationStatusResponseDto } from './dto/dashboard-alert-evaluation-status-response.dto';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
@UseGuards(SessionAuthGuard, PoliciesGuard)
@RequireAbility('read', 'Dashboard')
export class DashboardAlertController {
  constructor(private readonly alertStatusService: DashboardAlertStatusService) {}

  @Get('buildings/:buildingId/alerts/evaluation-status')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Get Dashboard alert evaluator status and blockers (read-only)',
    description:
      'Returns the current capability, blockers, and authoritative rule count of the in-memory alert evaluator boundary. Read-only, zero database persistence, zero upstream calls when registry is empty.',
  })
  @ApiParam({
    name: 'buildingId',
    example: 'E',
    description: 'Building identifier (currently E only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Alert evaluation status returned successfully',
    type: DashboardAlertEvaluationStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid buildingId (only building E is supported)',
  })
  async getEvaluationStatus(
    @Param('buildingId') buildingId: string,
  ): Promise<DashboardAlertEvaluationStatusResponseDto> {
    return this.alertStatusService.getEvaluationStatus(buildingId);
  }
}
