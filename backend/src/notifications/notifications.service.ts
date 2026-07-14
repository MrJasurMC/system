import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { EventsGateway } from '@/realtime/events.gateway';

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    private readonly events: EventsGateway,
  ) {}

  async create(userId: string, input: CreateNotificationInput): Promise<Notification> {
    const notification = await this.notifications.save(
      this.notifications.create({ userId, ...input }),
    );
    // §6 WebSocket event: notification:new
    this.events.emitToUser(userId, 'notification:new', notification);
    return notification;
  }

  findForUser(userId: string): Promise<Notification[]> {
    return this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notifications.findOneOrFail({ where: { id, userId } });
    notification.readAt = new Date();
    return this.notifications.save(notification);
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    await this.notifications.delete({ id, userId });
    return { id };
  }

  async removeAll(userId: string): Promise<{ deleted: number }> {
    const result = await this.notifications.delete({ userId });
    return { deleted: result.affected ?? 0 };
  }
}
