export type SearchPeopleCommand = {
  userId: string;
  query: string;
  page: {
    pageSize: number;
    pageToken: string;
  };
};
