import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questApi } from '../api/modules/quest.api';

export type { Quest, QuestProgress } from '../api/modules/quest.api';

export function useQuests() {
  const queryClient = useQueryClient();

  const { data: quests, isLoading, error } = useQuery({
    queryKey: ['quests', 'mine'],
    queryFn: questApi.getMine,
    initialData: [],
  });

  // The full quest catalog (story/side/chain quests included) — needed so
  // players can discover and accept quests beyond the auto-generated daily,
  // which /quests/mine alone never surfaces.
  const { data: catalog, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['quests', 'all'],
    queryFn: questApi.getAll,
    initialData: [],
  });

  const acceptedQuestIds = new Set(quests.map((q) => q.questId));
  const available = catalog.filter((q) => !acceptedQuestIds.has(q.id));

  const acceptMutation = useMutation({
    mutationFn: (questId: string) => questApi.accept(questId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests', 'mine'] });
    },
  });

  const progressMutation = useMutation({
    mutationFn: ({ questId, progressAmount }: { questId: string; progressAmount: number }) => 
      questApi.progress(questId, progressAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests', 'mine'] });
    }
  });

  return {
    quests,
    available,
    isLoading,
    isCatalogLoading,
    error,
    acceptQuest: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    progressQuest: progressMutation.mutateAsync,
    isProgressing: progressMutation.isPending
  };
}
