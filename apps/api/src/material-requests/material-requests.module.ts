import { Module } from '@nestjs/common';
import { MaterialRequestsService } from './material-requests.service';
import { MaterialRequestsController } from './material-requests.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [FirebaseModule, FinanceModule],
  controllers: [MaterialRequestsController],
  providers: [MaterialRequestsService],
  exports: [MaterialRequestsService],
})
export class MaterialRequestsModule {}
