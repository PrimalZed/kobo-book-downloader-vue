import type { AudiobookEntitlement } from '@/models/audiobook-entitlement';
import type { AudiobookMetadata } from '@/models/audiobook-metadata';
import type { BookEntitlement } from '@/models/book-entitlement';
import type { BookMetadata } from '@/models/book-metadata';
import type { LibrarySyncItem } from '@/models/library-sync-item';
import type { Resources } from '@/models/resources';
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import axios from 'axios';
import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import { computed, type MaybeRef, watch, ref, readonly } from 'vue';

interface Authentication {
	accessToken: string;
	tokenType: string;
	refreshToken: string;
	userKey?: string;
	trackingId: string;
}
interface SignInParameters {
	partnerSignInUrl: string;
	workflowId: string;
	requestVerificationToken: string;
	koboUrl: string;
}
export interface Credentials {
	email: string;
	password: string;
	captcha: string;
}
type SyncItem = { kind: 'audiobook', metadata: AudiobookMetadata } | { kind: 'book', metadata: BookMetadata };

export const useKobo = defineStore('kobo', () => {
	const KOBO_AFFILIATE = 'Kobo';
	const APPLICATION_VERSION = '8.11.24971';
	const DEFAULT_PLATFORM_ID = '00000000-0000-0000-0000-000000004000';
	const DISPLAY_PLATFORM = 'Android';
	const DEVICE_ID = localStorage.getItem('deviceId') ?? uuidv4();
	if (!localStorage.getItem('deviceId')) {
		localStorage.setItem('deviceId', DEVICE_ID);
	}

	// region axios
	const authorizeApi = axios.create({ baseURL: '/kobo/authorize' });
	const koboApi = axios.create({ baseURL: `${import.meta.env.VITE_KOBO_URL}/store` });
	
	koboApi.defaults.headers.common['Content-Type'] = 'application/json';
	
	koboApi.interceptors.request.use(async (config) => {
		config.headers.Authorization = accessToken.value;
		return config;
	});
	
	koboApi.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = error.config;
			if ((error.response.status !== 401 && originalRequest.url === 'v1/auth/device') || originalRequest._retry) {
				return Promise.reject(error);
			}
			originalRequest._retry = true;

			await refresh();

			return koboApi(originalRequest);
		}
	);
	// endregion

	// region api requests
	async function authenticateDevice(oldUserKey?: string): Promise<Authentication> {
		const authenticateDeviceRequest = {
			AffiliateName: KOBO_AFFILIATE,
			AppVersion: APPLICATION_VERSION,
			ClientKey: btoa(DEFAULT_PLATFORM_ID),
			PlatformId: DEFAULT_PLATFORM_ID,
			DeviceId: DEVICE_ID,
			UserKey: oldUserKey,
		};
		const {
			data: {
				AccessToken: accessToken,
				TokenType: tokenType,
				RefreshToken: refreshToken,
				UserKey: userKey,
				TrackingId: trackingId,
			}
		} = await koboApi.post<{
			AccessToken: string;
			TokenType: 'Bearer';
			RefreshToken: string;
			UserKey: string;
			TrackingId: string;
		}>('v1/auth/device', authenticateDeviceRequest);
	
		return {
			accessToken,
			tokenType,
			refreshToken,
			trackingId,
			...oldUserKey ? { userKey } : {},
		};
	}

	async function refreshAuthentication(oldAuthentication: Authentication): Promise<Authentication> {
		const refreshAuthenticationRequest = {
			AppVersion: APPLICATION_VERSION,
			ClientKey: btoa(DEFAULT_PLATFORM_ID),
			PlatformId: DEFAULT_PLATFORM_ID,
			RefreshToken: oldAuthentication.refreshToken
		};

		const {
			data: {
				AccessToken: accessToken, TokenType: tokenType, RefreshToken: refreshToken
			}
		} = await koboApi.post<{ AccessToken: string, TokenType: string, RefreshToken: string }>('v1/auth/refresh', refreshAuthenticationRequest);

		return {
			...oldAuthentication,
			accessToken,
			tokenType,
			refreshToken,
		};
	}

	async function getResources() {
		const { data: { Resources: resources } } = await koboApi.get<{ Resources: Resources }>('v1/initialization');

		const authorizeUrls: (keyof Resources)[] = ['sign_in_page'];
		const storeUrls: (keyof Resources)[] = ['content_access_book', 'library_sync'];
		const rehostedResources = {
			...resources,
			...authorizeUrls.reduce(
				(acc, key) => ({
					...acc,
					[key]: resources[key].replace('https://authorize.kobo.com/', '')
				}),
				{}
			),
			...storeUrls.reduce(
				(acc, key) => ({
					...acc,
					[key]: resources[key].replace('https://storeapi.kobo.com', '')
				}),
				{}
			)
		}

		return {
			signInUrl: rehostedResources.sign_in_page,
			librarySyncUrl: rehostedResources.library_sync,
			getBookAccessUrl: (productId: string) => rehostedResources.content_access_book.replace('{ProductId}', productId),
		};
	}

	async function getSignInParameters(signInUrl: string): Promise<SignInParameters> {
		const params = {
			wsa: KOBO_AFFILIATE,
			pwsav: APPLICATION_VERSION,
			pwspid: DEFAULT_PLATFORM_ID,
			pwsdid: DEVICE_ID,
		};
		
		const { data: signInHtml } = await authorizeApi.get<string>(signInUrl, { params });

		const partnerSignInUrl = new RegExp(/<a class="kobo-link partner-option kobo"\s+href="([^"]+)" onClick=""/).exec(signInHtml)?.[1]!;
		const workflowId = new RegExp(/\?workflowId=([^"]{36})/).exec(partnerSignInUrl)?.[1]!;
		const requestVerificationToken = new RegExp(/<input name="__RequestVerificationToken" type="hidden" value="([^"]+)" \/>/).exec(signInHtml)?.[1]!;
		const koboUrl = new RegExp(/location\.href='(.+)';/).exec(signInHtml)?.[1]!;

		console.log({
			partnerSignInUrl,
			workflowId,
			requestVerificationToken,
			koboUrl,
		});
		return {
			partnerSignInUrl,
			workflowId,
			requestVerificationToken,
			koboUrl,
		};
	}

	async function signIn(
		{ partnerSignInUrl, workflowId, requestVerificationToken, koboUrl: existingKoboUrl }: SignInParameters,
		{ email, password, captcha }: Credentials
	): Promise<{ userId: string, userKey: string }> {
		const koboUrlString = existingKoboUrl
			? existingKoboUrl
			: await (async () => {
				const params = new URLSearchParams({
					'LogInModel.WorkflowId': workflowId,
					'LogInModel.Provider': KOBO_AFFILIATE,
					'ReturnUrl': '',
					'__RequestVerificationToken': requestVerificationToken,
					'LogInModel.UserName': email,
					'LogInModel.Password': password,
					'g-recaptcha-response': captcha,
					'h-captcha-response': captcha,
				})
				const { data: html } = await authorizeApi.post<string>(partnerSignInUrl, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
				// Expecting
				// <script type='text/javascript'>location.href='kobo://UserAuthenticated?userId=########-####-####-####-############&userKey=########-####-####-####-############&email=xxxx%40xxx.xxx&returnUrl=http%3a%2f%2fkobo.com%2f';</script>
				return new RegExp(/location\.href='(.+)';/).exec(html)?.[1]!;
			})();

		if (!koboUrlString) {
			throw 'Sign In Failed';
		}
		const koboUrl = new URL(koboUrlString);
		const userId = koboUrl.searchParams.get('userId');
		const userKey = koboUrl.searchParams.get('userKey');

		if (!userId || !userKey) {
			throw 'Failed parsing koboUrl for userId, userKey';
		}

		return { userId, userKey };
	}

	async function getSyncItems(continuationToken?: string): Promise<SyncItem[]> {
		const { data, headers } = await koboApi.get<LibrarySyncItem[]>(resources.value?.librarySyncUrl!, { headers: { 'x-kobo-synctoken': continuationToken } });

		const audiobooks = data
			.map((syncItem) => syncItem.NewEntitlement)
			.filter((entitlement): entitlement is AudiobookEntitlement | BookEntitlement => Boolean(entitlement))
			.map((entitlement): SyncItem | undefined => {
				if ('AudiobookMetadata' in entitlement) {
					return { kind: 'audiobook', metadata: entitlement.AudiobookMetadata };
				}
				if ('BookMetadata' in entitlement) {
					return { kind: 'book', metadata: entitlement.BookMetadata };
				}
			})
			.filter((x): x is SyncItem => Boolean(x));

		return headers['x-kobo-sync'] === 'continue'
			? audiobooks.concat(await getSyncItems(headers['x-kobo-synctoken']))
			: audiobooks;
	}

	async function getContentKeys(productId: string): Promise<Record<string, string>> {
		const params = new URLSearchParams({
			'DisplayProfile': DISPLAY_PLATFORM
		});
		const bookAccessUrl = resources.value?.getBookAccessUrl(productId)!;
		const { data: bookAccess } = await koboApi.get<{ ContentKeys: { Name: string, Value: string }[] }>(bookAccessUrl, { params });
		return bookAccess.ContentKeys
			.reduce<Record<string, string>>(
				(acc, { Name, Value }) => ({
					...acc,
					[Name]: Value
				}),
				{}
			);
	}
	//endregion

	// region state and queries
	const credentials = ref<Credentials>();
	const initialUser: { userId: string, userKey: string } | undefined = (() => {
		const json = localStorage.getItem('user');
		return json ? JSON.parse(json) : undefined;
	})();
	const userKey = ref<string | undefined>(initialUser?.userKey);

	const { data: authentications, fetchNextPage: refresh } = useInfiniteQuery({
		queryKey: ['kobo', 'authentication', computed(() => userKey.value)],
		queryFn: ({ queryKey: [,, userKey], pageParam: oldAuthentication }) => (
			oldAuthentication && typeof(oldAuthentication) !== 'number' && (!userKey || oldAuthentication.userKey)
			? refreshAuthentication(oldAuthentication)
			: authenticateDevice(userKey)
		),
		initialPageParam: 0,
		getNextPageParam: (oldAuth: Authentication | number) => oldAuth,
		maxPages: 1,
	});

	const authentication = computed(() => {
		const latest = authentications.value?.pages?.[0];
		return latest && typeof latest !== 'number'
			? latest
			: undefined;
	});
	const accessToken = computed(() => authentication.value
		? `${authentication.value.tokenType} ${authentication.value.accessToken}`
		: undefined
	);

	const { data: resources } = useQuery({
		queryKey: ['kobo', 'resources'],
		enabled: computed(() => Boolean(accessToken.value)),
		queryFn: getResources,
	});

	const { data: signInParameters } = useQuery({
		queryKey: ['kobo', 'sign-in-parameters', computed(() => resources.value?.signInUrl!)] satisfies [string, string, MaybeRef<string>],
		enabled: computed(() => Boolean(resources.value?.signInUrl) && Boolean(credentials.value)),
		queryFn: ({ queryKey: [,, signInUrl] }) => getSignInParameters(signInUrl),
	});

	const { data: user } = useQuery({
		queryKey: ['kobo', 'sign-in', signInParameters, credentials] satisfies [string, string, MaybeRef<SignInParameters | undefined>, MaybeRef<Credentials | undefined>],
		enabled: computed(() => Boolean(signInParameters.value) && Boolean(credentials.value)),
		queryFn: ({ queryKey: [,, signInParameters, credentials]}) => signIn(signInParameters!, credentials!),
		throwOnError: true,
		initialData: () => initialUser,
	});

	const { data: syncItems } = useQuery({
		queryKey: ['kobo', 'sync', computed(() => authentication.value?.userKey!)] satisfies [string, string, MaybeRef<string>],
		enabled: computed(() => Boolean(resources.value) && Boolean(authentication.value?.userKey)),
		queryFn: () => getSyncItems(),
		throwOnError: true,
	});
	const audiobooks = computed(() => syncItems.value
		?.filter((syncItem): syncItem is { kind: 'audiobook', metadata: AudiobookMetadata } => syncItem.kind === 'audiobook')
		.map((syncItem) => syncItem.metadata)
	);
	const books = computed(() => syncItems.value
		?.filter((syncItem): syncItem is { kind: 'book', metadata: BookMetadata } => syncItem.kind === 'book')
		.map((syncItem) => syncItem.metadata)
	);
	// endregion

	const signingOut = ref(false);
	async function signOut() {
		signingOut.value = true;
		await authorizeApi.get('us/en/SignOut');

		credentials.value = undefined;
		userKey.value = undefined;
		localStorage.clear();

		signingOut.value = false;
	}

	watch(user, (newUser) => {
		if (newUser) {
			localStorage.setItem('user', JSON.stringify(newUser));
		}
		else {
			localStorage.removeItem('user');
		}
		userKey.value = newUser?.userKey;
	});

	return {
		credentials,
		authenticated: computed(() => Boolean(authentication.value?.userKey)),
		deviceId: computed(() => DEVICE_ID),
		userId: computed(() => user.value?.userId),
		audiobooks,
		books,
		signingOut: readonly(signingOut),
		getFileKeys: getContentKeys,
		signOut,
	};
});
