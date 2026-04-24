export interface NotificationHistoryItem {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  userId: string;
  userName: string | null;
}
