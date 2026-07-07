import { Module } from '@nestjs/common';
import { RRHHService } from './rrhh.service';
import { RRHHController } from './rrhh.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { MailModule } from '../mail/mail.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [FirebaseModule, MailModule, FinanceModule],
  controllers: [RRHHController],
  providers: [RRHHService],
})
export class RRHHModule {}
