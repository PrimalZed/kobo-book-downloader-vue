import type { AudiobookMetadata } from '@/models/audiobook-metadata';
import type { BookMetadata } from '@/models/book-metadata';

export default function useBookHelpers() {
	function getAuthor(book: AudiobookMetadata | BookMetadata) {
		return book.ContributorRoles.find(c => c.Role === 'Author')?.Name
			?? book.ContributorRoles.find(c => !c.Role)?.Name;
	}

	return {
		getAuthor,
	};
}
