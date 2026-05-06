// BLE v1-restart — Chat DTOs.
//
// Shape that crosses the API boundary. Keep in sync with mobile types in
// apps/mobile/types/chat.ts (Lane 3 owns the mobile mirror).

export type MessageKindDto = 'text' | 'verse_share';
export type MessageStatusDto = 'delivered' | 'queued' | 'blocked';
export type SuggestionBasis = 'anchor_verse' | 'whimsy_overlap' | 'generic';

export interface CounterpartSummaryDto {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ThreadListItemDto {
  threadId: string;
  counterpart: CounterpartSummaryDto;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: boolean;
}

export interface ThreadAnchorDto {
  verseRef: string;
  verseText: string;
  attribution: string;
}

export interface ThreadDetailDto {
  threadId: string;
  counterpart: CounterpartSummaryDto;
  anchor: ThreadAnchorDto | null;
  lastMessageAt: string | null;
  archivedAt: string | null;
}

export interface MessageDto {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  kind: MessageKindDto;
  verseRef: string | null;
  status: MessageStatusDto;
  createdAt: string;
}

export interface SuggestionDto {
  id: string;
  text: string;
  basedOn: SuggestionBasis;
}

export interface PaginatedMessagesDto {
  messages: MessageDto[];
  nextCursor: string | null;
}

export interface PaginatedThreadsDto {
  threads: ThreadListItemDto[];
  nextCursor: string | null;
}
