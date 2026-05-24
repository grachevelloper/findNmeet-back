export function buildSearchQueryPrompt(input: {
  ownerId: string;
  searchQuery: string;
}): string {
  return [
    'Ты анализируешь запрос для поиска людей во VK.',
    'Верни только структурированные поля.',
    'Не придумывай данные, которых нет в запросе.',
    'Если поле неизвестно, оставь его пустым.',
    'Используй relation только из enum VK_RELATION_STATUS_*. ',
    `ownerId: ${input.ownerId}`,
    `query: ${input.searchQuery}`,
  ].join('\n');
}
