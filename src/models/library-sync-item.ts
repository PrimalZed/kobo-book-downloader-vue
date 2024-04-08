import type { AudiobookEntitlement } from './audiobook-entitlement';
import type { BookEntitlement } from './book-entitlement';

export type LibrarySyncItem = {
	NewEntitlement?: AudiobookEntitlement | BookEntitlement,
};
