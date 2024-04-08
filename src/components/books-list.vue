<script lang="ts" setup>
import { useBookDownload } from '@/composables/use-book-download';
import { useFormatting } from '@/composables/use-formatting';
import { useKobo } from '@/stores/use-kobo';

const { books } = useKobo();

const { downloadBook, downloading } = useBookDownload();

const { formatBytes } = useFormatting();
</script>

<template>
<div>
	<h3>Books</h3>
	<h4 v-if="!books">Loading...</h4>
	<ul>
		<li v-for="book of books">
			<div>{{ book.Title }}</div>
			<div v-for="contributor of book.ContributorRoles">{{ contributor.Role ?? 'Author' }}: {{ contributor.Name }}</div>
			<div v-if="book.Series">Book {{ book.Series.Number }} - {{ book.Series.Name }}</div>
			<ul>
				<template v-for="downloadUrl of book.DownloadUrls">
					<li>
						{{ downloadUrl.Platform }} {{ downloadUrl.Format }} ({{ formatBytes(downloadUrl.Size) }})
						<a v-if="downloadUrl.DrmType === 'SignedNoDrm'" :href="downloadUrl.Url">
							Download DRM Free
						</a>
						<template v-else-if="book.RevisionId || book.Id">
							<button
								v-if="downloadUrl.DrmType === 'KDRM'"
								type="button"
								:disabled="Boolean(downloading)"
								@click="downloadBook((book.RevisionId ?? book.Id)!, downloadUrl.Url, book.Title)">
								<template v-if="downloading === downloadUrl.Url">Downloading...</template>
								<template v-else>Download</template>
							</button>
						</template>
						<div v-else>DrmType: {{ downloadUrl.DrmType }}</div>
					</li>
				</template>
			</ul>
		</li>
	</ul>
</div>
</template>