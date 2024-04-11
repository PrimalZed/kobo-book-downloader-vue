<script lang="ts" setup>
import { useKobo, type Credentials } from '@/stores/use-kobo';
import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';
import captchaGrabber from './captcha-grabber.vue';

const { credentials, authenticationFailed } = storeToRefs(useKobo());

const username = ref<string | undefined>(credentials.value?.email);
const password = ref<string | undefined>(credentials.value?.password);
const captcha = ref<string | undefined>(credentials.value?.captcha);
const failed = authenticationFailed.value;
const invalid = ref(false);

const newCredentials = computed<Credentials | undefined>(() => 
	username.value && password.value && captcha.value
		? {
			email: username.value,
			password: password.value,
			captcha: captcha.value,
		}
		: undefined
);

function submit() {
	if (!newCredentials.value) {
		invalid.value = true;
		return;
	}
	credentials.value = newCredentials.value;
}

watch(captcha, (newCaptcha) => {
	if (newCaptcha) {
		document.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
	}
});

onMounted(() => {
	credentials.value = undefined;
});
</script>

<template>
<div v-if="failed">Authentication Failed</div>
<div v-if="invalid">Enter username/email, password, and captcha</div>
<form class="d-flex flex-column align-items-center" @submit.prevent="submit">
	<div style="width: 250px">
		<label class="form-label">Username/Email</label>
		<input type="text" class="form-control" name="LogInModel.UserName" v-model="username">
		<label class="form-label">Password</label>
		<input type="password" class="form-control" name="LogInModel.Password" v-model="password">
	</div>
	<div style="width: 400px">
		<captcha-grabber v-if="!captcha" @update:captcha="captcha = $event" />
		<template v-else>
		<label class="form-label">Captcha received</label>
			<pre style="white-space: pre-wrap; word-wrap: break-word;">{{ `${captcha.slice(0, 100)}${captcha.length > 100 ? '...' : ''}` }}</pre>
			<button type="button" class="btn btn-secondary" @click="captcha = undefined">New Captcha</button>
		</template>
	</div>

	<div>
		<button type="submit" class="btn btn-primary">Sign In</button>
	</div>
</form>
</template>
