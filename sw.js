const CACHE_NAME = "samoo-cache-v1";

const APP_FILES = [
    "./",
    "./index.html",

    "./css/style.css",
    "./css/files.css",
    "./css/leave.css",
    "./css/theme.css",

    "./js/dateFormat.js",
    "./js/theme.js",
    "./js/firebase-config.js",
    "./js/auth.js",
    "./js/ui.js",
    "./js/app.js",
    "./js/dashboard.js",
    "./js/infractions.js",
    "./js/leave.js",
    "./js/leaveArchive.js",
    "./js/leaveMissions.js",
    "./js/leaveMaintenance.js",
    "./js/leaveDuty.js",
    "./js/pieces.js",
    "./js/statistics.js",
    "./js/notifications.js",
    "./js/search.js",

    "./profile.png"
];

/* تثبيت الملفات الأساسية */
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});

/* تفعيل النسخة الجديدة */
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );

    self.clients.claim();
});

/* التعامل مع الطلبات */
self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    /*
     * ملفات Firebase و Font Awesome الخارجية:
     * إذا كانت موجودة من قبل، استخدم النسخة المحلية.
     * وإذا كان الإنترنت موجودًا، نزّل النسخة الجديدة واحفظها.
     */
    if (
        request.url.includes("gstatic.com") ||
        request.url.includes("cdnjs.cloudflare.com")
    ) {
        event.respondWith(
            caches.match(request).then(cachedResponse => {
                const networkFetch = fetch(request)
                    .then(response => {
                        if (response && response.ok) {
                            const copy = response.clone();

                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, copy);
                            });
                        }

                        return response;
                    })
                    .catch(() => cachedResponse);

                return cachedResponse || networkFetch;
            })
        );

        return;
    }

    /*
     * ملفات Samoo:
     * نحاول الإنترنت أولًا حتى يصل آخر تعديل من GitHub/الاستضافة،
     * وإذا لم يوجد الإنترنت نستخدم النسخة المحلية.
     */
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response && response.ok) {
                    const copy = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, copy);
                    });
                }

                return response;
            })
            .catch(() => {
                return caches.match(request).then(cachedResponse => {
                    return cachedResponse || caches.match("./index.html");
                });
            })
    );
});
