import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChronicleEntry, ChronicleType } from './chronicle-entry.entity';
import { EventsGateway } from '@/realtime/events.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationType } from '@/notifications/notification.entity';

@Injectable()
export class ChroniclesService {
  private readonly logger = new Logger(ChroniclesService.name);

  constructor(
    @InjectRepository(ChronicleEntry) private readonly chronicles: Repository<ChronicleEntry>,
    private readonly events: EventsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async logEvent(userId: string, type: ChronicleType, title: string, description: string, metadata?: Record<string, unknown>) {
    const entry = this.chronicles.create({
      userId,
      type,
      title,
      description,
      metadata,
    });
    
    await this.chronicles.save(entry);

    this.logger.log(`Chronicle Logged [${userId}] - ${title}`);

    // Send a system message that a new chronicle entry was recorded, unless it's a quiet event.
    // The spec states: "New Chronicle Entry." as a system message.
    if (type !== ChronicleType.QUEST) {
      await this.notifications.create(userId, {
        type: NotificationType.ACHIEVEMENT, // Reusing achievement type for generic chronicle alerts
        title: 'System Message',
        message: 'New Chronicle Entry.',
        data: { chronicleId: entry.id },
      });
      this.events.emitToUser(userId, 'chronicle:new', entry);
    }

    return entry;
  }

  async getTimeline(userId: string): Promise<ChronicleEntry[]> {
    return this.chronicles.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Checks for story unlocks based on discipline score or other milestones */
  async checkStoryUnlocks(userId: string, disciplineScore: number) {
    // Basic framework for Story Chapters based on discipline score (completed quests, etc.)
    // In a real app this would query a chapters table.
    
    const chapters = [
      {
        id: 'chapter_1',
        title: 'Chapter 1: The Beginning',
        reqScore: 0,
        description: 'The System has detected untapped potential.',
      },
      {
        id: 'chapter_2',
        title: 'Chapter 2: The First Step',
        reqScore: 50, // Arbitrary discipline score to unlock
        description: 'Consistency has been observed.',
      },
      {
        id: 'chapter_3',
        title: 'Chapter 3: Awakening',
        reqScore: 200,
        description: 'The player\'s discipline has exceeded expectations.',
      }
    ];

    for (const chapter of chapters) {
      if (disciplineScore >= chapter.reqScore) {
        // Check if already unlocked
        const exists = await this.chronicles.findOne({
          where: { userId, type: ChronicleType.STORY, title: chapter.title }
        });

        if (!exists) {
          await this.logEvent(userId, ChronicleType.STORY, chapter.title, chapter.description, { chapterId: chapter.id });
          this.events.emitToUser(userId, 'story:unlocked', { title: chapter.title });
        }
      }
    }
  }
}
