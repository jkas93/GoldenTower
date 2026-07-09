import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { FirebaseService } from '../firebase/firebase.service';

describe('HealthController', () => {
  let controller: HealthController;
  let firebaseService: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: FirebaseService,
          useValue: {
            isInitialized: jest.fn().mockReturnValue(true),
            getInitializationTime: jest.fn().mockReturnValue(250),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    firebaseService = module.get<FirebaseService>(FirebaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return status ok with system info', () => {
      const result = controller.getHealth();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toMatch(/\d+s/);
      expect(result.memory.rss).toMatch(/\d+MB/);
      expect(result.node).toBeDefined();
      expect(result.pid).toBeGreaterThan(0);
    });
  });

  describe('getFirebaseHealth', () => {
    it('should return ok status when firebase is initialized', () => {
      const result = controller.getFirebaseHealth();
      expect(result.status).toBe('ok');
      expect(result.initialized).toBe(true);
      expect(result.initializationTime).toBe('250ms');
    });

    it('should return error status when firebase is not initialized', () => {
      (firebaseService.isInitialized as jest.Mock).mockReturnValueOnce(false);
      (firebaseService.getInitializationTime as jest.Mock).mockReturnValueOnce(null);

      const result = controller.getFirebaseHealth();
      expect(result.status).toBe('error');
      expect(result.initialized).toBe(false);
      expect(result.initializationTime).toBe('N/A');
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed system information', () => {
      const result = controller.getDetailedHealth();
      expect(result.status).toBe('ok');
      expect(result.system).toBeDefined();
      expect(result.system.platform).toBeDefined();
      expect(result.system.arch).toBeDefined();
      expect(result.memory.rss.bytes).toBeGreaterThan(0);
      expect(result.memory.heapTotal.mb).toBeGreaterThan(0);
      expect(result.cpu).toBeDefined();
      expect(result.firebase.initialized).toBe(true);
    });
  });
});
