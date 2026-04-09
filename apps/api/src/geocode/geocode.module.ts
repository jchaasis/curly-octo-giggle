import { Module } from '@nestjs/common';
import { HttpClientModule } from '../infrastructure/clients/http-client.module';
import { GeocodeController } from './geocode.controller';
import { GeocodeService } from './geocode.service';

@Module({
  imports: [HttpClientModule],
  controllers: [GeocodeController],
  providers: [GeocodeService],
  exports: [GeocodeService],
})
export class GeocodeModule {}
