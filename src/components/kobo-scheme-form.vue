<script setup lang="ts">
import { useKobo } from '@/stores/use-kobo';
import { computed, ref } from 'vue';

const koboStore = useKobo();

const koboSchemeUrl = ref();

const signInUrl = computed(() => {
	const url = new URL('https://authorize.kobo.com/signin');
	for (const [key, value] of Object.entries(koboStore.signInParameters)) {
		url.searchParams.set(key, value);
	}
	return url.toString();
});

function submit() {
	if (!koboSchemeUrl.value) {
		return;
	}
	koboStore.setKoboUrl(koboSchemeUrl.value);
}
</script>
<template>
<form class="d-flex flex-column align-items-center" @submit.prevent="submit">
	<ol>
		<li>Open new private browser window to <a :href="signInUrl">{{ signInUrl }}</a></li>
		<li>Open browser dev tools with F12</li>
		<li>Complete Kobo sign in (should lead to url <code>https://auth.kobobooks.com/CrossDomainSignIn</code> with blank web page)</li>
		<li>Go to Console tab of browser dev tools</li>
		<li>Find final, failed network request that starts with <code>kobo://UserAuthenticated?</code></li>
		<li>Right click failed network request -> Copy -> Copy URL</li>
		<li>Paste url into sign-in form below</li>
	</ol>
	<div style="width: 450px">
		<label class="form-label">Enter kobo-scheme url</label>
		<textarea class="form-control" name="koboSchemeUrl" v-model="koboSchemeUrl" required pattern="kobo://UserAuthenticated\?.*"></textarea>
	</div>
	<div>
		<button type="submit" class="btn btn-primary">Sign In</button>
	</div>
	</form>
</template>
