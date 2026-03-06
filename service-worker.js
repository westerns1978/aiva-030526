const CACHE_NAME = 'aiva-hr-cache-v3'; // Incremented cache version
const APP_SHELL_URLS = [
  // Core
  '/',
  '/index.html',
  '/index.tsx', 
  '/App.tsx',
  '/manifest.json',
  '/favicon.svg',
  '/types.ts',
  
  // Components
  '/components/WelcomeScreen.tsx',
  '/components/EmployeePortal.tsx',
  '/components/StaffDashboard.tsx',
  '/components/StaffDirectory.tsx',
  '/components/HrPortal.tsx',
  '/components/TrainingCenter.tsx',
  '/components/AivaUnifiedChat.tsx',
  '/components/FloatingCoPilotButton.tsx',
  '/components/DocumentHub.tsx',
  '/components/RolePlayTraining.tsx',
  '/components/InterviewCoachModal.tsx',
  '/components/AnnouncementsTicker.tsx',
  '/components/LanguageSelector.tsx',
  '/components/OfflineIndicator.tsx',
  '/components/Toast.tsx',
  '/components/AivaVision.tsx',
  '/components/McpStatusIndicator.tsx',
  '/components/LocationFinderModal.tsx',
  '/components/SharedChatView.tsx',
  '/components/ScanProgressModal.tsx',
  '/components/CertProgressModal.tsx',
  '/components/icons.tsx',
  '/components/Message.tsx',
  '/components/OnboardingJourney.tsx',
  '/components/AdminDashboard.tsx',
  '/components/QrCodeGenerator.tsx',
  '/components/ConfirmationModal.tsx',
  '/components/ProcessMapModal.tsx',
  '/components/TimeAttendanceKiosk.tsx',
  '/components/DeviceHub.tsx',

  // Components (bi_dashboard)
  '/components/bi_dashboard/BusinessIntelligenceDashboard.tsx',
  '/components/bi_dashboard/ExecutiveSummary.tsx',
  '/components/bi_dashboard/BiStatCard.tsx',
  '/components/bi_dashboard/GaugeChart.tsx',
  '/components/bi_dashboard/AiDataChat.tsx',

  // Components (hr_portal)
  '/components/hr_portal/HrContent.tsx',
  '/components/hr_portal/GeminiButton.tsx',
  
  // Components (seasonal_onboarding)
  '/components/seasonal_onboarding/DocumentCamera.tsx',
  '/components/seasonal_onboarding/QRScanner.tsx',
  '/components/seasonal_onboarding/SeasonalWorkerOnboarding.tsx',
  '/components/seasonal_onboarding/StepIndicator.tsx',
  
  // Components (training)
  '/components/training/VideoPlayer.tsx',
  '/components/training/QuizModule.tsx',
  '/components/training/CertificateView.tsx',
  
  // Hooks
  '/hooks/useMediaQuery.ts',
  '/hooks/useOfflineStatus.ts',
  '/hooks/useTextToSpeech.ts',
  '/hooks/useLiveApi.ts',

  // Services
  '/services/geminiService.ts',
  '/services/pdfService.ts',
  '/services/mcpService.ts',
  '/services/ragService.ts',
  '/services/sharingService.ts',
  '/services/mcpApi.ts',
  
  // Lib
  '/lib/audio-streamer.ts',
  '/lib/audio-recorder.ts',
  '/lib/live-utils.ts',
  '/lib/audioUtils.ts',

  // Constants
  '/constants.ts',
  '/constants/personas.ts',
  '/constants/hrConstants.ts',
  '/constants/ragKnowledgeBase.ts',
  '/constants/welcomeContent.ts',
  '/constants/farmWorkers.ts',
  '/constants/announcements.ts',
  '/constants/staffDirectory.ts',
  '/constants/trainingModules.ts',
  '/constants/permanentStaff.ts',
  '/constants/geminiConfig.ts',
  '/constants/team.ts',
  '/constants/biMockData.ts',
  '/constants/seasonalWorkerDirectory.ts',
];
const STATIC_ASSET_URLS = [
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/Aiva.png',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/aiva.mp4',
  'https://storage.googleapis.com/westerns1978-digital-assets/Miscellaneous/camera-shutter.mp3',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/Deon%20Boshoff.jpg',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/sipho.png',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/sipho.mp4',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/ayinda.png',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/ayinda.mp4',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/pietyr.png',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/pietyr.mp4',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/leratro.png',
  'https://storage.googleapis.com/westerns1978-digital-assets/Websites/Afridroids-Bot/maria.png',
];

// On install, cache the app shell and static assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache and caching assets');
      // Cache app shell and static assets separately
      cache.addAll(APP_SHELL_URLS);
      return cache.addAll(STATIC_ASSET_URLS);
    })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of the page immediately
  return self.clients.claim();
});


self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Use a stale-while-revalidate strategy for app shell resources
  if (APP_SHELL_URLS.includes(url.pathname) || url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            // Update the cache with the new response
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          // Return the cached response immediately, and update the cache in the background.
          return cachedResponse || fetchPromise;
        });
      })
    );
  // Use a cache-first strategy for static assets
  } else if (STATIC_ASSET_URLS.some(assetUrl => url.href.startsWith(assetUrl))) {
      event.respondWith(
        caches.match(request).then(cachedResponse => {
            return cachedResponse || fetch(request).then(networkResponse => {
                // If we fetched it, cache it for next time
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
      );
  } else {
    // For all other requests (like API calls), go to the network.
    // This example does not handle API call offline strategies.
    event.respondWith(fetch(request));
  }
});