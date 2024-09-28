import type { AudiobookEntitlement } from '@/models/audiobook-entitlement';
import type { AudiobookMetadata } from '@/models/audiobook-metadata';
import type { BookEntitlement } from '@/models/book-entitlement';
import type { BookMetadata } from '@/models/book-metadata';
import type { LibrarySyncItem } from '@/models/library-sync-item';
import type { Resources } from '@/models/resources';
import { useInfiniteQuery, useQuery } from '@tanstack/vue-query';
import axios from 'axios';
import { defineStore } from 'pinia';
import { computed, type MaybeRef, watch, ref, readonly } from 'vue';

interface Authentication {
	accessToken: string;
	tokenType: string;
	refreshToken: string;
	userKey?: string;
	trackingId: string;
}
type SyncItem = { kind: 'audiobook', metadata: AudiobookMetadata } | { kind: 'book', metadata: BookMetadata };

export const useKobo = defineStore('kobo', () => {
	const KOBO_AFFILIATE = 'Kobo';
	const APPLICATION_VERSION = '8.11.24971';
	const DEFAULT_PLATFORM_ID = '00000000-0000-0000-0000-000000004000';
	const DISPLAY_PLATFORM = 'Android';

	// region axios
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
	async function authenticateDevice(deviceId: string, oldUserKey?: string): Promise<Authentication> {
		const authenticateDeviceRequest = {
			AffiliateName: KOBO_AFFILIATE,
			AppVersion: APPLICATION_VERSION,
			ClientKey: btoa(DEFAULT_PLATFORM_ID),
			PlatformId: DEFAULT_PLATFORM_ID,
			DeviceId: deviceId,
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
	const deviceId = ref<string>(forgeDeviceId());
	function forgeDeviceId(): string {
		const deviceId = localStorage.getItem('deviceId') ?? crypto.randomUUID();
		if (!localStorage.getItem('deviceId')) {
			localStorage.setItem('deviceId', deviceId);
		}
		return deviceId;
	}

	const koboUrl = ref<string | undefined>(getStorageKoboUrl());
	function getStorageKoboUrl(): string | undefined {
		return localStorage.getItem('koboUrl') ?? undefined;
	}

	const koboUserAuthenticated = computed<{ userId: string, userKey: string} | undefined>(() =>
		koboUrl.value
			? Array.from(new URL(koboUrl.value).searchParams.entries())
				.reduce(
					(acc, [key, value]) => ({
						...acc,
						[key]: value
					}),
					{}
				) as {userId: string, userKey: string}
			: undefined
	);

	const userKey = computed(() => koboUserAuthenticated.value?.userKey);

	const { data: authentications, fetchNextPage: refresh, isError: authenticationFailed } = useInfiniteQuery({
		queryKey: ['kobo', 'authentication', deviceId, computed(() => userKey.value)] satisfies [string, string, MaybeRef<string>, MaybeRef<string | undefined>],
		queryFn: ({ queryKey: [,, deviceId, userKey], pageParam: oldAuthentication }) => (
			oldAuthentication && typeof(oldAuthentication) !== 'number' && (!userKey || oldAuthentication.userKey)
			? refreshAuthentication(oldAuthentication)
			: authenticateDevice(deviceId, userKey)
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
	const authenticated = computed(() => Boolean(authentication.value?.userKey));
	const accessToken = computed(() => authentication.value
		? `${authentication.value.tokenType} ${authentication.value.accessToken}`
		: undefined
	);

	const { data: resources } = useQuery({
		queryKey: ['kobo', 'resources'],
		enabled: computed(() => Boolean(accessToken.value)),
		queryFn: getResources,
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
	function signOut() {
		signingOut.value = true;

		localStorage.clear();
		deviceId.value = forgeDeviceId();
		koboUrl.value = undefined;

		signingOut.value = false;
	}

	watch(koboUrl, (newKoboUrl) => {
		if (newKoboUrl) {
			localStorage.setItem('koboUrl', newKoboUrl);
		}
		else {
			localStorage.removeItem('koboUrl');
		}
	});

	return {
		authenticating: computed(() => Boolean(koboUrl.value) && !authenticated.value && !authenticationFailed.value),
		authenticationFailed,
		authenticated,
		signInParameters: computed(() => ({
			wsa: KOBO_AFFILIATE,
			pwsav: APPLICATION_VERSION,
			pwspid: DEFAULT_PLATFORM_ID,
			pwsdid: deviceId.value,
		})),
		deviceId: readonly(deviceId),
		setKoboUrl: function (value: string) {
			koboUrl.value = value
		},
		userId: computed(() => koboUserAuthenticated.value?.userId),
		audiobooks,
		books,
		signingOut: readonly(signingOut),
		getFileKeys: getContentKeys,
		signOut,
	};
});
