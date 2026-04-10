import { ApiProperty } from '@nestjs/swagger';
import { Alert } from '@repo/shared';

export class AlertDto implements Alert {
  @ApiProperty({
    description: 'ISO 8601 timestamp when the NOAA Space Weather Center issued this alert',
    example: '2024-03-15T11:00:00Z',
  })
  issue_time: string;

  @ApiProperty({
    description: 'NOAA product identifier for the alert type (e.g. "WATA20", "ALTK06")',
    example: 'ALTK06',
  })
  product_id: string;

  @ApiProperty({
    description: 'Full plain-text body of the space weather alert as issued by NOAA',
    example: 'Space Weather Message Code: ALTK06\nIssue Time: 2024 Mar 15 1100 UTC\n...',
  })
  message: string;
}

export class AlertsResponseDto {
  @ApiProperty({
    description: 'List of active space weather alerts and warnings issued by NOAA',
    type: AlertDto,
    isArray: true,
  })
  alerts: AlertDto[];

}
