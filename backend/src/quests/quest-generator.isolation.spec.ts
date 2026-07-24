import { QuestGeneratorService } from './quest-generator.service';
import { QuestType } from './quest.entity';

/**
 * Regression test for the "Main quest never appears" bug: generateDailyQuestInner()
 * used to run Side -> Voice -> Main as one unguarded await chain sharing a single
 * try/catch far up in QuestsService.findMine(). If Side or Voice generation threw,
 * the whole chain died and Main quest generation never ran at all, even though the
 * failure had nothing to do with Main. This test forces that exact failure and
 * proves Main quest generation still completes.
 */
describe('QuestGeneratorService — Main quest isolation', () => {
  function buildService() {
    const character = {
      id: 'char-1',
      userId: 'user-1',
      timezone: 'Asia/Tashkent',
      level: 1,
      currentStreak: 0,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days into the program
      nextMainQuestAt: null as Date | null,
      nextSideQuestAt: null as Date | null,
      nextVoiceQuestAt: null as Date | null,
    };

    const savedQuests: any[] = [];
    const savedProgress: any[] = [];

    const usersRepo = { find: jest.fn().mockResolvedValue([]) } as any;
    const questsRepo = {
      create: jest.fn((data: any) => ({ id: `quest-${savedQuests.length}`, ...data })),
      save: jest.fn(async (q: any) => {
        savedQuests.push(q);
        return q;
      }),
    } as any;
    const questProgressRepo = {
      find: jest.fn().mockResolvedValue([]), // no active quests of any kind
      findOne: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((data: any) => ({ id: `progress-${savedProgress.length}`, ...data })),
      save: jest.fn(async (p: any) => {
        savedProgress.push(p);
        return p;
      }),
    } as any;
    const charactersService = {
      getByUserId: jest.fn().mockResolvedValue(character),
      saveCharacter: jest.fn().mockResolvedValue(character),
    } as any;

    const service = new QuestGeneratorService(usersRepo, questsRepo, questProgressRepo, charactersService);
    return { service, questsRepo, questProgressRepo, character };
  }

  it('still generates a Main quest even when Side quest generation throws', async () => {
    const { service, questsRepo } = buildService();

    // Force the exact failure mode from the bug report: Side quest generation blows up.
    jest.spyOn(service, 'generateSideQuest').mockRejectedValue(new Error('simulated Side quest failure'));

    await expect(service.generateDailyQuest('user-1')).resolves.not.toThrow();

    const mainQuestCalls = questsRepo.save.mock.calls.filter(([q]: any[]) => q.type === QuestType.MAIN_DAILY);
    expect(mainQuestCalls.length).toBe(1);
  });

  it('still generates a Main quest even when Voice Training generation throws', async () => {
    const { service, questsRepo } = buildService();

    jest.spyOn(service, 'generateVoiceTrainingQuest').mockRejectedValue(new Error('simulated Voice quest failure'));

    await expect(service.generateDailyQuest('user-1')).resolves.not.toThrow();

    const mainQuestCalls = questsRepo.save.mock.calls.filter(([q]: any[]) => q.type === QuestType.MAIN_DAILY);
    expect(mainQuestCalls.length).toBe(1);
  });

  it('generates a Main quest normally when nothing fails', async () => {
    const { service, questsRepo } = buildService();

    await service.generateDailyQuest('user-1');

    const mainQuestCalls = questsRepo.save.mock.calls.filter(([q]: any[]) => q.type === QuestType.MAIN_DAILY);
    const sideQuestCalls = questsRepo.save.mock.calls.filter(([q]: any[]) => q.type === QuestType.SIDE);
    expect(mainQuestCalls.length).toBe(1);
    expect(sideQuestCalls.length).toBe(1);
  });
});
