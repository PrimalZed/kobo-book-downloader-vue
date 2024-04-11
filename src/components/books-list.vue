<script lang="ts" setup>
import { useBookDownload } from '@/composables/use-book-download';
import { useFormatting } from '@/composables/use-formatting';
import { useKobo } from '@/stores/use-kobo';
import { storeToRefs } from 'pinia';

const { books } = storeToRefs(useKobo());

const { downloadKdrm, downloading } = useBookDownload();

const { formatBytes } = useFormatting();
</script>

<template>
<div>
	<h3 v-if="!books">Loading...</h3>
	<ul>
		<li v-for="book of books">
			<h3>{{ book.Title }}</h3>
			<div v-for="contributor of book.ContributorRoles">{{ contributor.Role ?? 'Author' }}: {{ contributor.Name }}</div>
			<div v-if="book.Series">Book {{ book.Series.Number }} - {{ book.Series.Name }}</div>
			<ul>
				<template v-for="downloadUrl of book.DownloadUrls">
					<li>
						{{ downloadUrl.Platform }} {{ downloadUrl.Format }} ({{ formatBytes(downloadUrl.Size) }})
						<a v-if="['None', 'SignedNoDrm'].includes(downloadUrl.DrmType)" :href="downloadUrl.Url">
							Download DRM Free
						</a>
						<template v-else-if="book.RevisionId || book.Id">
							<button
								v-if="downloadUrl.DrmType === 'KDRM'"
								type="button"
								class="btn btn-sm btn-primary"
								:disabled="Boolean(downloading)"
								@click="downloadKdrm((book.RevisionId ?? book.Id)!, downloadUrl.Url, book.Title)">
								<template v-if="downloading === downloadUrl.Url">Downloading...</template>
								<template v-else>Download Decrypted EPUB</template>
							</button>
							<template v-else>{{ downloadUrl.DrmType }}</template>
						</template>
						<template v-else>Error: No Id</template>
					</li>
				</template>
			</ul>
		</li>
	</ul>
</div>
</template>